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

    // Yahoo! Japan検索（常に日本語結果、bot検知されにくい）
    try {
      const searchPage = await context.newPage();
      await searchPage.goto(`https://search.yahoo.co.jp/search?p=${encodeURIComponent(query)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await searchPage.waitForTimeout(2000);

      const results = await searchPage.evaluate(() => {
        const items: { title: string; snippet: string; url: string }[] = [];
        // Yahoo検索結果のカード要素
        document.querySelectorAll(".sw-CardBase").forEach((el) => {
          const titleEl = el.querySelector("h3") || el.querySelector("a");
          const title = titleEl?.textContent?.trim() || "";
          const snippet = el.querySelector(".sw-CardBase__description, p")?.textContent?.trim() || "";
          const anchor = el.querySelector("a") as HTMLAnchorElement | null;
          const url = anchor?.href || "";
          // ガイドラインやAI回答などのノイズを除外
          if (title.length > 8 && snippet.length > 20 && !title.includes("ガイドライン")) {
            items.push({ title, snippet, url });
          }
        });
        return items.slice(0, 10);
      });

      for (const r of results) {
        allSnippets.push(`【${r.title}】\n${r.snippet}`);
        // Yahoo検索のURLはリダイレクト経由なのでそのまま追加
        if (r.url && r.url.startsWith("http")) allLinks.push(r.url);
      }
      await searchPage.close();
      console.log(`[search] Yahoo: ${results.length}件のスニペット取得`);
    } catch (e) {
      console.error("[search] Yahoo検索失敗:", e);
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
      `=== Yahoo検索結果 (${uniqueSnippets.length}件) ===`,
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

## 【最重要ルール】テーマに忠実であること
- テーマが「XX選」「XXランキング」の場合 → **必ず具体的な固有名詞（企業名・サービス名等）をその数だけ並べること**。抽象的なアドバイスに置き換えるのは厳禁。
  例: 「ホワイト企業30選」→ rankingスライド5枚（6社×5=30社）で実際の企業名を並べる
  例: 「おすすめ転職サイト10選」→ rankingスライド2枚（5社×2=10サイト）で実際のサイト名を並べる
- テーマが「XX選」の場合、30選なら30個、10選なら10個、必ずテーマの数だけ具体名を出すこと
- テーマが「コツ」「方法」「あるある」等の場合 → list, comparison, qa, checklist等を使って具体的なアドバイスを並べる
- 勝手にテーマの意図を変えないこと（「30選を並べるのではなく〜」のような判断は禁止）

## 使用可能なスライドタイプ:
1. **cover** (表紙): インパクトのあるタイトル。必ず1枚目
2. **list** (リスト): 番号付き5-6項目。ポイント・手順の説明に最適
3. **comparison** (比較): 2カラム比較。成功vs失敗、良い例vs悪い例
4. **checklist** (チェックリスト): 8項目のチェックリスト。確認事項に
5. **cta** (CTA): フォロー誘導。必ず最後に入れる
6. **company-card** (企業カード): 3社の企業情報。年収・採用人数付き
7. **deadline** (締切一覧): 日付+業界+企業名のリスト
8. **tab-checklist** (タブ型): セクション別チェックリスト4項目
9. **qa** (Q&A): 質問+回答4セット。面接対策に最適
10. **ranking** (ランキング): 6社のランキング。企業名+説明をパイプ区切り

## テーマ別テンプレ選択ガイド:
| テーマの種類 | 使うスライドタイプ | 枚数目安 |
|---|---|---|
| 「XX選」「ランキング」 | cover + ranking×必要枚数 + cta | 数÷6+2枚 |
| 「XX企業」「年収」 | cover + ranking/company-card×複数 + cta | 7-9枚 |
| 「締切」「エントリー」 | cover + deadline×複数 + cta | 5-7枚 |
| 「コツ」「方法」「やり方」 | cover + list/comparison/qa + cta | 6-8枚 |
| 「あるある」「特徴」 | cover + list/checklist + cta | 5-7枚 |
| 「比較」「違い」 | cover + comparison×複数 + cta | 5-7枚 |

## content形式ルール（重要・文字数厳守）:
- **list**: 改行区切り5-6項目。各項目は**最大16文字**（例: "自己分析を徹底する\\n業界研究をする"）
- **comparison**: パイプ区切り。各セル**最大10文字**（例: "計画的に準備|ギリギリで焦る\\n企業研究する|何も調べない"）
- **checklist**: 改行区切り8項目。各項目**最大16文字**
- **tab-checklist**: 改行区切り4項目。各項目**最大16文字**
- **qa**: Q/A交互。Qは**最大18文字**、Aは**最大30文字**（例: "Q: 志望動機は？\\nA: 企業の理念に共感..."）
- **ranking**: 改行区切り6項目。パイプ区切り。企業名**最大10文字**、説明**最大20文字**（例: "トヨタ自動車|世界最大の自動車メーカー"）
- **company-card**: パイプ区切り3社。企業名**最大10文字**（例: "トヨタ自動車|850万円|500名|福利厚生充実"）
- **deadline**: 改行区切り。日付|業界|企業名|カテゴリ
- **cover**: titleは**最大12文字**。contentの1行目はバナー**最大14文字**、2行目はサブ説明
- **cta**: サブテキスト
- ⚠️ 文字数を超えるとテキストが表示枠からはみ出て崩れるため、必ず文字数制限を守ること

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

  // テーマが「XX選」系かどうかを判定
  const senMatch = theme.match(/([0-9０-９]+)\s*選/);
  const senCount = senMatch ? parseInt(senMatch[1].replace(/[０-９]/g, (c: string) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))) : 0;
  const senInstruction = senCount > 0
    ? `\n⚠️ このテーマは「${senCount}選」です。必ず${senCount}個の具体的な固有名詞（企業名・サービス名等）を出してください。rankingスライドは1枚6項目なので、${Math.ceil(senCount / 6)}枚のrankingスライドが必要です。抽象的なアドバイスへの置き換えは厳禁です。`
    : "";

  const userPrompt = `テーマ: ${theme}
ブランド名: ${brandName}
${senInstruction}

以下はこのテーマについてWeb検索で収集した情報です。この情報を参考にしつつ、Instagram向けに魅力的で具体的なカルーセル投稿を設計してください。

【収集情報】
${scrapedContent.slice(0, 12000)}

注意:
- 必ず1枚目はcover、最後はcta
- 5〜9枚の範囲で、伝えたい内容が全て収まるように枚数を調整すること。情報が多いテーマは7-9枚、シンプルなテーマは5-6枚
- 【最重要】テーマの意図を勝手に変えないこと。「XX選」なら具体名をその数だけ並べる。「コツ」なら具体的なアドバイスを並べる
- テーマと無関係な情報を混ぜないこと
- 収集情報に具体的なデータ（企業名・数字等）がある場合は積極的に使うこと
- contentは各slideTypeの形式ルール（文字数制限）に厳密に従ってください
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
      // 標準テンプレート（ID小=最初に登録されたもの）を優先
      const template = await prisma.canvasTemplate.findFirst({
        where: { slideType: slide.slideType },
        orderBy: [{ id: "asc" }],
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
