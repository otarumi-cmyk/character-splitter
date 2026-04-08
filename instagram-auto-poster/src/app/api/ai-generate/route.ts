import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/db";

async function getOpenAIClient(): Promise<OpenAI> {
  const setting = await prisma.setting.findUnique({ where: { key: "openaiApiKey" } });
  const apiKey = setting?.value || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI APIキーが設定されていません。設定ページからAPIキーを入力してください。");
  }
  return new OpenAI({ apiKey });
}

interface GenerateRequest {
  slideType: "cover" | "list" | "cta" | "auto";
  title: string;
  content?: string; // bullet points or body text
  brandName?: string;
  colorScheme?: "purple" | "blue" | "orange" | "dark" | "green" | "auto";
}

const COLOR_SCHEMES: Record<string, { primary: string; secondary: string; bg: string; accent: string; textLight: string; textDark: string }> = {
  purple: { primary: "#6C5CE7", secondary: "#A855F7", bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", accent: "#FD79A8", textLight: "#FFFFFF", textDark: "#2D3436" },
  blue: { primary: "#0984E3", secondary: "#74B9FF", bg: "linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)", accent: "#00CEC9", textLight: "#FFFFFF", textDark: "#2D3436" },
  orange: { primary: "#E17055", secondary: "#FDCB6E", bg: "linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)", accent: "#FF7675", textLight: "#FFFFFF", textDark: "#2D3436" },
  dark: { primary: "#DFE6E9", secondary: "#B2BEC3", bg: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)", accent: "#6C5CE7", textLight: "#FFFFFF", textDark: "#DFE6E9" },
  green: { primary: "#00B894", secondary: "#55EFC4", bg: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", accent: "#FFEAA7", textLight: "#FFFFFF", textDark: "#2D3436" },
};

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json();
    const { slideType, title, content, brandName, colorScheme } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const scheme = colorScheme && colorScheme !== "auto" ? COLOR_SCHEMES[colorScheme] : COLOR_SCHEMES.purple;
    const brand = brandName || "@your_account";

    const systemPrompt = `You are an expert Instagram visual designer specializing in Japanese career/job-hunting content accounts like @ababa_official.

You generate canvas element layouts for 1080x1080px Instagram posts. The style should be:
- Bold, modern, clean Japanese Instagram post design
- Large impactful title text
- Decorative shapes (circles, rounded rects) as accents
- Numbered list items with badge circles for list-type slides
- Clear visual hierarchy with consistent spacing
- Professional but eye-catching

You MUST return ONLY a valid JSON array of canvas elements. No explanation, no markdown. Just the JSON array.

Each element in the array must have these fields:
{
  "id": string (unique, like "el_1", "el_2"),
  "type": "text" | "shape",
  "x": number (0-1080),
  "y": number (0-1080),
  "width": number,
  "height": number,
  "rotation": 0,
  "zIndex": number (higher = on top),
  "opacity": number (0-1),
  // For text:
  "text": string,
  "fontSize": number (24-120),
  "fontFamily": "Noto Sans JP",
  "fontWeight": "bold" | "normal",
  "color": string (hex),
  "textAlign": "left" | "center" | "right",
  "lineHeight": number (1.2-1.8),
  // For shape:
  "shapeType": "rect" | "circle" | "rounded-rect" | "line",
  "backgroundColor": string (hex),
  "borderColor": string (hex),
  "borderWidth": number,
  "borderRadius": number
}

Color scheme to use:
- Primary: ${scheme.primary}
- Secondary: ${scheme.secondary}
- Accent: ${scheme.accent}
- Light text: ${scheme.textLight}
- Dark text: ${scheme.textDark}

Brand name: ${brand}`;

    let userPrompt = "";

    if (slideType === "cover" || slideType === "auto") {
      userPrompt = `Create a COVER slide layout for this Instagram post:

Title: "${title}"
${content ? `Subtitle: "${content}"` : ""}
Brand: "${brand}"

Design requirements:
- A decorative accent shape (circle or rounded-rect) in the top-left or top-right area, using the accent color, semi-transparent (opacity 0.3-0.5)
- A small tag/label text at the top (like "CAREER TIPS" or topic category), small font size (20-24px)
- The main title should be LARGE (60-80px), bold, centered, white color, placed in the center area
- If there's a subtitle, place it below the title, smaller (28-32px), slightly transparent
- A decorative divider line below the subtitle
- Brand name at the bottom center (20-24px)
- Add 1-2 more subtle decorative shapes (small circles, lines) for visual interest
- Keep spacing clean and balanced

Return ONLY the JSON array.`;
    } else if (slideType === "list") {
      const items = content ? content.split("\n").filter(Boolean) : [];
      userPrompt = `Create a LIST slide layout for this Instagram post:

Header: "${title}"
Items:
${items.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Design requirements:
- A colored accent bar at the top (8px tall, full width, primary color)
- Header title at top area (40-48px, bold, white)
- For each item (${items.length} items total):
  - A circle badge with the number (40x40, primary color background, white text)
  - Item text next to the badge (24-30px, white, bold for title part)
  - Space items evenly down the canvas
- Keep 60px padding on left and right
- Add "SWIPE →" hint text at bottom-right (16px, semi-transparent)
- Brand name at bottom-left (18px)
- Add subtle decorative elements (a vertical line on the left side, small shapes)

Return ONLY the JSON array.`;
    } else if (slideType === "cta") {
      userPrompt = `Create a CTA (Call to Action) slide for this Instagram post:

CTA Text: "${title}"
${content ? `Sub text: "${content}"` : ""}
Brand: "${brand}"

Design requirements:
- Large eye-catching CTA text in the center (56-72px, bold, white)
- A pointing down arrow or similar indicator icon (use a circle shape with a triangle approximation)
- Three action buttons: "いいね", "保存", "シェア" as rounded-rect shapes with text
- Profile mention area: "${brand} をフォロー" text
- Decorative concentric circles or ring shapes in the background
- Brand name at the bottom

Return ONLY the JSON array.`;
    }

    const openai = await getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 4096,
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

    const elements = JSON.parse(cleanJson);

    if (!Array.isArray(elements)) {
      throw new Error("AI response is not an array");
    }

    return NextResponse.json({
      elements,
      background: {
        type: "gradient",
        gradient: scheme.bg,
      },
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
