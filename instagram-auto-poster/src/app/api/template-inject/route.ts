import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * テンプレートベースの内容注入API
 *
 * リクエスト:
 *   slideType: string          — スライドタイプ
 *   title: string              — タイトル
 *   content: string            — 本文（改行区切り）
 *   brandName?: string         — ブランド名
 *
 * 処理:
 *   1. slideTypeが一致するCanvasTemplateをDBから検索
 *   2. テンプレのテキスト要素にcontentを注入
 *   3. elements + background を返す
 *
 * テンプレがなければ { fallback: true } を返し、呼び出し側でAI生成にフォールバック
 */

interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  [key: string]: unknown;
}

// テキスト要素を役割で分類
function classifyTextElements(elements: CanvasElement[]) {
  const texts = elements.filter((el) => el.type === "text" && el.text);

  // y座標でソート
  const sorted = [...texts].sort((a, b) => a.y - b.y);

  // ブランド名要素: 最上部 y < 60 付近のテキスト
  const brand = sorted.find(
    (el) => el.y < 60 && (el.fontSize || 0) >= 30
  );

  // ヘッダー/タイトル要素: カード内の最初の大きなテキスト (y < 200)
  const header = sorted.find(
    (el) =>
      el !== brand &&
      el.y >= 60 &&
      el.y < 250 &&
      (el.fontSize || 0) >= 30
  );

  // バブル要素: 最下部 y > 850
  const bubble = sorted.find((el) => el.y > 850);

  // コンテンツ要素: ヘッダーとバブルの間にある、パターンで判別
  // 番号付き要素を除外、テキスト内容が実質的なもの
  const contentTexts = sorted.filter(
    (el) =>
      el !== brand &&
      el !== header &&
      el !== bubble &&
      el.y >= 150 &&
      el.y <= 850 &&
      (el.text || "").length > 1 &&
      // 番号だけの要素（01, 02, ☑, ☐, Q, A 等）は除外
      !/^(\d{1,2}|[☑☐QA]|〜.*〜)$/.test((el.text || "").trim())
  );

  return { brand, header, bubble, contentTexts };
}

// slideType別にcontentをパースして配列にする
function parseContent(slideType: string, content: string): string[] {
  const lines = content.split("\n").filter((l) => l.trim());

  switch (slideType) {
    case "list":
    case "ranking":
      // "1. xxx" or "xxx" 形式 → テキスト部分だけ抽出
      return lines.map((l) => l.replace(/^\d+\.\s*/, "").trim());

    case "checklist":
    case "tab-checklist":
      // チェック項目
      return lines.map((l) => l.replace(/^[☑☐✓✗\-•]\s*/, "").trim());

    case "comparison":
      // "成功: xxx | 失敗: yyy" → "xxx" と "yyy"
      return lines.flatMap((l) => {
        const parts = l.split("|").map((p) => p.trim());
        return parts.map((p) => p.replace(/^[^:：]+[:：]\s*/, "").trim());
      });

    case "qa":
      // Q&A形式: "Q: xxx" "A: yyy"
      return lines.map((l) => l.replace(/^[QA][.:：]\s*/i, "").trim());

    case "point-card":
      // ポイント形式
      return lines.map((l) => l.replace(/^\d+\.\s*/, "").replace(/^POINT\s*\d+\s*/i, "").trim());

    default:
      return lines;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slideType, title, content, brandName } = body;

    if (!slideType) {
      return NextResponse.json({ error: "slideType is required" }, { status: 400 });
    }

    // slideTypeが一致するテンプレを検索（最新を優先）
    const template = await prisma.canvasTemplate.findFirst({
      where: { slideType },
      orderBy: { updatedAt: "desc" },
    });

    if (!template) {
      // テンプレなし → フォールバック指示
      return NextResponse.json({ fallback: true });
    }

    // テンプレのcanvasDataをパース
    const canvasData = JSON.parse(template.canvasData);
    const elements: CanvasElement[] = canvasData.elements || [];

    // テキスト要素を分類
    const { brand, header, bubble, contentTexts } = classifyTextElements(elements);

    // 内容をパース
    const contentItems = content ? parseContent(slideType, content) : [];

    // 注入: ブランド名
    if (brand && brandName) {
      brand.text = brandName;
    }

    // 注入: タイトル/ヘッダー
    if (header && title) {
      // coverの場合、タイトルの構造が複雑なので部分的に置換
      if (slideType === "cover") {
        // coverはタイトル要素が複数に分かれている場合がある
        // ヘッダーテキストだけ置換
        header.text = title;
      } else {
        header.text = title;
      }
    }

    // 注入: コンテンツ要素
    // contentTextsをy座標順に並べ、contentItemsを順番に割り当て
    const sortedContent = [...contentTexts].sort((a, b) => a.y - b.y);
    for (let i = 0; i < sortedContent.length && i < contentItems.length; i++) {
      sortedContent[i].text = contentItems[i];
    }

    // 注入: バブル（変更しない、テンプレの吹き出しをそのまま使用）

    return NextResponse.json({
      elements,
      background: canvasData.background,
      templateId: template.id,
      templateName: template.name,
    });
  } catch (error) {
    console.error("Template inject error:", error);
    return NextResponse.json(
      { error: "Template injection failed" },
      { status: 500 }
    );
  }
}
