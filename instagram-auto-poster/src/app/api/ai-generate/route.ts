import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { LAYOUT_RULES_PROMPT, normalizeLayout } from "@/lib/layout-rules";

async function getOpenAIClient(): Promise<OpenAI> {
  const setting = await prisma.setting.findUnique({ where: { key: "openaiApiKey" } });
  const apiKey = setting?.value || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI APIキーが設定されていません。設定ページからAPIキーを入力してください。");
  }
  return new OpenAI({ apiKey });
}

interface GenerateRequest {
  slideType: "cover" | "list" | "cta" | "comparison" | "checklist" | "point-card" | "company-card" | "deadline" | "tab-checklist" | "qa" | "ranking" | "auto";
  title: string;
  content?: string;
  brandName?: string;
  colorScheme?: "ababa" | "purple" | "blue" | "orange" | "dark" | "green" | "auto";
}

const COLOR_SCHEMES: Record<string, { primary: string; secondary: string; bg: string; accent: string; textLight: string; textDark: string; cardBg: string }> = {
  ababa: { primary: "#38BDF8", secondary: "#0EA5E9", bg: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 40%, #06B6D4 70%, #22D3EE 100%)", accent: "#CC2B2B", textLight: "#FFFFFF", textDark: "#1A1A1A", cardBg: "#FFFFFF" },
  purple: { primary: "#6C5CE7", secondary: "#A855F7", bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", accent: "#FD79A8", textLight: "#FFFFFF", textDark: "#2D3436", cardBg: "#FFFFFF" },
  blue: { primary: "#0984E3", secondary: "#74B9FF", bg: "linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)", accent: "#00CEC9", textLight: "#FFFFFF", textDark: "#2D3436", cardBg: "#FFFFFF" },
  orange: { primary: "#E17055", secondary: "#FDCB6E", bg: "linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)", accent: "#FF7675", textLight: "#FFFFFF", textDark: "#2D3436", cardBg: "#FFFFFF" },
  dark: { primary: "#DFE6E9", secondary: "#B2BEC3", bg: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)", accent: "#6C5CE7", textLight: "#FFFFFF", textDark: "#DFE6E9", cardBg: "#2D3436" },
  green: { primary: "#00B894", secondary: "#55EFC4", bg: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", accent: "#FFEAA7", textLight: "#FFFFFF", textDark: "#2D3436", cardBg: "#FFFFFF" },
};

const ABABA_STYLE_GUIDE = `
## ABABA-STYLE DESIGN SYSTEM (learned from @ababa_official Instagram)

You MUST follow this exact layout system based on real @ababa_official posts:

${LAYOUT_RULES_PROMPT}

### UNIVERSAL LAYOUT RULES:
- Canvas: 1080x1350px (4:5 aspect ratio)
- Background: solid teal/turquoise (#38BDF8)
- White rounded-rect card: x=40, y=110, w=1000, h=1000, borderRadius=24 (main content area)
- Card inner padding: 40px — content area starts at x=80, y=150, max width=920
- Brand name (or user brand): top center, x=240, y=34, w=600, fontSize=36, bold, white
- Bottom area (y=1120~1350):
  - Speech bubble: rounded-rect, x=56, y=1160, w=660, h=100, bg=#0EA5E9, border=2px white, borderRadius=20
  - Bubble text: x=76, y=1184, w=620, fontSize=20, bold, white, centered
  - Mascot image: x=700, y=878, w=470, h=470

### COVER SLIDE (表紙):
Layout from top to bottom inside white card:
1. Red banner: x=80, y=104, w=920, h=80, borderRadius=8
   - Banner text: centered inside, fontSize=40, bold, white
2. Hero title: x=80, y=208, w=920, centered, fontSize=80, bold, black
   - Key numbers: fontSize=140, bold, RED (#CC2B2B)
   - Text next to number: fontSize=80, bold, black, left-aligned
3. Decorative line: centered, w=600, h=4, teal, opacity=0.3
4. Sub-catch: centered, fontSize=28, bold, teal
5. Subtitle bar at bottom: x=80, y=784, w=920, h=48, borderRadius=8, border=1px gray
   - Subtitle text: centered, fontSize=16, normal, gray

### LIST SLIDE (リスト型):
1. Teal header bar: x=80, y=100, w=920, h=64, borderRadius=12
   - Title: x=112, y=110, fontSize=28, bold, white, left-aligned
   - Page badge: x=904, y=112, w=48, h=40, white pill, fontSize=14 teal text
2. List items (start y=258, spacing=72px per item):
   - Number: x=96, fontSize=36, bold, teal, left-aligned
   - Text: x=168, fontSize=24, bold, black, left-aligned
   - Divider: x=80, w=920, h=1, opacity=0.2
   - "重要" badge: x=880, w=56, h=28, red pill, fontSize=13 white

### COMPARISON SLIDE (比較型):
1. Title: x=80, y=104, w=920, centered, fontSize=32, bold, black
2. Vertical divider: x=540, y=168, w=2, gray, opacity=0.2
3. Left column: x=80, w=432 — teal label pill at top
4. Right column: x=548, w=432 — red label pill at top
5. Rows: consistent spacing (104px), items centered in each column, fontSize=22

### CHECKLIST SLIDE (チェックリスト型):
1. Teal header bar: same as list slide
2. Check items (start y=192, spacing=64px):
   - Checkmark: x=96, w=40, fontSize=28 (☑=teal, ☐=gray)
   - Text: x=152, fontSize=24, bold for checked items, normal+gray for unchecked
   - Divider line between each item

### CTA SLIDE (最終ページ):
1. Headline: x=80, y=120, w=920, centered, fontSize=44, bold, black
2. Subtext: centered, fontSize=20, normal, gray
3. Profile area: centered card (w=720, h=240, gray bg), contains:
   - Icon circle + account name + description
4. Follow button: centered, w=480, h=56, red, borderRadius=28, fontSize=24
5. Benefits: centered, fontSize=20, normal, gray, lineHeight=1.8

### POINT-CARD SLIDE (ポイント解説型):
1. Series header: centered, "＼title／", fontSize=18, gray
2. Left teal accent bar (8px wide) + "①Topic" title, fontSize=36, bold
3. Priority: "優先度★★★★★" in red + subtitle in teal, centered
4. Illustration placeholder: gray rounded-rect, centered
5. Teal explanation box: x=80, w=920, borderRadius=16, white text 20px
6. Bottom mascot speech bubble

### COMPANY-CARD SLIDE (企業カード型):
1. Page tab navigation at top (01-07 style)
2. 3 company cards per page, each with:
   - Teal header: company name (white, centered)
   - Stats: "平均年収" badge (teal) + red value, "採用人数" badge + value
   - Description: gray 16px text
   - Frame: light border, borderRadius=12
3. Bottom mascot speech bubble

### DEADLINE SLIDE (締切一覧型):
1. Date header bars: teal, w=888, h=52, borderRadius=8
2. Company items under each date:
   - Industry pill badge (colored by industry type)
   - Company name: bold 24px
   - Spacing: 56px per item
3. Bottom mascot speech bubble

### TAB-CHECKLIST SLIDE (タブ型チェックリスト):
1. Tab bar: 6 tabs across top, active=teal bg
2. Big light number ("01") as watermark, opacity=0.12
3. Section title in teal box (w=520, h=56)
4. Illustration placeholder: gray rounded-rect
5. "チェックリスト" teal pill
6. Checklist items: teal checkmarks, bold text, dividers
7. Bottom mascot speech bubble

### QA SLIDE (Q&A一覧型):
1. Optional tab bar at top
2. Teal header: title (w=888, h=56)
3. Q&A items (spacing ~112px):
   - ✅ checkmark + question (bold 20px, key phrases in teal)
   - →answer below (gray 16px)
4. Bottom mascot speech bubble

### RANKING SLIDE (ランキング型):
1. Teal header bar with title + page badge
2. Ranked items (6 per page):
   - Top 3: medal emoji 🥇🥈🥉 + name + description
   - Others: teal number + name + description
   - Divider lines between items
3. Bottom mascot speech bubble
`;

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json();
    const { slideType, content, brandName, colorScheme } = body;
    const title = body.title || "";

    if (!title && !slideType) {
      return NextResponse.json({ error: "title or slideType is required" }, { status: 400 });
    }

    const scheme = colorScheme && colorScheme !== "auto" ? COLOR_SCHEMES[colorScheme] : COLOR_SCHEMES.ababa;
    const brand = brandName || "@your_account";

    const systemPrompt = `You are an expert Instagram visual designer that replicates the exact style of @ababa_official — a Japanese career/job-hunting Instagram account with 1.7万 followers.

${ABABA_STYLE_GUIDE}

You generate canvas element layouts for 1080x1350px Instagram posts (4:5 aspect ratio).

You MUST return ONLY a valid JSON array of canvas elements. No explanation, no markdown, no code fences. Just the raw JSON array.

Each element must have these fields:
{
  "id": string (unique, like "el_1", "el_2"),
  "type": "text" | "shape",
  "x": number (0-1080),
  "y": number (0-1350),
  "width": number,
  "height": number,
  "rotation": 0,
  "zIndex": number (higher = on top),
  "opacity": number (0-1),
  // For text:
  "text": string,
  "fontSize": number (14-140),
  "fontFamily": "Noto Sans JP",
  "fontWeight": "bold" | "normal",
  "color": string (hex),
  "textAlign": "left" | "center" | "right",
  "lineHeight": number (1.0-1.8),
  // For shape:
  "shapeType": "rect" | "circle" | "rounded-rect" | "line",
  "backgroundColor": string (hex),
  "borderColor": string (hex or "transparent"),
  "borderWidth": number,
  "borderRadius": number
}

Color scheme:
- Primary (teal): ${scheme.primary}
- Secondary: ${scheme.secondary}
- Accent (red): ${scheme.accent}
- Card background: ${scheme.cardBg}
- Light text: ${scheme.textLight}
- Dark text: ${scheme.textDark}

Brand name: ${brand}`;

    let userPrompt = "";

    if (slideType === "cover" || slideType === "auto") {
      userPrompt = `Create a COVER slide (表紙) in exact ABABA style:

Title: "${title}"
${content ? `Subtitle/Description: "${content}"` : ""}
Brand: "${brand}"

Follow the COVER SLIDE rules from the style guide exactly:
1. Teal background (#38BDF8) with brand name at top
2. Large white rounded card as main area
3. Red banner with keyword
4. HUGE bold black title text (key numbers in RED, extremely large)
5. Bottom subtitle bar with description
6. Bottom teal area for mascot speech bubble

Make the text hierarchy very strong — the most important words should be 80-120px, secondary 40-56px.
Return ONLY the JSON array.`;
    } else if (slideType === "list") {
      const items = content ? content.split("\n").filter(Boolean) : [];
      userPrompt = `Create a LIST slide (リスト型) in exact ABABA style:

Header: "${title}"
Items:
${items.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Follow the LIST SLIDE rules from the style guide exactly:
1. Teal bg + brand at top
2. White card with header bar (teal) containing title + page number badge
3. ${Math.min(items.length, 6)} numbered items with teal numbers, black text, dotted separators
4. Mark 1-2 items as "重要" with a small red badge
5. Bottom mascot speech bubble area

Numbers should be teal (#38BDF8), fontSize=40, bold. Item text black, 22-26px.
Return ONLY the JSON array.`;
    } else if (slideType === "comparison") {
      const sides = content ? content.split("\n").filter(Boolean) : [];
      const leftItems = sides.filter((_, i) => i % 2 === 0);
      const rightItems = sides.filter((_, i) => i % 2 === 1);
      userPrompt = `Create a COMPARISON slide (比較型) in exact ABABA style:

Title: "${title}"
Left column items: ${leftItems.join(", ")}
Right column items: ${rightItems.join(", ")}

Follow the COMPARISON SLIDE rules from the style guide:
1. Teal bg + brand at top
2. White card split into two columns with vertical divider
3. Left: RED label badge + content
4. Right: BLUE/TEAL label badge + content
5. Bottom explanation box + mascot area

Return ONLY the JSON array.`;
    } else if (slideType === "checklist") {
      const items = content ? content.split("\n").filter(Boolean) : [];
      userPrompt = `Create a CHECKLIST slide (チェックリスト型) in exact ABABA style:

Section title: "${title}"
Checklist items:
${items.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Follow the CHECKLIST SLIDE rules from the style guide:
1. Teal bg + brand at top
2. Tab navigation bar at top of card
3. Section header with number + title on teal bg
4. Checklist items with teal checkmarks, key phrases in RED/TEAL bold
5. Sub-explanations in smaller gray text
6. Bottom mascot speech bubble

Return ONLY the JSON array.`;
    } else if (slideType === "cta") {
      userPrompt = `Create a CTA slide (最終ページ) in exact ABABA style:

CTA headline: "${title}"
${content ? `Description: "${content}"` : ""}
Brand: "${brand}"

Follow the CTA SLIDE rules from the style guide:
1. Eye-catching headline at top
2. Service flow diagram / before-after comparison in middle
3. Profile screenshot placeholder area
4. "登録はプロフURLから" button (red/pink rounded-rect)
5. Large bottom CTA: "完全無料！今すぐ登録" white text on red/pink bg
6. Brand name

Return ONLY the JSON array.`;
    } else if (slideType === "point-card") {
      userPrompt = `Create a POINT-CARD slide (ポイント解説型) in exact ABABA style:

Series title: "${title}"
${content ? `Point details: "${content}"` : ""}

This is an inner slide for a tips/points carousel. Layout:
1. Teal bg + brand at top
2. White card
3. Series header at top: "＼${title}／" in small gray text, centered
4. Left teal accent bar (8px wide) + number + topic title in bold black, 36px
5. Priority stars row: "優先度★★★★★" in red + subtitle in teal, centered
6. Gray rounded-rect illustration placeholder in center area
7. Large teal rounded box at bottom (w=920, borderRadius=16) with explanation text in white, 20px, left-aligned, lineHeight=1.6
8. Bottom mascot speech bubble

Return ONLY the JSON array.`;
    } else if (slideType === "company-card") {
      const items = content ? content.split("\n").filter(Boolean) : [];
      userPrompt = `Create a COMPANY-CARD slide (企業カード型) in exact ABABA style:

Title: "${title}"
Companies (name|salary|headcount|description per line):
${items.join("\n")}

Layout for 3 company cards per page:
1. Teal bg + brand at top
2. White card
3. Tab/page navigation at top: "01 02 03 04 05 06 07" style tabs
4. 3 company cards stacked vertically, each with:
   - Teal header bar with company name (white text, centered)
   - Stats row: "平均年収" teal badge + red number, "採用人数" dark-teal badge + black number
   - Description row: gray text, 16px, left-aligned
   - Card frame with light gray border, borderRadius=12
5. Bottom mascot speech bubble

Return ONLY the JSON array.`;
    } else if (slideType === "deadline") {
      const items = content ? content.split("\n").filter(Boolean) : [];
      userPrompt = `Create a DEADLINE slide (締切一覧型) in exact ABABA style:

Title: "${title}"
Companies (date|industry|name per line):
${items.join("\n")}

Layout:
1. Teal bg + brand at top
2. White card
3. Date header bars (teal, w=888, h=52, borderRadius=8, centered text)
4. Under each date: company items with:
   - Industry pill badge (colored: 人材=pink, 金融=blue, IT=teal, 商社=yellow, etc.)
   - Company name in bold black, 24px
   - Items spaced ~56px apart
5. Multiple date sections if multiple dates
6. Bottom mascot speech bubble

Return ONLY the JSON array.`;
    } else if (slideType === "tab-checklist") {
      const items = content ? content.split("\n").filter(Boolean) : [];
      userPrompt = `Create a TAB-CHECKLIST slide (タブ型チェックリスト) in exact ABABA style:

Section: "${title}"
Checklist items:
${items.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Layout:
1. Teal bg + brand at top
2. White card
3. Tab navigation bar at very top (6 tabs, active one = teal bg + white text)
4. Big light gray number (e.g. "01") as watermark, opacity=0.12
5. Section title in teal rounded box (w=520, h=56)
6. Gray illustration placeholder
7. "チェックリスト" teal pill label
8. Checklist items with teal checkmarks (☑), bold text, dividers
9. Bottom mascot speech bubble

Return ONLY the JSON array.`;
    } else if (slideType === "qa") {
      const items = content ? content.split("\n").filter(Boolean) : [];
      userPrompt = `Create a QA slide (Q&A一覧型) in exact ABABA style:

Title: "${title}"
Q&A pairs (question|answer per line):
${items.join("\n")}

Layout:
1. Teal bg + brand at top
2. White card
3. Optional tab navigation bar at top
4. Teal header bar with title (w=888, h=56)
5. Q&A items vertically stacked (spacing ~112px):
   - Teal checkmark ✅ on left
   - Question in bold black, 20px, key phrases in teal/red
   - →Answer below in gray, 16px, with explanation
6. Bottom mascot speech bubble

Return ONLY the JSON array.`;
    } else if (slideType === "ranking") {
      const items = content ? content.split("\n").filter(Boolean) : [];
      userPrompt = `Create a RANKING slide (ランキング型) in exact ABABA style:

Title: "${title}"
Ranked items:
${items.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Layout:
1. Teal bg + brand at top
2. White card with teal header bar (title + page badge)
3. Ranked items (6 per page):
   - Top 3: gold/silver/bronze medal emoji + company name + description
   - Rest: teal number (01-06) + company name + gray description
   - Divider lines between items
   - Rank text at x=96, name at x=168, description below name
4. Bottom mascot speech bubble

Return ONLY the JSON array.`;
    }

    // slideTypeにマッチしなかった場合のフォールバック
    if (!userPrompt) {
      userPrompt = `Create a ${slideType || "list"} slide in ABABA style.
Title: "${title}"
${content ? `Content: "${content}"` : ""}
Brand: "${brand}"
Follow the style guide rules. Return ONLY the JSON array.`;
    }

    const openai = await getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const responseText = response.choices[0]?.message?.content ?? "";

    // Parse the JSON response - handle potential markdown wrapping
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const rawElements = JSON.parse(cleanJson);

    if (!Array.isArray(rawElements)) {
      throw new Error("AI response is not an array");
    }

    // ★ normalizeLayout: 枠内テキスト自動中央配置 + サイズ調整 + グリッドスナップ
    const elements = normalizeLayout(rawElements);

    // All schemes use gradient background
    const background = {
      type: "gradient" as const,
      color: "#38BDF8",
      gradient: scheme.bg,
    };

    return NextResponse.json({
      elements,
      background,
      colorScheme: scheme,
    });
  } catch (error) {
    console.error("AI generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI generation failed" },
      { status: 500 }
    );
  }
}
