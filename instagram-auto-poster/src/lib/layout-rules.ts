/**
 * Instagram Canvas Layout Rules System
 *
 * 核心ルール:
 * 1. 枠（box）の中のテキストは必ず枠内で中央配置
 * 2. テキストサイズは枠に収まるサイズに自動調整
 * 3. 8pxグリッドスナップ
 * 4. 余白を確保（端っこ埋め切らない）
 * 5. フォント太さは統一（bold or normal のみ）
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type El = any;

// ===========================================
// Canvas & Grid
// ===========================================
export const CANVAS = {
  width: 1080,
  height: 1350,
  padding: 40,
} as const;

// ===========================================
// White Card (メインコンテンツエリア)
// ===========================================
export const CARD = {
  x: 40,
  y: 111,
  width: 1000,
  height: 1002,
  borderRadius: 24,
  padding: 40,
  get contentX() { return this.x + this.padding; },
  get contentY() { return this.y + this.padding; },
  get contentWidth() { return this.width - this.padding * 2; },
  get contentMaxY() { return this.y + this.height - this.padding; },
  get centerX() { return this.x + this.width / 2; },
} as const;

// ===========================================
// Bottom Area (マスコット＋吹き出し)
// ===========================================
export const BOTTOM = {
  y: 1120,
  height: 230,
  bubble: { x: 56, y: 1160, width: 660, height: 100, borderRadius: 20 },
  mascot: { x: 700, y: 878, size: 470 },
} as const;

// ===========================================
// Brand Header
// ===========================================
export const BRAND = {
  x: 240, y: 34, width: 600, height: 48, fontSize: 36,
} as const;

// ===========================================
// Typography Hierarchy
// ===========================================
export const TYPO = {
  hero:       { fontSize: 112, fontWeight: "bold"   as const, lineHeight: 1.1, color: "#1A1A1A" },
  heroNumber: { fontSize: 180, fontWeight: "bold"   as const, lineHeight: 1.0, color: "#CC2B2B" },
  h1:         { fontSize: 56,  fontWeight: "bold"   as const, lineHeight: 1.3, color: "#FFFFFF" },
  h2:         { fontSize: 44,  fontWeight: "bold"   as const, lineHeight: 1.3, color: "#1A1A1A" },
  h3Number:   { fontSize: 50,  fontWeight: "bold"   as const, lineHeight: 1.0, color: "#38BDF8" },
  h3:         { fontSize: 34,  fontWeight: "bold"   as const, lineHeight: 1.4, color: "#1A1A1A" },
  body:       { fontSize: 28,  fontWeight: "bold"   as const, lineHeight: 1.5, color: "#555555" },
  caption:    { fontSize: 22,  fontWeight: "bold"   as const, lineHeight: 1.4, color: "#888888" },
  brand:      { fontSize: 36,  fontWeight: "bold"   as const, lineHeight: 1.2, color: "#FFFFFF" },
  bubble:     { fontSize: 28,  fontWeight: "bold"   as const, lineHeight: 1.4, color: "#FFFFFF" },
  badge:      { fontSize: 18,  fontWeight: "bold"   as const, lineHeight: 1.2, color: "#FFFFFF" },
} as const;

// ===========================================
// Spacing
// ===========================================
export const SPACE = { xs: 8, sm: 16, md: 24, lg: 32, xl: 48, xxl: 64 } as const;

// ===========================================
// Colors
// ===========================================
export const COLOR = {
  teal: "#38BDF8",
  tealDark: "#0EA5E9",
  red: "#CC2B2B",
  white: "#FFFFFF",
  black: "#1A1A1A",
  gray: {
    50: "#F5F5F5", 100: "#E0E0E0", 200: "#CCCCCC", 300: "#AAAAAA",
    400: "#888888", 500: "#666666", 600: "#555555", 700: "#333333",
  },
} as const;

// ===========================================
// Utility
// ===========================================
/** 8pxグリッドスナップ */
export function snap8(v: number): number {
  return Math.round(v / 8) * 8;
}

/** カード内水平中央X */
export function centerX(width: number): number {
  return CARD.x + (CARD.width - width) / 2;
}

export function contentLeft(): number { return 80; }
export function contentWidth(): number { return 920; }

// =====================================================================
//  ★ 核心関数: textInBox — 枠+テキストのペアを正しく生成
//  「枠があったら枠の中央にテキスト」を保証する
// =====================================================================

interface BoxSpec {
  x: number;
  y: number;
  width: number;
  height: number;
  bg: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  zIndex?: number;
  shapeType?: "rounded-rect" | "rect" | "circle";
}

interface TextSpec {
  text: string;
  fontSize: number;
  fontWeight?: "bold" | "normal";
  color: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  fontFamily?: string;
}

type Padding =
  | number
  | { h: number; v: number }
  | { top: number; right: number; bottom: number; left: number };

function normalizePadding(p: Padding) {
  if (typeof p === "number") return { top: p, right: p, bottom: p, left: p };
  if ("h" in p) return { top: p.v, right: p.h, bottom: p.v, left: p.h };
  return p;
}

/**
 * テキストを枠の中央に正しく配置する核心関数
 *
 * - パディングを引いた領域にテキストを収める
 * - fontSizeが枠に収まらない場合、自動的に縮小
 * - テキストは枠内で上下左右中央に配置
 */
export function textInBox(
  box: BoxSpec,
  text: TextSpec,
  ids: { box: string; text: string },
  padding: Padding = { h: 16, v: 8 },
): El[] {
  const pad = normalizePadding(padding);

  // テキスト領域 = 枠 - パディング
  const textX = box.x + pad.left;
  const textY = box.y + pad.top;
  const textW = box.width - pad.left - pad.right;
  const textH = box.height - pad.top - pad.bottom;

  // フォントサイズ自動調整: 枠の高さに収まるか
  const lh = text.lineHeight || 1.3;
  const lines = text.text.split("\n");
  const lineCount = lines.length || 1;
  const maxFontForHeight = Math.floor(textH / (lineCount * lh));
  // 枠の幅に対しても: 最長行で計算（改行考慮）
  const longestLine = lines.reduce((a, b) => a.length > b.length ? a : b, "");
  const charCount = longestLine.length;
  const avgCharWidth = 0.7; // JP混在の平均
  const maxFontForWidth = charCount > 0
    ? Math.floor(textW / (charCount * avgCharWidth))
    : maxFontForHeight;
  const fontSize = Math.min(text.fontSize, maxFontForHeight, Math.max(maxFontForWidth, 10));

  return [
    {
      id: ids.box, type: "shape",
      x: box.x, y: box.y, width: box.width, height: box.height,
      rotation: 0, zIndex: box.zIndex ?? 2, opacity: box.opacity ?? 1,
      shapeType: box.shapeType ?? "rounded-rect",
      backgroundColor: box.bg,
      borderColor: box.borderColor || "transparent",
      borderWidth: box.borderWidth || 0,
      borderRadius: box.borderRadius ?? 8,
    },
    {
      id: ids.text, type: "text",
      x: textX, y: textY, width: textW, height: textH,
      rotation: 0, zIndex: (box.zIndex ?? 2) + 1, opacity: 1,
      text: text.text,
      fontSize,
      fontFamily: text.fontFamily || "Noto Sans JP",
      fontWeight: text.fontWeight || "bold",
      color: text.color,
      textAlign: text.textAlign || "center",
      lineHeight: lh,
    },
  ];
}

// =====================================================================
//  ★ 核心関数: normalizeLayout — AI生成要素の自動補正
//  shape内のtextを検出→中央配置＋サイズ調整
// =====================================================================

/**
 * AI生成された要素配列を後処理:
 * 1. shape内のtextを検出して中央配置
 * 2. fontSizeが枠に合わない場合に自動縮小
 * 3. 8pxグリッドスナップ
 * 4. はみ出し防止
 * 5. fontWeight正規化
 */
export function normalizeLayout(elements: El[]): El[] {
  const result = elements.map((el: El) => ({ ...el }));

  // Step 1: shape一覧を取得（白カード=巨大shapeは除外）
  const shapes = result.filter(
    (e: El) =>
      e.type === "shape" &&
      e.width * e.height < CANVAS.width * CANVAS.height * 0.5, // カード全体をスキップ
  );

  // Step 2: 各textについて、所属するshapeを特定
  for (const text of result) {
    if (text.type !== "text") continue;

    // テキストの中心座標
    const tcx = text.x + text.width / 2;
    const tcy = text.y + text.height / 2;

    // 「一番フィットするshape」を見つける（最小面積で包含するもの）
    let bestContainer: El | null = null;
    let bestArea = Infinity;

    for (const shape of shapes) {
      // テキスト中心がshape内にあるか
      const inside =
        tcx >= shape.x &&
        tcx <= shape.x + shape.width &&
        tcy >= shape.y &&
        tcy <= shape.y + shape.height;
      if (!inside) continue;

      // shapeはtextより後ろ（低いzIndex）であるべき
      if (shape.zIndex >= text.zIndex) continue;

      const area = shape.width * shape.height;
      if (area < bestArea) {
        bestArea = area;
        bestContainer = shape;
      }
    }

    if (!bestContainer) continue;

    // ★ テキストを枠の中央に配置
    const box = bestContainer;

    // パディング: 枠の大きさに応じて調整
    const padH = Math.max(8, Math.round(box.width * 0.06));
    const padV = Math.max(4, Math.round(box.height * 0.12));

    const newX = box.x + padH;
    const newY = box.y + padV;
    const newW = box.width - padH * 2;
    const newH = box.height - padV * 2;

    // テキスト配置を更新
    text.x = newX;
    text.y = newY;
    text.width = Math.max(24, newW);
    text.height = Math.max(16, newH);

    // ★ フォントサイズ自動調整: 枠に収まるか
    const lh = text.lineHeight || 1.3;
    const textLines = (text.text || "").split("\n");
    const textLineCount = textLines.length || 1;
    const maxFontH = Math.floor(newH / (textLineCount * lh));
    if (text.fontSize > maxFontH) {
      text.fontSize = maxFontH;
    }

    // 幅チェック: 最長行が収まるか（改行考慮）
    const longestLine = textLines.reduce((a: string, b: string) => a.length > b.length ? a : b, "");
    const charCount = longestLine.length;
    if (charCount > 0) {
      const avgCharW = 0.7;
      const maxFontW = Math.floor(newW / (charCount * avgCharW));
      if (text.fontSize > maxFontW && maxFontW >= 10) {
        text.fontSize = maxFontW;
      }
    }

    // textAlignがcenterでない場合、中央揃えを検討
    // (短いテキストで幅が十分 → center推奨)
    if (charCount <= 15 && text.textAlign !== "center") {
      text.textAlign = "center";
    }
  }

  // Step 3: 全要素の後処理
  for (const el of result) {
    // 8pxグリッドスナップ
    el.x = snap8(el.x);
    el.y = snap8(el.y);
    el.width = Math.max(24, snap8(el.width));
    el.height = Math.max(16, snap8(el.height));

    // はみ出し防止
    if (el.x < 0) el.x = 0;
    if (el.y < 0) el.y = 0;
    if (el.x + el.width > CANVAS.width) el.width = CANVAS.width - el.x;
    if (el.y + el.height > CANVAS.height) el.height = CANVAS.height - el.y;

    // デフォルト値
    if (!el.rotation) el.rotation = 0;
    if (el.opacity === undefined) el.opacity = 1;
    if (!el.zIndex) el.zIndex = 1;

    // fontWeight正規化
    if (el.type === "text") {
      const fw = String(el.fontWeight || "normal").toLowerCase();
      el.fontWeight = ["bold", "900", "800", "700"].includes(fw) ? "bold" : "normal";
      if (!el.lineHeight) el.lineHeight = 1.3;
      if (!el.textAlign) el.textAlign = "center";
      if (!el.fontFamily) el.fontFamily = "Noto Sans JP";
    }
  }

  return result;
}

// ===========================================
// AI Prompt
// ===========================================
export const LAYOUT_RULES_PROMPT = `
## LAYOUT RULES (配置ルール) — MUST FOLLOW

### CRITICAL: TEXT-IN-BOX RULE (枠内テキスト配置)
When you place text inside a shape (banner, button, badge, header bar, etc.):
1. Text MUST be centered both horizontally and vertically within the shape
2. Text padding: horizontal = shape.width * 6%, vertical = shape.height * 12%
3. Text x = shape.x + padding, text width = shape.width - padding*2
4. Text y = shape.y + padding, text height = shape.height - padding*2
5. fontSize must fit: fontSize ≤ (textHeight / lineHeight)
6. For short text (≤15 chars), always textAlign="center"
7. The text zIndex must be exactly shape.zIndex + 1

Example: shape at {x:80, y:100, w:920, h:64}
→ text at {x:136, y:108, w:808, h:48} with fontSize ≤ floor(48/1.3) = 36

### 1. GRID & MARGINS
- Canvas: 1080x1350px (4:5 aspect ratio)
- ALL coordinates: multiples of 8
- White card: x=40, y=111, w=1000, h=1002, borderRadius=24
- Card inner padding: 40px → content at x=80, y=151, w=920
- Content never below y=1113

### 2. CENTERING
- Full-width centered: x=80, w=920, textAlign="center"
- Narrower centered: x = 40 + (1000 - width) / 2
- Left-aligned (lists): x=80 minimum

### 3. SPACING
- Between elements: min 16px, preferred 24-32px
- Between sections: min 32px
- List items: consistent interval (72-80px)
- Leave 15-20% empty space

### 4. TYPOGRAPHY (use ONLY these combos)
- Hero: 80px bold black (1 per slide)
- Impact number: 120-140px bold RED
- Banner text: 36-40px bold white (MUST fit in banner box)
- Section title: 28-32px bold black
- List number: 36px bold teal
- List text: 22-24px bold black
- Body: 20px normal gray
- Caption: 16px normal light gray
- Badge: 13px bold white (MUST fit in badge box)
- Brand: 30px bold white
- fontWeight: ONLY "bold" or "normal"
- fontFamily: always "Noto Sans JP"

### 5. BRAND & BOTTOM AREA
- Brand text: x=240, y=34, w=600, h=48, centered, white, bold
- Bubble: x=56, y=1160, w=660, h=100
- Bubble text: centered within bubble
- Mascot image: x=700, y=878, w=470, h=470

### 6. Z-INDEX
- z=1: card bg, z=2: shapes, z=3: text, z=4: overlay text, z=5: emphasis, z=10: brand
`;

// =====================================================================
//  Element Builder Helpers (すべてtextInBoxベース)
// =====================================================================

export function makeBrand(text: string, id = "brand") {
  return {
    id, type: "text",
    x: BRAND.x, y: BRAND.y, width: BRAND.width, height: BRAND.height,
    rotation: 0, zIndex: 10, opacity: 1,
    text,
    fontSize: TYPO.brand.fontSize,
    fontFamily: "Noto Sans JP",
    fontWeight: TYPO.brand.fontWeight,
    color: TYPO.brand.color,
    textAlign: "center" as const,
    lineHeight: TYPO.brand.lineHeight,
  };
}

export function makeCard(id = "card") {
  return {
    id, type: "shape",
    x: CARD.x, y: CARD.y, width: CARD.width, height: CARD.height,
    rotation: 0, zIndex: 1, opacity: 1,
    shapeType: "rounded-rect",
    backgroundColor: COLOR.white,
    borderColor: "transparent",
    borderWidth: 0,
    borderRadius: CARD.borderRadius,
  };
}

/** 吹き出し — textInBoxで中央配置保証 */
export function makeBubble(text: string, idPrefix = "bbl") {
  const b = BOTTOM.bubble;
  return [
    ...textInBox(
      { x: b.x, y: b.y, width: b.width, height: b.height, bg: COLOR.tealDark, borderRadius: b.borderRadius, borderColor: COLOR.white, borderWidth: 2 },
      { text, fontSize: TYPO.bubble.fontSize, fontWeight: TYPO.bubble.fontWeight, color: COLOR.white, textAlign: "center" },
      { box: `${idPrefix}_bg`, text: `${idPrefix}_txt` },
      { h: 20, v: 24 },
    ),
    {
      id: `${idPrefix}_mascot`, type: "image",
      x: BOTTOM.mascot.x, y: BOTTOM.mascot.y,
      width: BOTTOM.mascot.size, height: BOTTOM.mascot.size,
      rotation: 0, zIndex: 2, opacity: 1,
      imageUrl: "/uploads/mascot.png",
    },
  ];
}

/** 赤バナー — textInBoxで中央配置保証 */
export function makeBanner(text: string, y: number, id = "banner") {
  return textInBox(
    { x: 80, y, width: 920, height: 100, bg: COLOR.red, borderRadius: 8 },
    { text, fontSize: TYPO.h1.fontSize, fontWeight: TYPO.h1.fontWeight, color: COLOR.white, textAlign: "center", lineHeight: TYPO.h1.lineHeight },
    { box: `${id}_bg`, text: `${id}_txt` },
    { h: 24, v: 8 },
  );
}

/** ティールヘッダー — textInBoxで中央配置保証 */
export function makeHeader(title: string, pageLabel?: string, id = "hdr") {
  const hdrY = CARD.contentY;
  const elements: El[] = textInBox(
    { x: 80, y: hdrY, width: 920, height: 84, bg: COLOR.teal, borderRadius: 12 },
    { text: title, fontSize: 40, fontWeight: "bold", color: COLOR.white, textAlign: "left", lineHeight: 1.3 },
    { box: `${id}_bg`, text: `${id}_txt` },
    { top: 10, right: 80, bottom: 10, left: 32 },
  );

  if (pageLabel) {
    elements.push(
      ...textInBox(
        { x: 900, y: hdrY + 16, width: 56, height: 48, bg: COLOR.white, borderRadius: 24, zIndex: 3 },
        { text: pageLabel, fontSize: 18, fontWeight: "bold", color: COLOR.teal, textAlign: "center", lineHeight: 1.2 },
        { box: `${id}_badge_bg`, text: `${id}_badge_txt` },
        4,
      ),
    );
  }

  return elements;
}

/** 横線セパレーター */
export function makeDivider(y: number, id: string) {
  return {
    id, type: "shape",
    x: 80, y,
    width: 920, height: 1,
    rotation: 0, zIndex: 2, opacity: 0.2,
    shapeType: "rect",
    backgroundColor: COLOR.gray[200],
    borderColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
  };
}

/** 「重要」バッジ — textInBoxで中央配置保証 */
export function makeImportantBadge(x: number, y: number, id: string) {
  return textInBox(
    { x, y, width: 72, height: 36, bg: COLOR.red, borderRadius: 18, zIndex: 4 },
    { text: "重要", fontSize: TYPO.badge.fontSize, fontWeight: TYPO.badge.fontWeight, color: COLOR.white, textAlign: "center", lineHeight: TYPO.badge.lineHeight },
    { box: `${id}_bg`, text: `${id}_txt` },
    { h: 4, v: 3 },
  );
}

/** ピルラベル（比較スライドの成功/失敗ラベル等） */
export function makePill(
  x: number, y: number, width: number, height: number,
  text: string, bg: string, textColor: string,
  id: string,
) {
  return textInBox(
    { x, y, width, height, bg, borderRadius: height / 2, zIndex: 3 },
    { text, fontSize: 25, fontWeight: "bold", color: textColor, textAlign: "center", lineHeight: 1.2 },
    { box: `${id}_bg`, text: `${id}_txt` },
    { h: 12, v: 4 },
  );
}

/** ボタン（CTA用） */
export function makeButton(
  x: number, y: number, width: number, height: number,
  text: string, bg: string, textColor: string,
  id: string,
  fontSize = 34,
) {
  return textInBox(
    { x, y, width, height, bg, borderRadius: height / 2, zIndex: 3 },
    { text, fontSize, fontWeight: "bold", color: textColor, textAlign: "center", lineHeight: 1.2 },
    { box: `${id}_bg`, text: `${id}_txt` },
    { h: 24, v: 8 },
  );
}

/** サブタイトルバー（表紙下部） */
export function makeSubtitleBar(text: string, y: number, id = "stbar") {
  return textInBox(
    { x: 80, y, width: 920, height: 64, bg: COLOR.white, borderRadius: 8, borderColor: COLOR.gray[200], borderWidth: 1, zIndex: 2 },
    { text, fontSize: 22, fontWeight: "bold", color: COLOR.gray[500], textAlign: "center", lineHeight: 1.4 },
    { box: `${id}_bg`, text: `${id}_txt` },
    { h: 16, v: 8 },
  );
}

// =====================================================================
//  追加ヘルパー: point-card / company-card / deadline / tab-section 系
// =====================================================================

/** ポイントカード用：シリーズヘッダー(「＼〇〇〇〇〇／」) */
export function makeSeriesHeader(text: string, y: number, id = "shdr") {
  return {
    id, type: "text",
    x: 80, y, width: 920, height: 52,
    rotation: 0, zIndex: 3, opacity: 1,
    text: `＼${text}／`,
    fontSize: 25, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
    color: COLOR.gray[500], textAlign: "center" as const, lineHeight: 1.2,
  };
}

/** ポイントカード用：番号+タイトル（左にティールアクセントバー） */
export function makePointTitle(
  num: string, title: string, y: number, id = "ptitle",
): El[] {
  return [
    // 左アクセントバー
    {
      id: `${id}_bar`, type: "shape",
      x: 80, y, width: 10, height: 84,
      rotation: 0, zIndex: 3, opacity: 1,
      shapeType: "rect", backgroundColor: COLOR.teal,
      borderColor: "transparent", borderWidth: 0, borderRadius: 4,
    },
    // 番号+テキスト
    {
      id: `${id}_txt`, type: "text",
      x: 104, y, width: 880, height: 84,
      rotation: 0, zIndex: 3, opacity: 1,
      text: `${num}${title}`,
      fontSize: 50, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.black, textAlign: "left" as const, lineHeight: 1.3,
    },
  ];
}

/** ポイントカード用：優先度星 + サブタイトル */
export function makePriorityLine(stars: number, subtitle: string, y: number, id = "prio"): El[] {
  const starStr = "★".repeat(stars) + "☆".repeat(5 - stars);
  return [
    {
      id: `${id}_stars`, type: "text",
      x: 80, y, width: 920, height: 44,
      rotation: 0, zIndex: 3, opacity: 1,
      text: `優先度${starStr}`,
      fontSize: 28, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.red, textAlign: "center" as const, lineHeight: 1.2,
    },
    {
      id: `${id}_sub`, type: "text",
      x: 80, y: y + 48, width: 920, height: 44,
      rotation: 0, zIndex: 3, opacity: 1,
      text: subtitle,
      fontSize: 30, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.teal, textAlign: "center" as const, lineHeight: 1.3,
    },
  ];
}

/** ポイントカード用：ティール説明ボックス */
export function makeExplanationBox(text: string, y: number, height: number, id = "expbox") {
  return textInBox(
    { x: 80, y, width: 920, height, bg: COLOR.teal, borderRadius: 16, borderColor: COLOR.white, borderWidth: 2, zIndex: 2 },
    { text, fontSize: 28, fontWeight: "bold", color: COLOR.white, textAlign: "left", lineHeight: 1.6 },
    { box: `${id}_bg`, text: `${id}_txt` },
    { h: 32, v: 20 },
  );
}

/** イラストプレースホルダー（灰色丸角矩形） */
export function makeIllustrationPlaceholder(x: number, y: number, w: number, h: number, id = "illust") {
  return {
    id, type: "shape",
    x, y, width: w, height: h,
    rotation: 0, zIndex: 2, opacity: 0.15,
    shapeType: "rounded-rect" as const,
    backgroundColor: COLOR.gray[200],
    borderColor: "transparent", borderWidth: 0, borderRadius: 16,
  };
}

/** 企業カード: 1社分（company-card slide用） */
export function makeCompanyCard(
  companyName: string, salary: string, headcount: string, description: string,
  y: number, id: string,
): El[] {
  const cardH = 232;
  return [
    // カード枠
    {
      id: `${id}_frame`, type: "shape",
      x: 96, y, width: 888, height: cardH,
      rotation: 0, zIndex: 2, opacity: 1,
      shapeType: "rounded-rect", backgroundColor: COLOR.white,
      borderColor: COLOR.gray[100], borderWidth: 1, borderRadius: 12,
    },
    // ティールヘッダー
    ...textInBox(
      { x: 96, y, width: 888, height: 56, bg: COLOR.teal, borderRadius: 0, zIndex: 3, shapeType: "rect" as const },
      { text: companyName, fontSize: 30, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
      { box: `${id}_hdr_bg`, text: `${id}_hdr_txt` },
      { h: 16, v: 6 },
    ),
    // 平均年収バッジ + 値
    ...textInBox(
      { x: 112, y: y + 72, width: 140, height: 36, bg: COLOR.teal, borderRadius: 18, zIndex: 3 },
      { text: "平均年収", fontSize: 18, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
      { box: `${id}_sal_badge`, text: `${id}_sal_label` },
      { h: 8, v: 3 },
    ),
    {
      id: `${id}_sal_val`, type: "text",
      x: 264, y: y + 72, width: 200, height: 36,
      rotation: 0, zIndex: 3, opacity: 1,
      text: salary, fontSize: 28, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.red, textAlign: "left" as const, lineHeight: 1.2,
    },
    // 採用人数バッジ + 値
    ...textInBox(
      { x: 504, y: y + 72, width: 140, height: 36, bg: COLOR.tealDark, borderRadius: 18, zIndex: 3 },
      { text: "採用人数", fontSize: 18, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
      { box: `${id}_hc_badge`, text: `${id}_hc_label` },
      { h: 8, v: 3 },
    ),
    {
      id: `${id}_hc_val`, type: "text",
      x: 656, y: y + 72, width: 200, height: 36,
      rotation: 0, zIndex: 3, opacity: 1,
      text: headcount, fontSize: 28, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.black, textAlign: "left" as const, lineHeight: 1.2,
    },
    // 会社概要テキスト
    {
      id: `${id}_desc`, type: "text",
      x: 112, y: y + 124, width: 856, height: 92,
      rotation: 0, zIndex: 3, opacity: 1,
      text: description, fontSize: 22, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.gray[600], textAlign: "left" as const, lineHeight: 1.5,
    },
  ];
}

/** 締切スライド: 業界バッジ付き企業名行 */
export function makeDeadlineItem(
  industry: string, industryColor: string, companyName: string, companyColor: string,
  y: number, id: string,
): El[] {
  return [
    ...textInBox(
      { x: 112, y, width: 112, height: 42, bg: industryColor, borderRadius: 21, zIndex: 3 },
      { text: industry, fontSize: 20, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
      { box: `${id}_ind_bg`, text: `${id}_ind_txt` },
      { h: 8, v: 3 },
    ),
    {
      id: `${id}_name`, type: "text",
      x: 240, y, width: 680, height: 42,
      rotation: 0, zIndex: 3, opacity: 1,
      text: companyName, fontSize: 34, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: companyColor, textAlign: "left" as const, lineHeight: 1.2,
    },
  ];
}

/** タブバー（tab-section用） */
export function makeTabBar(tabs: string[], activeIndex: number, y: number, id = "tabs"): El[] {
  const elements: El[] = [];
  const tabW = Math.floor(920 / tabs.length);
  tabs.forEach((tab, i) => {
    const isActive = i === activeIndex;
    elements.push(
      ...textInBox(
        {
          x: 80 + i * tabW, y, width: tabW, height: 48,
          bg: isActive ? COLOR.teal : COLOR.gray[50],
          borderRadius: 0, zIndex: 4,
          borderColor: COLOR.gray[100], borderWidth: 1,
          shapeType: "rect" as const,
        },
        {
          text: tab, fontSize: 17, fontWeight: isActive ? "bold" : "normal",
          color: isActive ? COLOR.white : COLOR.gray[400],
          textAlign: "center", lineHeight: 1.2,
        },
        { box: `${id}_${i}_bg`, text: `${id}_${i}_txt` },
        { h: 4, v: 4 },
      ),
    );
  });
  return elements;
}

// =====================================================================
//  追加ヘルパー: tagged-list / good-bad / data-table 系
// =====================================================================

/** タグ付きリスト行: 色バッジ + テキスト */
export function makeTaggedRow(
  tag: string, tagColor: string, text: string,
  y: number, id: string,
): El[] {
  return [
    // 色バッジ（pill）
    ...textInBox(
      { x: 96, y: y + 4, width: 120, height: 40, bg: tagColor, borderRadius: 20, zIndex: 3 },
      { text: tag, fontSize: 18, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
      { box: `${id}_tag_bg`, text: `${id}_tag` },
      { h: 6, v: 3 },
    ),
    // テキスト
    {
      id: `${id}_txt`, type: "text",
      x: 232, y, width: 720, height: 48,
      rotation: 0, zIndex: 3, opacity: 1,
      text, fontSize: 30, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.black, textAlign: "left" as const, lineHeight: 1.3,
    },
    // 区切り線
    {
      id: `${id}_div`, type: "shape",
      x: 96, y: y + 52, width: 856, height: 1,
      rotation: 0, zIndex: 2, opacity: 0.15,
      shapeType: "rect" as const, backgroundColor: COLOR.gray[200],
      borderColor: "transparent", borderWidth: 0, borderRadius: 0,
    },
  ];
}

/** 良い例・悪い例パネル */
export function makeExamplePanel(
  emoji: string, label: string, example: string, insight: string,
  y: number, bgColor: string, borderColor: string, id: string,
): El[] {
  const panelH = 340;
  return [
    // パネル背景
    {
      id: `${id}_panel`, type: "shape",
      x: 80, y, width: 920, height: panelH,
      rotation: 0, zIndex: 2, opacity: 1,
      shapeType: "rounded-rect" as const, backgroundColor: bgColor,
      borderColor, borderWidth: 2, borderRadius: 16,
    },
    // ラベル（❌ 悪い例 / ✅ 良い例）
    {
      id: `${id}_lbl`, type: "text",
      x: 104, y: y + 14, width: 880, height: 52,
      rotation: 0, zIndex: 3, opacity: 1,
      text: `${emoji} ${label}`, fontSize: 38, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.black, textAlign: "left" as const, lineHeight: 1.2,
    },
    // 引用テキスト（例）
    {
      id: `${id}_ex`, type: "text",
      x: 104, y: y + 74, width: 872, height: 120,
      rotation: 0, zIndex: 3, opacity: 1,
      text: example, fontSize: 32, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.gray[600], textAlign: "left" as const, lineHeight: 1.5,
    },
    // 解説テキスト
    ...textInBox(
      { x: 104, y: y + 208, width: 872, height: 112, bg: COLOR.white, borderRadius: 8, zIndex: 3, borderColor: COLOR.gray[100], borderWidth: 1 },
      { text: insight, fontSize: 28, fontWeight: "bold", color: COLOR.black, textAlign: "left", lineHeight: 1.4 },
      { box: `${id}_ins_bg`, text: `${id}_ins` },
      { h: 16, v: 8 },
    ),
  ];
}

/** データテーブル行: 企業名 + バッジ + 数値1 + 数値2 */
export function makeDataTableRow(
  name: string, tag: string, tagColor: string, val1: string, val2: string,
  y: number, id: string, isEven: boolean,
): El[] {
  const rowH = 52;
  return [
    // 交互背景
    ...(isEven ? [{
      id: `${id}_row_bg`, type: "shape",
      x: 80, y, width: 920, height: rowH,
      rotation: 0, zIndex: 2, opacity: 1,
      shapeType: "rect" as const, backgroundColor: "#F0F9FF",
      borderColor: "transparent", borderWidth: 0, borderRadius: 0,
    }] : []),
    // 企業名
    {
      id: `${id}_name`, type: "text",
      x: 96, y: y + 4, width: 260, height: 44,
      rotation: 0, zIndex: 3, opacity: 1,
      text: name, fontSize: 26, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.black, textAlign: "left" as const, lineHeight: 1.2,
    },
    // 業種バッジ
    ...textInBox(
      { x: 368, y: y + 8, width: 100, height: 36, bg: tagColor, borderRadius: 18, zIndex: 3 },
      { text: tag, fontSize: 16, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
      { box: `${id}_tag_bg`, text: `${id}_tag` },
      { h: 4, v: 2 },
    ),
    // 数値1
    {
      id: `${id}_v1`, type: "text",
      x: 488, y: y + 4, width: 200, height: 44,
      rotation: 0, zIndex: 3, opacity: 1,
      text: val1, fontSize: 26, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.red, textAlign: "right" as const, lineHeight: 1.2,
    },
    // 数値2
    {
      id: `${id}_v2`, type: "text",
      x: 712, y: y + 4, width: 240, height: 44,
      rotation: 0, zIndex: 3, opacity: 1,
      text: val2, fontSize: 24, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.gray[600], textAlign: "right" as const, lineHeight: 1.2,
    },
  ];
}

/** QA項目：チェック+質問+回答 */
export function makeQAItem(
  question: string, answer: string, y: number, id: string,
): El[] {
  return [
    {
      id: `${id}_chk`, type: "text",
      x: 96, y, width: 48, height: 44,
      rotation: 0, zIndex: 3, opacity: 1,
      text: "✅", fontSize: 30, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.teal, textAlign: "left" as const, lineHeight: 1.0,
    },
    {
      id: `${id}_q`, type: "text",
      x: 152, y, width: 810, height: 44,
      rotation: 0, zIndex: 3, opacity: 1,
      text: question, fontSize: 28, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.black, textAlign: "left" as const, lineHeight: 1.4,
    },
    {
      id: `${id}_a`, type: "text",
      x: 152, y: y + 48, width: 810, height: 64,
      rotation: 0, zIndex: 3, opacity: 1,
      text: `→${answer}`,
      fontSize: 22, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.gray[500], textAlign: "left" as const, lineHeight: 1.5,
    },
  ];
}
