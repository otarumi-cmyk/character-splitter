import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/db";

async function getOpenAIClient(): Promise<OpenAI> {
  const setting = await prisma.setting.findUnique({ where: { key: "openaiApiKey" } });
  const apiKey = setting?.value || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI APIキーが設定されていません");
  return new OpenAI({ apiKey });
}

interface IdeaSuggestion {
  title: string;
  description: string;
  category: string;
  hook: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category = "all", count = 12 } = body;

    const openai = await getOpenAIClient();

    const categoryFilter = category === "all"
      ? "すべてのカテゴリからバランスよく"
      : `「${category}」カテゴリを中心に`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 4096,
      messages: [
        {
          role: "system",
          content: `あなたは就活・転職系Instagramアカウント(@ababa_official スタイル)のコンテンツプランナーです。
バズりやすい投稿ネタを提案してください。

## カテゴリ:
- 面接対策: 面接マナー、よくある質問、逆質問、Web面接
- ES・書類: エントリーシート、志望動機、自己PR、ガクチカ
- 業界研究: ホワイト企業、年収ランキング、業界比較、企業分析
- 就活準備: スケジュール、インターン、OB訪問、自己分析
- メンタル: お祈りメール対策、モチベーション維持、就活疲れ
- マナー: メール、電話、服装、敬語
- 転職: 第二新卒、キャリアチェンジ、退職方法

## 出力形式 (JSON配列):
[
  {
    "title": "面接官が思わず採用したくなる逆質問5選",
    "description": "面接の最後に聞かれる「何か質問はありますか？」で差がつく具体的な逆質問例",
    "category": "面接対策",
    "hook": "9割の就活生が知らない"
  }
]

## ルール:
- 具体的な数字を入れる（「5選」「3つのNG」「7割が」等）
- 「知らないと損」「実は〜」「意外な」等のフック
- @ababaのトーンに合わせる（親しみやすく、実用的）
- 2026年のトレンドを意識（AI就活、オンライン面接等）
- 各ネタは実際にカルーセル投稿にできるもの`
        },
        {
          role: "user",
          content: `${categoryFilter}、${count}個のInstagram投稿ネタを提案してください。

重要:
- 就活生が保存したくなるような実用的なネタ
- カルーセル投稿（5-6枚）に展開しやすいもの
- バズりやすいフック付き
- JSON配列のみで返答`,
        },
      ],
    });

    let text = response.choices[0]?.message?.content ?? "[]";
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const ideas: IdeaSuggestion[] = JSON.parse(text);

    return NextResponse.json({ count: ideas.length, ideas });
  } catch (error) {
    console.error("Idea suggestion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ネタ提案に失敗しました" },
      { status: 500 },
    );
  }
}
