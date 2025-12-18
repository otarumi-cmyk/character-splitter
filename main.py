import io
import logging
import os
import shutil
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from rembg import remove
from scipy import ndimage
from skimage import measure, morphology


# ログ設定（最初に設定）
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ログ設定（最初に設定）
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DOWNLOADS_DIR = BASE_DIR / "downloads"

# ディレクトリが存在することを確認
STATIC_DIR.mkdir(parents=True, exist_ok=True)
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

# デバッグ用ログ
logger.info(f"BASE_DIR: {BASE_DIR}")
logger.info(f"STATIC_DIR: {STATIC_DIR}, exists: {STATIC_DIR.exists()}")
logger.info(f"DOWNLOADS_DIR: {DOWNLOADS_DIR}, exists: {DOWNLOADS_DIR.exists()}")
if STATIC_DIR.exists():
    logger.info(f"Static files: {list(STATIC_DIR.iterdir())}")




def _cleanup_old_sessions(hours: int = 6) -> None:
    """
    一定時間以上前のダウンロード用ディレクトリを削除してディスクを整理する。
    """
    threshold = datetime.now() - timedelta(hours=hours)
    for child in DOWNLOADS_DIR.iterdir():
        try:
            if child.is_dir():
                mtime = datetime.fromtimestamp(child.stat().st_mtime)
                if mtime < threshold:
                    shutil.rmtree(child, ignore_errors=True)
        except OSError:
            continue


app = FastAPI(title="Character Splitter API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静的ファイルのマウント（ディレクトリが存在することを確認）
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
    logger.info(f"Static files mounted at /static from {STATIC_DIR}")
else:
    logger.error(f"Static directory not found: {STATIC_DIR}")

if DOWNLOADS_DIR.exists():
    app.mount("/downloads", StaticFiles(directory=str(DOWNLOADS_DIR)), name="downloads")
    logger.info(f"Downloads mounted at /downloads from {DOWNLOADS_DIR}")
else:
    logger.error(f"Downloads directory not found: {DOWNLOADS_DIR}")


@app.get("/")
async def index() -> FileResponse:
    """
    フロントページ（アップロード画面）を返す。
    """
    index_path = STATIC_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="index.html が見つかりません。")
    return FileResponse(index_path)


def _detect_instances(
    image_path: Path,
    conf_threshold: float,
    max_instances: Optional[int] = None,
) -> List[dict]:
    """
    rembg + 輪郭検出でアニメキャラクターのインスタンスを検出する。
    戻り値: {"bbox": (x1, y1, x2, y2), "mask": 2D bool ndarray} のリスト。
    """
    try:
        logger.info(f"画像を解析中: {image_path}, しきい値: {conf_threshold}")
        
        # 元画像を読み込み
        img = Image.open(image_path).convert("RGBA")
        orig_w, orig_h = img.size
        logger.info(f"元画像サイズ: {orig_w}x{orig_h}")
        
        # rembgで背景を削除
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)
        no_bg_bytes = remove(img_bytes.getvalue())
        no_bg_img = Image.open(io.BytesIO(no_bg_bytes)).convert("RGBA")
        
        # アルファチャンネルをマスクとして使用
        alpha = np.array(no_bg_img)[:, :, 3]
        mask = alpha > 10  # 完全に透明でない部分
        
        if not mask.any():
            logger.warning("背景削除後、前景が検出されませんでした")
            return []
        
        # 小さなノイズを除去
        mask = morphology.remove_small_objects(mask, min_size=100)
        mask = morphology.binary_closing(mask, morphology.disk(3))
        mask = morphology.binary_opening(mask, morphology.disk(2))
        
        # 連結成分ラベリングで各キャラクターを分離
        labeled_mask = measure.label(mask)
        regions = measure.regionprops(labeled_mask)
        
        logger.info(f"検出された連結成分数: {len(regions)}")
        
        instances: List[dict] = []
        for idx, region in enumerate(regions):
            # 最小サイズフィルタ（小さすぎるノイズを除外）
            min_area = (orig_w * orig_h) * 0.001  # 画像の0.1%以上
            if region.area < min_area:
                continue
            
            # バウンディングボックス
            min_row, min_col, max_row, max_col = region.bbox
            x1, y1, x2, y2 = min_col, min_row, max_col, max_row
            
            # この領域のマスクを作成
            region_mask = (labeled_mask == region.label)
            
            # アスペクト比チェック（極端に細長いものは除外）
            width = x2 - x1
            height = y2 - y1
            aspect_ratio = max(width, height) / max(min(width, height), 1)
            if aspect_ratio > 10:  # 極端に細長い場合はスキップ
                logger.debug(f"インスタンス {idx}: アスペクト比が異常 ({aspect_ratio:.2f})、スキップ")
                continue
            
            logger.debug(f"インスタンス {idx}: bbox=({x1},{y1},{x2},{y2}), area={region.area}, aspect={aspect_ratio:.2f}")
            instances.append({"bbox": (x1, y1, x2, y2), "mask": region_mask})
        
        # 面積の大きい順にソート
        instances.sort(key=lambda x: np.sum(x["mask"]), reverse=True)
        
        if max_instances is not None and max_instances > 0:
            instances = instances[:max_instances]
        
        logger.info(f"最終的なインスタンス数: {len(instances)}")
        return instances
    except Exception as e:
        logger.error(f"インスタンス検出中にエラーが発生: {e}", exc_info=True)
        raise


def _normalize_image_size(
    img: Image.Image,
    target_width: int = 512,
    target_height: int = 512,
) -> Image.Image:
    """
    画像を指定サイズに統一し、キャラクターを中央に配置する。
    """
    w, h = img.size
    
    # アスペクト比を保ちながらリサイズ
    scale = min(target_width / w, target_height / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    
    # リサイズ
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # 中央に配置した新しい画像を作成
    normalized = Image.new("RGBA", (target_width, target_height), (0, 0, 0, 0))
    offset_x = (target_width - new_w) // 2
    offset_y = (target_height - new_h) // 2
    normalized.paste(resized, (offset_x, offset_y), resized)
    
    return normalized


def _crop_and_save_instances(
    src_img_path: Path,
    instances: List[dict],
    output_dir: Path,
    normalize_size: Optional[tuple] = None,
) -> List[dict]:
    """
    検出インスタンスごとに透過PNGとして保存し、メタ情報を返す。
    戻り値: {"name", "path", "width", "height"} のリスト。
    """
    base_img = Image.open(src_img_path).convert("RGBA")
    w, h = base_img.size

    meta_list: List[dict] = []
    logger.info(f"切り出し処理を開始: {len(instances)} 個のインスタンス")

    for idx, inst in enumerate(instances, start=1):
        logger.info(f"インスタンス {idx}/{len(instances)} を処理中...")
        x1, y1, x2, y2 = inst["bbox"]
        mask = inst["mask"]

        # 画像サイズ範囲内にクリップ
        x1 = max(0, min(x1, w - 1))
        y1 = max(0, min(y1, h - 1))
        x2 = max(0, min(x2, w))
        y2 = max(0, min(y2, h))

        if x2 <= x1 or y2 <= y1:
            logger.warning(f"インスタンス {idx}: 無効なバウンディングボックス、スキップ")
            continue

        # 元画像をクロップ
        cropped = base_img.crop((x1, y1, x2, y2))
        crop_w, crop_h = cropped.size
        logger.debug(f"インスタンス {idx}: クロップサイズ {crop_w}x{crop_h}")

        # マスクも同領域にクロップ
        mask_cropped = mask[y1:y2, x1:x2]
        
        # マスクとクロップ画像のサイズが一致することを確認
        if mask_cropped.shape[0] != crop_h or mask_cropped.shape[1] != crop_w:
            logger.warning(f"クロップ後のサイズ不一致: 画像={crop_w}x{crop_h}, マスク={mask_cropped.shape}, リサイズします")
            mask_cropped = np.array(Image.fromarray(mask_cropped.astype(np.uint8) * 255).resize((crop_w, crop_h), Image.Resampling.NEAREST)) > 127

        cropped_arr = np.array(cropped)
        if cropped_arr.shape[2] == 3:
            rgba = np.zeros((cropped_arr.shape[0], cropped_arr.shape[1], 4), dtype=np.uint8)
            rgba[..., :3] = cropped_arr
        else:
            rgba = cropped_arr.copy()

        # 輪郭検出で正確なマスクを作成（白い服などが透過されないように）
        mask_uint8 = (mask_cropped * 255).astype(np.uint8)
        
        # 輪郭を検出
        contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            logger.warning(f"インスタンス {idx}: 輪郭が検出されませんでした")
            continue
        
        # 最大の輪郭を取得（メインのキャラクター）
        largest_contour = max(contours, key=cv2.contourArea)
        
        # 輪郭の内側を塗りつぶしたマスクを作成
        refined_mask = np.zeros((crop_h, crop_w), dtype=np.uint8)
        cv2.fillPoly(refined_mask, [largest_contour], 255)
        
        # マスクを少し拡張して、輪郭をきっちり捉える（白い部分も含める）
        kernel = np.ones((5, 5), np.uint8)
        refined_mask = cv2.dilate(refined_mask, kernel, iterations=2)
        refined_mask = cv2.erode(refined_mask, kernel, iterations=1)
        
        # ガウシアンブラーでマスクを滑らかに（境界を自然に）
        refined_mask = cv2.GaussianBlur(refined_mask, (5, 5), 0)
        
        # アルファチャンネルに適用（輪郭の内側は全て不透明、境界は滑らか）
        alpha = refined_mask.astype(np.uint8)
        rgba[..., 3] = alpha

        char_img = Image.fromarray(rgba, mode="RGBA")
        logger.debug(f"インスタンス {idx}: 輪郭ベースのマスク適用完了")

        # 完全透過の外枠をトリミング
        bbox = char_img.getbbox()
        if bbox:
            clean_img = char_img.crop(bbox)
            logger.debug(f"インスタンス {idx}: トリミング後サイズ {clean_img.size}")
        else:
            clean_img = char_img
        
        # サイズ統一オプションが有効な場合
        if normalize_size:
            target_w, target_h = normalize_size
            clean_img = _normalize_image_size(clean_img, target_w, target_h)
            logger.debug(f"インスタンス {idx}: サイズ統一後 {clean_img.size}")

        out_name = f"character_{idx:02d}.png"
        out_path = output_dir / out_name
        clean_img.save(out_path)
        logger.info(f"インスタンス {idx}: 保存完了 -> {out_name} ({clean_img.width}x{clean_img.height})")

        meta_list.append(
            {
                "name": out_name,
                "path": out_path,
                "width": clean_img.width,
                "height": clean_img.height,
            }
        )

    logger.info(f"切り出し処理完了: {len(meta_list)} 個のファイルを保存")
    return meta_list


def _make_zip(session_dir: Path) -> Path:
    """
    セッションディレクトリ内のファイルを ZIP にまとめる。
    """
    try:
        zip_base = session_dir / "characters"
        zip_path = shutil.make_archive(str(zip_base), "zip", root_dir=session_dir, base_dir=".")
        logger.debug(f"ZIP作成成功: {zip_path}")
        return Path(zip_path)
    except Exception as e:
        logger.error(f"ZIP作成エラー: {e}", exc_info=True)
        raise


@app.post("/api/split")
async def split_characters(
    image: UploadFile = File(...),
    conf_threshold: float = Form(0.4),
    max_instances: Optional[int] = Form(None),
    normalize_width: Optional[int] = Form(None),
    normalize_height: Optional[int] = Form(None),
):
    """
    画像からキャラクターインスタンスを検出し、1体ずつ透過PNGとして保存。
    成功時: 検出数・各PNGのURL・ZIPのURLを返す。
    """
    if conf_threshold < 0.05 or conf_threshold > 0.95:
        conf_threshold = max(0.05, min(conf_threshold, 0.95))

    if image.content_type not in {"image/png", "image/jpeg", "image/jpg"}:
        raise HTTPException(status_code=400, detail="PNG または JPEG 形式の画像のみ対応しています。")

    # セッションディレクトリ作成
    session_id = uuid.uuid4().hex
    session_dir = DOWNLOADS_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    try:
        # 元画像を保存
        src_path = session_dir / "source.png"
        raw = await image.read()
        Image.open(io.BytesIO(raw)).convert("RGBA").save(src_path)

        # インスタンス検出
        instances = _detect_instances(src_path, conf_threshold, max_instances=max_instances)
        if not instances:
            raise HTTPException(status_code=400, detail="キャラクターを検出できませんでした。画像や設定を調整してください。")

        # サイズ統一の設定
        normalize_size = None
        if normalize_width and normalize_height:
            normalize_size = (normalize_width, normalize_height)
            logger.info(f"サイズ統一を有効化: {normalize_width}x{normalize_height}")

        # 切り出し・保存
        meta_list = _crop_and_save_instances(src_path, instances, session_dir, normalize_size=normalize_size)
        if not meta_list:
            raise HTTPException(status_code=400, detail="キャラクターの切り出しに失敗しました。")

        # ZIP 作成（一旦スキップしてレスポンスを先に返す）
        logger.info("ZIPファイル作成は後で実行します（レスポンスを先に返却）")
        zip_path = None

        # 古いセッションをクリーンアップ（ベストエフォート）
        _cleanup_old_sessions()

        base_download_url = f"/downloads/{session_id}"
        images_payload = [
            {
                "name": m["name"],
                "url": f"{base_download_url}/{m['name']}",
                "width": m["width"],
                "height": m["height"],
            }
            for m in meta_list
        ]

        response_data = {
            "count": len(images_payload),
            "images": images_payload,
            "session_id": session_id,
        }
        
        if zip_path:
            response_data["zip_url"] = f"{base_download_url}/{zip_path.name}"
        else:
            response_data["zip_url"] = None

        logger.info(f"APIレスポンスを返却: {len(images_payload)} 個の画像")
        try:
            return JSONResponse(response_data)
        except Exception as e:
            logger.error(f"JSONResponse作成エラー: {e}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"detail": "レスポンスの作成に失敗しました"}
            )

    except HTTPException:
        # そのままリレイズ
        raise
    except Exception as exc:  # pragma: no cover - 予期せぬエラー
        logger.error(f"予期せぬエラーが発生: {exc}", exc_info=True)
        try:
            shutil.rmtree(session_dir, ignore_errors=True)
        except:
            pass
        # エラーメッセージを安全に返す
        error_msg = str(exc)[:200]  # 長すぎるエラーメッセージを切り詰め
        return JSONResponse(
            status_code=500,
            content={"detail": f"サーバーエラーが発生しました: {error_msg}"}
        )


@app.get("/health")
async def health() -> dict:
    """
    ヘルスチェック用エンドポイント。
    """
    return {"status": "ok"}


if __name__ == "__main__":  # 手動実行用
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


