import { NextResponse } from "next/server";
import { chromium } from "playwright-core";
import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { getBuiltinTemplate } from "@/lib/builtin-templates";

async function getOpenAIClient(): Promise<OpenAI> {
  const setting = await prisma.setting.findUnique({ where: { key: "openaiApiKey" } });
  const apiKey = setting?.value || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI APIキーが設定されていません");
  return new OpenAI({ apiKey });
}

// テーマから検索キーワードを抽出（短く自然なクエリにする）
function extractKeywords(theme: string): string[] {
  // 数字+パターン系の接尾辞を削除
  const stripped = theme
    .replace(/[0-9０-９]+[つのパターン個選秘訣ポイント方法理由こと条件ステップ]+/g, "")
    .replace(/(やるべき|もらった|するべき|してはいけない|してみた)(こと|直後|方法)?/g, "")
    .replace(/(する|した|ない|ある|できる|落ちる|受かる|通る)(人|時|場合)?/g, "")
    .replace(/[のでをにがはもとやかへ、。！？…「」]/g, " ")
    .trim();
  // 2文字以上の単語を抽出、最大3語
  return stripped.split(/\s+/).filter(w => w.length >= 2).slice(0, 3);
}

// Bing JPでテーマに関する情報を複数クエリ・複数ページから収集
async function searchAndScrape(theme: string): Promise<string> {
  const keywords = extractKeywords(theme);
  const kw = keywords.join(" ");
  // 1クエリのみ（連続アクセスでCAPTCHA出るため）
  const query = `${kw} 就活 コツ まとめ`;
  console.log(`[search] theme="${theme}" → keywords="${kw}" → query: "${query}"`);
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      locale: "ja-JP",
      extraHTTPHeaders: { "Accept-Language": "ja,ja-JP;q=0.9" },
    });

    const allSnippets: string[] = [];
    const allLinks: string[] = [];

    // Bing JP検索（1回のみ、連続アクセスでCAPTCHA出るため）
    try {
      const searchPage = await context.newPage();
      await searchPage.goto(`https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=ja&cc=JP&mkt=ja-JP`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await searchPage.waitForTimeout(2000);

      const results = await searchPage.evaluate(() => {
        const items: { title: string; snippet: string; url: string }[] = [];
        document.querySelectorAll(".b_algo").forEach((el) => {
          const h2 = el.querySelector("h2");
          const title = h2?.textContent?.trim() || "";
          const link = (h2?.querySelector("a") as HTMLAnchorElement)?.href || "";
          const snippet = el.querySelector(".b_caption p")?.textContent?.trim()
            || el.querySelector("p")?.textContent?.trim() || "";
          if (title && snippet) {
            items.push({ title, snippet, url: link });
          }
        });
        return items.slice(0, 10);
      });

      for (const r of results) {
        allSnippets.push(`【${r.title}】\n${r.snippet}`);
        if (r.url && r.url.startsWith("http")) allLinks.push(r.url);
      }
      await searchPage.close();
      console.log(`[search] Bing: ${results.length}件のスニペット取得`);
    } catch (e) {
      console.error("[search] Bing検索失敗:", e);
    }

    // 重複URLを除去して上位5件のページ本文を取得
    const uniqueLinks = [...new Set(allLinks)].slice(0, 5);
    const pageTexts: string[] = [];

    for (const link of uniqueLinks) {
      try {
        const p = await context.newPage();
        await p.goto(link, { waitUntil: "domcontentloaded", timeout: 10000 });
        const text = await p.evaluate(() => {
          const article = document.querySelector("article, main, .entry-content, .post-content, #content");
          const target = article || document.body;
          const clone = target.cloneNode(true) as Element;
          clone.querySelectorAll("script, style, nav, header, footer, aside, .ad, .sidebar, .related").forEach((el) => el.remove());
          const tables: string[] = [];
          clone.querySelectorAll("table").forEach((table) => {
            const rows: string[] = [];
            table.querySelectorAll("tr").forEach((tr) => {
              const cells = Array.from(tr.querySelectorAll("td, th")).map((c) => c.textContent?.trim() || "");
              if (cells.length > 0) rows.push(cells.join(" | "));
            });
            if (rows.length > 1) tables.push(rows.join("\n"));
          });
          const lists: string[] = [];
          clone.querySelectorAll("ol, ul").forEach((list) => {
            const items = Array.from(list.querySelectorAll("li")).map((li) => li.textContent?.trim() || "");
            if (items.length >= 3) lists.push(items.join("\n"));
          });
          const mainText = clone.textContent?.replace(/\s+/g, " ").trim().slice(0, 3000) || "";
          const extra = [
            tables.length > 0 ? `\n[表データ]\n${tables.join("\n\n")}` : "",
            lists.length > 0 ? `\n[リスト]\n${lists.slice(0, 3).join("\n")}` : "",
          ].join("");
          return (mainText + extra).slice(0, 4000);
        });
        if (text.length > 100) {
          pageTexts.push(`[${link}]\n${text}`);
        }
        await p.close();
      } catch {
        // ページ取得失敗はスキップ
      }
    }

    await browser.close();

    const uniqueSnippets = [...new Set(allSnippets)];

    const allContent = [
      `=== 検索クエリ: ${query} ===`,
      `=== Bing検索結果 (${uniqueSnippets.length}件) ===`,
      ...uniqueSnippets,
      `=== 詳細ページ内容 (${pageTexts.length}件) ===`,
      ...pageTexts,
    ].join("\n\n");

    console.log(`[scrape] ${uniqueSnippets.length} snippets, ${pageTexts.length} pages, total ${allContent.length} chars`);

    return allContent || "検索結果を取得できませんでした。AIの知識ベースで生成します。";
  } catch (error) {
    if (browser) await browser.close();
    console.error("Scraping error:", error);
    return "検索結果を取得できませんでした。AIの知識ベースで生成します。";
  }
}

// AIでスクレイプ結果→スライド構成に変換
async function generateSlideSpec(
  theme: string,
  scrapedContent: string,
  brandName: string,
  openai: OpenAI,
) {
  const systemPrompt = `あなたはInstagramカルーセル投稿のプロのコンテンツディレクターです。
@ababa_official（就活・転職系アカウント）のスタイルでカルーセル投稿を設計します。

ユーザーからテーマとWeb検索で集めた情報が送られてきます。
その情報を元に、Instagram向けの魅力的なカルーセル投稿（5〜9枚、内容量に応じて調整）を設計してください。

## 使用可能なスライドタイプ:
1. **cover** (表紙): インパクトのあるタイトル。必ず1枚目。タイトルは「XXXの{N}つのYYY」形式推奨。
2. **list** (リスト): 番号付き5-6項目。ポイント・手順の説明に最適。
3. **comparison** (比較): 2カラム比較。成功vs失敗、良い例vs悪い例。
4. **checklist** (チェックリスト): 8項目のチェックリスト。確認事項に。
5. **cta** (CTA): フォロー誘導。必ず最後に入れる。
6. **point-card** (ポイント解説): 1トピック深掘り。番号+タイトル+説明。
7. **company-card** (企業カード): 3社の企業情報。年収・採用人数付き。
8. **deadline** (締切一覧): 日付+業界+企業名のリスト。
9. **tab-checklist** (タブ型): セクション別チェックリスト4項目。
10. **qa** (Q&A): 質問+回答4セット。面接対策に最適。
11. **ranking** (ランキング): 6社のランキング。

## content形式ルール（重要）:
- **list**: 改行区切り5-6項目（例: "自己分析を徹底する\\n業界研究をする\\n..."）
- **comparison**: パイプ区切り（例: "計画的に準備|ギリギリで焦る\\n企業研究する|何も調べない"）
- **checklist**: 改行区切り8項目
- **tab-checklist**: 改行区切り4項目
- **qa**: Q/A交互（例: "Q: 志望動機は？\\nA: 企業の理念に共感...\\nQ: 強みは？\\nA: ..."）
- **ranking**: パイプ区切り（例: "トヨタ自動車|世界最大の自動車メーカー\\nソニー|..."）
- **company-card**: パイプ区切り（例: "トヨタ自動車|850万円|500名|世界最大の..."）
- **point-card**: 改行テキスト（例: "シリーズ名\\n詳細説明テキスト"）
- **cover**: キャッチコピー（例: "就活生必見！プロが教える"）
- **cta**: サブテキスト

## レスポンス形式（JSON）:
{
  "summary": "投稿の概要",
  "totalSlides": 7,
  "slides": [
    { "slideNumber": 1, "slideType": "cover", "title": "面接成功の5つの秘訣", "content": "就活生必見！プロが教える\\n面接で差がつくポイント", "description": "表紙" },
    ...
  ],
  "suggestedHashtags": ["#就活", "#転職", ...],
  "suggestedCaption": "投稿キャプション"
}`;

  const userPrompt = `テーマ: ${theme}
ブランド名: ${brandName}

以下はこのテーマについてWeb検索で収集した情報です。この情報を参考にしつつ、Instagram向けに魅力的で具体的なカルーセル投稿を設計してください。

【収集情報】
${scrapedContent.slice(0, 12000)}

注意:
- 必ず1枚目はcover、最後はcta
- 5〜9枚の範囲で、伝えたい内容が全て収まるように枚数を調整すること。情報が多いテーマは7-9枚、シンプルなテーマは5-6枚
- 【最重要】収集情報から具体的な企業名・数値・年収・データを必ず引用すること。「1位」「2位」のような抽象的な表現は絶対NG。実在の企業名・具体的な数字を入れること
- ランキングには実在の企業名と具体的な年収・特徴を必ず入れる
- company-cardには実在の企業名・年収・採用人数を入れる
- contentは各slideTypeの形式ルールに厳密に従ってください
- JSON形式のみで返答`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4-mini",
    max_completion_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  let text = response.choices[0]?.message?.content ?? "";
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return JSON.parse(text);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { theme, brandName = "よりそい就活" } = body;

    if (!theme?.trim()) {
      return NextResponse.json({ error: "テーマを入力してください" }, { status: 400 });
    }

    // Step 1: Playwrightで情報収集
    const scrapedContent = await searchAndScrape(theme);

    // Step 2: AIで台本生成
    const openai = await getOpenAIClient();
    const analysis = await generateSlideSpec(theme, scrapedContent, brandName, openai);

    // Step 3: 各スライドにテンプレート注入（CTAは除外 → フロントで固定CTA追加）
    const slides: Array<{
      elements: unknown[];
      background: unknown;
      fromTemplate: boolean;
      templateName?: string;
      slideSpec: unknown;
    }> = [];

    // CTAスライドを除外
    const contentSlides = analysis.slides.filter((s: { slideType: string }) => s.slideType !== "cta");

    for (const slide of contentSlides) {
      // テンプレートをDBから検索
      const template = await prisma.canvasTemplate.findFirst({
        where: { slideType: slide.slideType },
        orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
      });

      let tplElements: Record<string, unknown>[];
      let tplBackground: unknown;
      let tplSlotMap: Record<string, string> | null = null;
      let tplName: string;

      if (template) {
        const canvasData = JSON.parse(template.canvasData);
        tplElements = [...canvasData.elements];
        tplBackground = canvasData.background;
        tplName = template.name;
        if (template.slotMap) {
          tplSlotMap = JSON.parse(template.slotMap);
        }
      } else {
        // DBテンプレートなし → ビルトインテンプレートを使用
        const builtin = getBuiltinTemplate(slide.slideType);
        if (builtin) {
          tplElements = builtin.elements;
          tplBackground = builtin.background;
          tplSlotMap = builtin.slotMap;
          tplName = `builtin-${slide.slideType}`;
        } else {
          slides.push({
            elements: [],
            background: { type: "gradient", color: "#38BDF8", gradient: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 40%, #06B6D4 70%, #22D3EE 100%)" },
            fromTemplate: false,
            slideSpec: slide,
          });
          continue;
        }
      }

      // slotMap注入
      if (tplSlotMap) {
        // GPTがtitleを省略した場合、descriptionやthemeをフォールバック
        const slideTitle = slide.title || slide.description || theme;
        injectContent(tplElements, tplSlotMap, slide.slideType, slideTitle, slide.content, brandName);
      }

      slides.push({
        elements: tplElements,
        background: tplBackground,
        fromTemplate: true,
        templateName: tplName,
        slideSpec: slide,
      });
    }

    return NextResponse.json({
      theme,
      scrapedInfo: scrapedContent.slice(0, 500) + "...",
      analysis,
      slides,
    });
  } catch (error) {
    console.error("Theme to slides failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成に失敗しました" },
      { status: 500 },
    );
  }
}

// slotMap方式でテキスト注入（template-inject/route.tsと同じロジック）
function injectContent(
  elements: Array<Record<string, unknown>>,
  slotMap: Record<string, string>,
  slideType: string,
  title: string,
  content: string,
  brandName: string,
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
  const hideByPrefix = (prefix: string) => {
    elements.forEach((el) => {
      if ((el.id as string)?.startsWith(prefix)) el.opacity = 0;
    });
  };

  if (brandName && slotMap.brand) setText(slotMap.brand, brandName);

  const lines = content ? content.split("\n").filter((l: string) => l.trim()) : [];

  switch (slideType) {
    case "cover": {
      if (title && slotMap.title_line1) {
        const match = title.match(/^(.+?)(\d+)(つの.+)$/);
        if (match) {
          const el1 = findEl(slotMap.title_line1);
          if (el1) {
            el1.text = match[1];
            if (match[1].length > 8) {
              const fitSize = Math.floor(920 / (match[1].length * 1.0));
              el1.fontSize = Math.min(112, Math.max(56, fitSize));
            }
          }
          if (slotMap.impact_number) setText(slotMap.impact_number, match[2]);
          if (slotMap.title_line2) setText(slotMap.title_line2, match[3]);
        } else {
          const el1 = findEl(slotMap.title_line1);
          if (el1) {
            el1.text = title;
            const maxFontForWidth = Math.floor(920 / (title.length * 1.0));
            el1.fontSize = Math.min(64, Math.max(36, maxFontForWidth));
            el1.textAlign = "center";
            el1.height = 280;
          }
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
          if (title.length > 16) {
            hEl.fontSize = Math.max(24, Math.floor(808 / (title.length * 1.0)));
          }
        }
      }
      if (title && slotMap.section_title) setText(slotMap.section_title, title);
      const items = lines.map((l: string) => l.replace(/^\d+\.\s*/, "").replace(/^[☑☐✓✗\-•]\s*/, "").trim());
      for (let i = 0; i < items.length; i++) {
        if (slotMap[`item_${i + 1}`]) setText(slotMap[`item_${i + 1}`], items[i]);
      }
      for (let i = items.length; i < 10; i++) {
        const txtId = slotMap[`item_${i + 1}`];
        if (txtId) {
          const prefix = txtId.replace(/_txt$/, "_");
          hideByPrefix(prefix);
        }
      }
      break;
    }
    case "comparison": {
      if (title && slotMap.title) setText(slotMap.title, title);
      const pairs: [string, string][] = [];
      for (const line of lines) {
        if (line.includes("|")) {
          const [l, r] = line.split("|").map((s: string) => s.replace(/^[^:：]+[:：]\s*/, "").trim());
          pairs.push([l, r || ""]);
        }
      }
      if (pairs.length === 0) {
        for (let i = 0; i < lines.length; i += 2) {
          pairs.push([lines[i]?.trim() || "", lines[i + 1]?.trim() || ""]);
        }
      }
      for (let i = 0; i < pairs.length; i++) {
        if (slotMap[`row_${i + 1}_l`]) setText(slotMap[`row_${i + 1}_l`], pairs[i][0]);
        if (slotMap[`row_${i + 1}_r`]) setText(slotMap[`row_${i + 1}_r`], pairs[i][1]);
      }
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
      let qIdx = 1;
      for (let i = 0; i < lines.length; i++) {
        if (/^[Qq][.:：]/i.test(lines[i])) {
          setText(slotMap[`q_${qIdx}`], lines[i].replace(/^[Qq][.:：]\s*/i, "").trim());
          if (i + 1 < lines.length && /^[Aa][.:：]/i.test(lines[i + 1])) {
            setText(slotMap[`a_${qIdx}`], `→${lines[i + 1].replace(/^[Aa][.:：]\s*/i, "").trim()}`);
            i++;
          }
          qIdx++;
        }
      }
      break;
    }
    case "ranking": {
      if (title && slotMap.header_title) setText(slotMap.header_title, title);
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split("|").map((s: string) => s.trim());
        if (slotMap[`rank_${i + 1}_name`]) setText(slotMap[`rank_${i + 1}_name`], parts[0]);
        if (parts[1] && slotMap[`rank_${i + 1}_desc`]) setText(slotMap[`rank_${i + 1}_desc`], parts[1]);
      }
      break;
    }
    case "point-card": {
      if (title && slotMap.point_title) setText(slotMap.point_title, title);
      if (lines[0] && slotMap.series_header) setText(slotMap.series_header, lines[0]);
      if (lines.length > 1 && slotMap.explanation) setText(slotMap.explanation, lines.slice(1).join("\n"));
      else if (lines[0] && slotMap.explanation) setText(slotMap.explanation, lines.join("\n"));
      break;
    }
    case "company-card": {
      for (let i = 0; i < lines.length && i < 3; i++) {
        const parts = lines[i].split("|").map((s: string) => s.trim());
        if (slotMap[`card_${i + 1}_name`]) setText(slotMap[`card_${i + 1}_name`], parts[0]);
        if (parts[1] && slotMap[`card_${i + 1}_salary`]) setText(slotMap[`card_${i + 1}_salary`], parts[1]);
        if (parts[2] && slotMap[`card_${i + 1}_count`]) setText(slotMap[`card_${i + 1}_count`], parts[2]);
        if (parts[3] && slotMap[`card_${i + 1}_desc`]) setText(slotMap[`card_${i + 1}_desc`], parts[3]);
      }
      break;
    }
    case "deadline": {
      let itemIdx = 1, headerIdx = 1;
      for (const line of lines) {
        const parts = line.split("|").map((s: string) => s.trim());
        if (parts.length === 1 && /\d+[/月]/.test(parts[0])) {
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
