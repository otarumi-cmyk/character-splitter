import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getBuiltinTemplate } from "@/lib/builtin-templates";

/**
 * テンプレートベースの内容注入API
 *
 * 1. DBテンプレート → slotMap注入
 * 2. DBになければ → ビルトインテンプレート + slotMap注入
 * → GPT生成には絶対フォールバックしない
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

// === slotMap方式の注入 ===
function injectViaSlotMap(
  elements: CanvasElement[],
  slotMap: Record<string, string>,
  slideType: string,
  title: string | undefined,
  content: string | undefined,
  brandName: string | undefined,
) {
  const findEl = (id: string) => elements.find((e) => e.id === id);
  const setText = (slotId: string, text: string) => {
    const el = findEl(slotId);
    if (el) el.text = text;
  };
  const hideEl = (slotId: string) => {
    const el = findEl(slotId);
    if (el) { el.text = ""; el.opacity = 0; }
  };
  // prefix（例: "cr4"）で始まる全要素を非表示
  const hideByPrefix = (prefix: string) => {
    elements.forEach((el) => {
      if (el.id?.startsWith(prefix)) el.opacity = 0;
    });
  };

  // ブランド名
  if (brandName && slotMap.brand) setText(slotMap.brand, brandName);

  // コンテンツをパース
  const lines = content ? content.split("\n").filter((l) => l.trim()) : [];

  switch (slideType) {
    case "cover": {
      if (title && slotMap.title_line1) {
        // パターン1: "XXXの{N}つのYYY" → 3要素に分割
        const match = title.match(/^(.+?)(\d+)(つの.+)$/);
        if (match) {
          const el1 = findEl(slotMap.title_line1);
          if (el1) {
            el1.text = match[1];
            // title_line1が長い場合フォントサイズ縮小 (デフォルト112px, 920px幅)
            if (match[1].length > 8) {
              const fitSize = Math.floor(920 / (match[1].length * 1.0));
              el1.fontSize = Math.min(112, Math.max(56, fitSize));
            }
          }
          if (slotMap.impact_number) setText(slotMap.impact_number, match[2]);
          if (slotMap.title_line2) setText(slotMap.title_line2, match[3]);
        } else {
          // パターン非マッチ: タイトル全体を1箇所に表示
          const el1 = findEl(slotMap.title_line1);
          if (el1) {
            el1.text = title;
            // 長いタイトルはフォントサイズ縮小
            const maxFontForWidth = Math.floor(920 / (title.length * 1.0));
            el1.fontSize = Math.min(64, Math.max(36, maxFontForWidth));
            el1.textAlign = "center";
            el1.height = 280;
          }
          // 数字要素とタイトル2をクリア
          if (slotMap.impact_number) {
            const numEl = findEl(slotMap.impact_number);
            if (numEl) { numEl.text = ""; numEl.opacity = 0; }
          }
          if (slotMap.title_line2) {
            const t2El = findEl(slotMap.title_line2);
            if (t2El) { t2El.text = ""; t2El.opacity = 0; }
          }
        }
      }
      // banner, subtitle from content lines
      if (lines[0] && slotMap.banner) setText(slotMap.banner, lines[0]);
      if (lines[1] && slotMap.subtitle) setText(slotMap.subtitle, lines[1]);
      if (lines[2] && slotMap.subtitle_bar) setText(slotMap.subtitle_bar, lines[2]);
      break;
    }

    case "list":
    case "checklist":
    case "tab-checklist": {
      if (title && slotMap.header_title) {
        const hEl = findEl(slotMap.header_title);
        if (hEl) {
          hEl.text = title;
          // ヘッダーが長い場合フォントサイズ縮小 (デフォルト40px, ~808px幅)
          if (title.length > 16) {
            hEl.fontSize = Math.max(24, Math.floor(808 / (title.length * 1.0)));
          }
        }
      }
      if (title && slotMap.section_title) setText(slotMap.section_title, title);
      const items = lines.map((l) => l.replace(/^\d+\.\s*/, "").replace(/^[☑☐✓✗\-•]\s*/, "").trim());
      for (let i = 0; i < items.length; i++) {
        const key = `item_${i + 1}`;
        if (slotMap[key]) setText(slotMap[key], items[i]);
      }
      // 未使用項目をクリア（番号+テキスト+区切り線+バッジすべて）
      for (let i = items.length; i < 10; i++) {
        const txtId = slotMap[`item_${i + 1}`];
        if (txtId) {
          // txtIdは "li6_txt" or "ck6_txt" → prefix "li6_" or "ck6_"
          const prefix = txtId.replace(/_txt$/, "_");
          hideByPrefix(prefix);
        }
      }
      break;
    }

    case "comparison": {
      if (title && slotMap.title) setText(slotMap.title, title);
      // lines: "左内容|右内容" or alternating left/right
      const pairs: [string, string][] = [];
      for (const line of lines) {
        if (line.includes("|")) {
          const [l, r] = line.split("|").map((s) => s.replace(/^[^:：]+[:：]\s*/, "").trim());
          pairs.push([l, r || ""]);
        }
      }
      // If no pipe format, treat as alternating
      if (pairs.length === 0) {
        for (let i = 0; i < lines.length; i += 2) {
          pairs.push([
            lines[i]?.replace(/^[^:：]+[:：]\s*/, "").trim() || "",
            lines[i + 1]?.replace(/^[^:：]+[:：]\s*/, "").trim() || "",
          ]);
        }
      }
      for (let i = 0; i < pairs.length; i++) {
        if (slotMap[`row_${i + 1}_l`]) setText(slotMap[`row_${i + 1}_l`], pairs[i][0]);
        if (slotMap[`row_${i + 1}_r`]) setText(slotMap[`row_${i + 1}_r`], pairs[i][1]);
      }
      // 未使用行をクリア（テキスト+区切り線+関連要素すべて）
      for (let i = pairs.length; i < 10; i++) {
        const lId = slotMap[`row_${i + 1}_l`];
        const rId = slotMap[`row_${i + 1}_r`];
        if (lId) { hideEl(lId); hideByPrefix(lId.replace(/_l$/, "_")); }
        if (rId) hideEl(rId);
      }
      break;
    }

    case "qa": {
      if (title && slotMap.section_title) setText(slotMap.section_title, title);
      // lines: "Q: xxx" "A: yyy" alternating
      let qIdx = 1;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/^[Qq][.:：]/i.test(line)) {
          const qText = line.replace(/^[Qq][.:：]\s*/i, "").trim();
          if (slotMap[`q_${qIdx}`]) setText(slotMap[`q_${qIdx}`], qText);
          // Next line should be answer
          if (i + 1 < lines.length && /^[Aa][.:：]/i.test(lines[i + 1].trim())) {
            const aText = lines[i + 1].replace(/^[Aa][.:：]\s*/i, "").trim();
            if (slotMap[`a_${qIdx}`]) setText(slotMap[`a_${qIdx}`], `→${aText}`);
            i++; // skip answer line
          }
          qIdx++;
        }
      }
      break;
    }

    case "ranking": {
      if (title && slotMap.header_title) setText(slotMap.header_title, title);
      // lines: "企業名|説明" or "企業名"
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split("|").map((s) => s.trim());
        if (slotMap[`rank_${i + 1}_name`]) setText(slotMap[`rank_${i + 1}_name`], parts[0] || "");
        if (parts[1] && slotMap[`rank_${i + 1}_desc`]) setText(slotMap[`rank_${i + 1}_desc`], parts[1]);
      }
      break;
    }

    case "point-card": {
      if (title && slotMap.point_title) setText(slotMap.point_title, title);
      // content: first line = point number or detail, rest = explanation
      if (lines[0] && slotMap.series_header) setText(slotMap.series_header, lines[0]);
      if (lines[1] && slotMap.explanation) setText(slotMap.explanation, lines.slice(1).join("\n"));
      else if (lines[0] && slotMap.explanation) setText(slotMap.explanation, lines.join("\n"));
      break;
    }

    case "company-card": {
      // lines: "企業名|年収|人数|概要"
      for (let i = 0; i < lines.length && i < 3; i++) {
        const parts = lines[i].split("|").map((s) => s.trim());
        if (slotMap[`card_${i + 1}_name`]) setText(slotMap[`card_${i + 1}_name`], parts[0] || "");
        if (parts[1] && slotMap[`card_${i + 1}_salary`]) setText(slotMap[`card_${i + 1}_salary`], parts[1]);
        if (parts[2] && slotMap[`card_${i + 1}_count`]) setText(slotMap[`card_${i + 1}_count`], parts[2]);
        if (parts[3] && slotMap[`card_${i + 1}_desc`]) setText(slotMap[`card_${i + 1}_desc`], parts[3]);
      }
      break;
    }

    case "deadline": {
      // lines: "日付|業界|企業名" or structured
      let itemIdx = 1;
      let headerIdx = 1;
      for (const line of lines) {
        const parts = line.split("|").map((s) => s.trim());
        if (parts.length === 1 && /\d+[/月]/.test(parts[0])) {
          // date header
          if (slotMap[`date_header_${headerIdx}`]) setText(slotMap[`date_header_${headerIdx}`], parts[0]);
          headerIdx++;
        } else {
          if (parts[0] && slotMap[`item_${itemIdx}_industry`]) setText(slotMap[`item_${itemIdx}_industry`], parts[0]);
          if (parts[1] && slotMap[`item_${itemIdx}_company`]) setText(slotMap[`item_${itemIdx}_company`], parts[1]);
          itemIdx++;
        }
      }
      break;
    }

    case "cta": {
      if (title && slotMap.heading) setText(slotMap.heading, title);
      if (lines[0] && slotMap.subtitle) setText(slotMap.subtitle, lines[0]);
      if (brandName && slotMap.account_name) setText(slotMap.account_name, brandName);
      break;
    }
  }
}

// === フォールバック: y座標ヒューリスティック ===
function classifyTextElements(elements: CanvasElement[]) {
  const texts = elements.filter((el) => el.type === "text" && el.text);
  const sorted = [...texts].sort((a, b) => a.y - b.y);
  const brand = sorted.find((el) => el.y < 60 && (el.fontSize || 0) >= 30);
  const header = sorted.find(
    (el) => el !== brand && el.y >= 60 && el.y < 250 && (el.fontSize || 0) >= 30,
  );
  const bubble = sorted.find((el) => el.y > 850);
  const contentTexts = sorted.filter(
    (el) =>
      el !== brand && el !== header && el !== bubble &&
      el.y >= 150 && el.y <= 850 &&
      (el.text || "").length > 1 &&
      !/^(\d{1,2}|[☑☐QA]|〜.*〜)$/.test((el.text || "").trim()),
  );
  return { brand, header, bubble, contentTexts };
}

function parseContent(slideType: string, content: string): string[] {
  const lines = content.split("\n").filter((l) => l.trim());
  switch (slideType) {
    case "list":
    case "ranking":
      return lines.map((l) => l.replace(/^\d+\.\s*/, "").trim());
    case "checklist":
    case "tab-checklist":
      return lines.map((l) => l.replace(/^[☑☐✓✗\-•]\s*/, "").trim());
    case "comparison":
      return lines.flatMap((l) => {
        const parts = l.split("|").map((p) => p.trim());
        return parts.map((p) => p.replace(/^[^:：]+[:：]\s*/, "").trim());
      });
    case "qa":
      return lines.map((l) => l.replace(/^[QA][.:：]\s*/i, "").trim());
    case "point-card":
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

    // seedテンプレ優先、なければ通常テンプレ
    const template = await prisma.canvasTemplate.findFirst({
      where: { slideType },
      orderBy: [{ category: "asc" }, { updatedAt: "desc" }], // "seed" < others alphabetically
    });

    let elements: CanvasElement[];
    let slotMap: Record<string, string> | null = null;
    let background: unknown;
    let templateName: string;

    if (template) {
      // DBテンプレートあり
      const canvasData = JSON.parse(template.canvasData);
      elements = canvasData.elements || [];
      background = canvasData.background;
      templateName = template.name;

      if (template.slotMap) {
        slotMap = JSON.parse(template.slotMap);
      }
    } else {
      // DBテンプレートなし → ビルトインテンプレートを使用
      const builtin = getBuiltinTemplate(slideType);
      if (!builtin) {
        return NextResponse.json({ fallback: true });
      }
      elements = builtin.elements as CanvasElement[];
      background = builtin.background;
      slotMap = builtin.slotMap;
      templateName = `builtin-${slideType}`;
    }

    // slotMapがあればslotMap方式、なければy座標ヒューリスティック
    if (slotMap) {
      injectViaSlotMap(elements, slotMap, slideType, title, content, brandName);
    } else {
      // フォールバック: y座標ヒューリスティック
      const { brand, header, contentTexts } = classifyTextElements(elements);
      const contentItems = content ? parseContent(slideType, content) : [];
      if (brand && brandName) brand.text = brandName;
      if (header && title) header.text = title;
      const sortedContent = [...contentTexts].sort((a, b) => a.y - b.y);
      for (let i = 0; i < sortedContent.length && i < contentItems.length; i++) {
        sortedContent[i].text = contentItems[i];
      }
    }

    return NextResponse.json({
      elements,
      background,
      templateName,
    });
  } catch (error) {
    console.error("Template inject error:", error);
    return NextResponse.json({ error: "Template injection failed" }, { status: 500 });
  }
}
