import { NextResponse } from "next/server";

// Mock script analysis - no OpenAI API needed
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { script } = body;

    if (!script?.trim()) {
      return NextResponse.json({ error: "台本テキストが必要です" }, { status: 400 });
    }

    // Simulate analysis delay
    await new Promise((r) => setTimeout(r, 500));

    // Return mock analysis based on script content
    const result = {
      summary:
        "転職成功のための5つの秘訣を紹介するカルーセル投稿。自己分析から面接対策、エージェント活用まで実践的なアドバイスを網羅。",
      totalSlides: 5,
      slides: [
        {
          slideNumber: 1,
          slideType: "cover",
          title: "転職成功の5つの秘訣",
          content: "知らないと損する転職テクニック完全ガイド",
          description: "カルーセルの表紙。インパクトのあるタイトルで興味を引く",
        },
        {
          slideNumber: 2,
          slideType: "list",
          title: "転職成功の5つのポイント",
          content:
            "自己分析を徹底する\n業界研究を欠かさない\n職務経歴書を磨く\n面接対策は万全に\nエージェントを活用する",
          description: "5つのポイントを一覧形式で紹介",
        },
        {
          slideNumber: 3,
          slideType: "comparison",
          title: "転職活動 成功vs失敗",
          content:
            "計画的に準備する\n行き当たりばったり\n企業研究を徹底\n情報収集が不足\n複数社に応募\n1社だけに絞る",
          description: "成功パターンと失敗パターンを比較して対比",
        },
        {
          slideNumber: 4,
          slideType: "checklist",
          title: "転職前チェックリスト",
          content:
            "自己分析シートを作成した\n希望条件を明確にした\n職務経歴書を更新した\n面接の想定Q&Aを準備した\n転職エージェントに登録した\n退職のタイミングを検討した",
          description: "転職前に確認すべき項目をチェックリスト形式で",
        },
        {
          slideNumber: 5,
          slideType: "cta",
          title: "フォローして最新情報をゲット！",
          content: "転職・就活に役立つ情報を毎日発信中",
          description: "フォロー誘導のCTAスライド",
        },
      ],
      suggestedHashtags: [
        "#転職",
        "#転職活動",
        "#就活",
        "#キャリアアップ",
        "#面接対策",
        "#転職成功",
        "#自己分析",
        "#職務経歴書",
      ],
      suggestedCaption:
        "【保存推奨】転職成功のための5つの秘訣をまとめました！\n\n自己分析から面接対策まで、プロが教える実践テクニックを紹介します。\n\n転職を考えている方はぜひ保存して何度も見返してください📌\n\n#転職 #転職活動 #就活 #キャリアアップ",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Test script analysis failed:", error);
    return NextResponse.json({ error: "テスト分析に失敗しました" }, { status: 500 });
  }
}
