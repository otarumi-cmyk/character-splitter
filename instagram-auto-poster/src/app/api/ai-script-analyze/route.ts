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

interface AnalyzeRequest {
  script: string;
  brandName?: string;
  colorScheme?: string;
}

export async function POST(request: Request) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { script, brandName, colorScheme } = body;

    if (!script?.trim()) {
      return NextResponse.json({ error: "台本テキストが必要です" }, { status: 400 });
    }

    const brand = brandName || "@your_account";

    const systemPrompt = `あなたはInstagramカルーセル投稿の構成を設計するプロのコンテンツディレクターです。
@ababa_official（就活・転職系アカウント）のスタイルでカルーセル投稿を設計します。

ユーザーから台本（テキスト原稿）が送られてきます。
その内容を分析し、最適なカルーセル構成を設計してください。

## 使用可能なスライドタイプ:
1. **cover** (表紙): タイトル+キャッチコピー。カルーセルの1枚目。必ず含める。
2. **list** (リスト): 番号付きリスト形式。ポイントや手順の説明に。
3. **comparison** (比較): 2カラム比較型。良い例/悪い例、ビフォー/アフターに。
4. **checklist** (チェックリスト): チェックリスト型。確認事項や条件一覧に。
5. **cta** (CTA): フォロー誘導。カルーセルの最後に必ず含める。
6. **point-card** (ポイント解説): 1つのトピックを詳しく解説。番号+タイトル+優先度+説明ボックス。
7. **company-card** (企業カード): 企業情報カード3枚/ページ。年収・採用人数・概要。
8. **deadline** (締切一覧): 日付ヘッダー+業界バッジ+企業名リスト。
9. **tab-checklist** (タブ型): タブナビ+セクション別チェックリスト。段階別の解説に。
10. **qa** (Q&A): 質問+対策の一覧。面接質問対策などに最適。
11. **ranking** (ランキング): 企業ランキング。メダル付きの順位リスト。

## レスポンスルール:
- JSON形式で返す（マークダウンのコードブロックなし）
- slidesは2〜10枚
- 必ず1枚目はcover、最後はcta
- 各スライドにslideType, title, content, descriptionを含める
- contentはスライドタイプに合わせた形式:
  - list: 改行区切りのリスト項目（5-6個推奨）
  - comparison: 改行区切り（奇数行=左, 偶数行=右）
  - checklist: 改行区切りのチェック項目
  - point-card: 説明テキスト
  - company-card: 企業名|年収|人数|概要を改行区切り
  - deadline: 日付|業界|企業名を改行区切り
  - tab-checklist: チェック項目を改行区切り
  - qa: 質問|回答を改行区切り
  - ranking: 企業名|説明を改行区切り
  - cover/cta: サブタイトルや補足テキスト

## レスポンス形式:
{
  "summary": "台本の要約（1-2文）",
  "totalSlides": 数値,
  "slides": [
    {
      "slideNumber": 1,
      "slideType": "cover",
      "title": "メインタイトル",
      "content": "サブタイトルやキャッチコピー",
      "description": "このスライドの意図の説明"
    },
    ...
  ],
  "suggestedHashtags": ["#ハッシュタグ1", "#ハッシュタグ2", ...],
  "suggestedCaption": "投稿キャプション案"
}`;

    const userPrompt = `以下の台本をInstagramカルーセル投稿に変換してください。

ブランド名: ${brand}
${colorScheme ? `カラースキーム: ${colorScheme}` : ""}

【台本】
${script}

上記の台本を分析して、最適なカルーセル構成（スライドタイプの組み合わせ）を提案し、各スライドのテキスト内容を設計してください。
JSON形式のみで返答してください。`;

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

    // Parse JSON response
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const result = JSON.parse(cleanJson);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Script analysis failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "台本分析に失敗しました" },
      { status: 500 }
    );
  }
}
