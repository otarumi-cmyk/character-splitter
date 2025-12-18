# キャラクター自動分割ツール

1枚の画像から、AI（YOLO + rembg）でキャラクターを検出し、
1体ずつ透過 PNG に分割してダウンロードできるローカル用ツールです。

## 構成

- `main.py` : FastAPI ベースの API サーバー
- `static/index.html` : フロントページ（アップロード画面）
- `static/style.css` : 見た目のスタイル
- `static/app.js` : フロント側の挙動（アップロード → API 呼び出し → 結果表示）
- `downloads/` : 実行時に生成されるキャラ PNG と zip を一時保存するディレクトリ

## セットアップ

```bash
cd character-splitter
python3 -m venv .venv
source .venv/bin/activate  # Windows の場合は .venv\\Scripts\\activate
python3 -m pip install --upgrade pip
pip install -r requirements.txt
```

※ 初回起動時に YOLO モデル (`yolov8x-seg.pt`) のダウンロードが走るため、
ある程度の時間とネットワーク環境が必要です。

## 起動方法

```bash
cd character-splitter
uvicorn main:app --reload --port 8000
```

ブラウザで `http://localhost:8000/` を開くと、
キャラクター自動分割ツールのフロントページが表示されます。

## 使い方（簡略）

1. トップ画面で画像（PNG / JPEG）をアップロード
2. 必要があれば「検出の厳しさ」「最大キャラクター数」を調整
3. 「キャラクターを自動分割」を押して処理完了を待つ
4. 下部に表示されたサムネイルから個別 PNG をダウンロード
   または「すべて PNG で一括ダウンロード（zip）」でまとめて取得

生成されたファイルは `downloads/` 配下にセッションごとに保存され、
一定時間（デフォルト 6 時間）経過したものは自動で削除されます（ベストエフォート）。

---

## インターネット上で公開する（デプロイ）

### Render を使う場合（おすすめ・無料プランあり）

1. **GitHub にリポジトリを作成**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <あなたのGitHubリポジトリURL>
   git push -u origin main
   ```

2. **Render でサービスを作成**
   - https://render.com にアクセスしてアカウント作成
   - 「New」→「Web Service」を選択
   - GitHubリポジトリを接続
   - 設定:
     - **Name**: `character-splitter`（任意）
     - **Environment**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - 「Create Web Service」をクリック

3. **環境変数（必要に応じて）**
   - Render の Dashboard → Environment で設定可能

4. **デプロイ完了**
   - 数分待つと、`https://your-app-name.onrender.com` でアクセス可能になります

### Railway を使う場合

1. **GitHub にリポジトリを作成**（上記と同じ）

2. **Railway でプロジェクトを作成**
   - https://railway.app にアクセスしてアカウント作成
   - 「New Project」→「Deploy from GitHub repo」を選択
   - リポジトリを選択

3. **設定**
   - Railway が自動で Python を検出します
   - 必要に応じて環境変数を設定

4. **デプロイ完了**
   - 自動でデプロイされ、URL が発行されます

### その他のデプロイ先

- **Heroku**: `Procfile` が既に用意されています
- **Fly.io**: `fly.toml` を作成してデプロイ
- **Vercel**: Serverless Functions としてデプロイ可能
- **AWS / GCP / Azure**: EC2 / Cloud Run / App Service などでデプロイ可能

### 注意事項

- **無料プランでは制限があります**:
  - リクエスト数や実行時間に制限がある場合があります
  - スリープモードに入る場合があります（初回アクセスが遅い）
- **ファイルストレージ**:
  - `downloads/` ディレクトリは一時的なものなので、定期的にクリーンアップされます
  - 永続化が必要な場合は、S3 などの外部ストレージを使用してください
- **メモリ使用量**:
  - rembg や画像処理はメモリを多く使用するため、無料プランでは制限に引っかかる可能性があります
