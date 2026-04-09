import { NextResponse } from "next/server";
import {
  makeBrand,
  makeCard,
  makeBubble,
  makeBanner,
  makeHeader,
  makeDivider,
  makeImportantBadge,
  makeSubtitleBar,
  makePill,
  makeButton,
  textInBox,
  centerX,
  makeSeriesHeader,
  makePointTitle,
  makePriorityLine,
  makeExplanationBox,
  makeIllustrationPlaceholder,
  makeCompanyCard,
  makeDeadlineItem,
  makeTabBar,
  makeQAItem,
  TYPO,
  COLOR,
} from "@/lib/layout-rules";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type El = any;

// =============================================
// COVER SLIDE (表紙)
// =============================================
const MOCK_COVER_ELEMENTS: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),

  // Red banner — textInBox で自動中央配置
  ...makeBanner("就活生必見！プロが教える", 104),

  // Hero title
  {
    id: "cv_title1", type: "text",
    x: 80, y: 232, width: 920, height: 120,
    rotation: 0, zIndex: 4, opacity: 1,
    text: "転職成功の",
    fontSize: TYPO.hero.fontSize, fontFamily: "Noto Sans JP", fontWeight: TYPO.hero.fontWeight,
    color: TYPO.hero.color, textAlign: "center", lineHeight: TYPO.hero.lineHeight,
  },

  // Impact number "5"
  {
    id: "cv_num", type: "text",
    x: centerX(640), y: 360, width: 280, height: 200,
    rotation: 0, zIndex: 5, opacity: 1,
    text: "5",
    fontSize: TYPO.heroNumber.fontSize, fontFamily: "Noto Sans JP", fontWeight: TYPO.heroNumber.fontWeight,
    color: TYPO.heroNumber.color, textAlign: "center", lineHeight: TYPO.heroNumber.lineHeight,
  },

  // "つの秘訣"
  {
    id: "cv_title2", type: "text",
    x: centerX(640) + 280, y: 400, width: 500, height: 160,
    rotation: 0, zIndex: 5, opacity: 1,
    text: "つの秘訣",
    fontSize: TYPO.hero.fontSize, fontFamily: "Noto Sans JP", fontWeight: TYPO.hero.fontWeight,
    color: TYPO.hero.color, textAlign: "left", lineHeight: 1.2,
  },

  // 装飾線
  {
    id: "cv_line", type: "shape",
    x: centerX(600), y: 568, width: 600, height: 4,
    rotation: 0, zIndex: 3, opacity: 0.3,
    shapeType: "rect", backgroundColor: COLOR.teal,
    borderColor: "transparent", borderWidth: 0, borderRadius: 2,
  },

  // "〜 選 〜"
  {
    id: "cv_sen", type: "text",
    x: 80, y: 588, width: 920, height: 80,
    rotation: 0, zIndex: 4, opacity: 1,
    text: "〜 選 〜",
    fontSize: 62, fontFamily: "Noto Sans JP", fontWeight: "bold",
    color: COLOR.black, textAlign: "center", lineHeight: 1.2,
  },

  // サブキャッチ
  {
    id: "cv_sub", type: "text",
    x: 80, y: 680, width: 920, height: 56,
    rotation: 0, zIndex: 4, opacity: 1,
    text: "これを読めば転職活動が変わる！",
    fontSize: 40, fontFamily: "Noto Sans JP", fontWeight: "bold",
    color: COLOR.teal, textAlign: "center", lineHeight: 1.4,
  },

  // サブタイトルバー
  ...makeSubtitleBar("知らないと損する転職テクニック完全ガイド", 784),

  // 下部吹き出し
  ...makeBubble("保存して何度も見返してね！📌"),
];

// =============================================
// LIST SLIDE (リスト型) — spacing拡大で上下均等に
// =============================================
function makeListItem(
  index: number, number: string, text: string,
  startY: number, spacing: number, hasImportant: boolean, idPrefix: string,
): El[] {
  const y = startY + index * spacing;
  const elements: El[] = [
    {
      id: `${idPrefix}_num`, type: "text",
      x: 96, y, width: 64, height: 56,
      rotation: 0, zIndex: 3, opacity: 1,
      text: number,
      fontSize: TYPO.h3Number.fontSize, fontFamily: "Noto Sans JP", fontWeight: TYPO.h3Number.fontWeight,
      color: TYPO.h3Number.color, textAlign: "left", lineHeight: TYPO.h3Number.lineHeight,
    },
    {
      id: `${idPrefix}_txt`, type: "text",
      x: 176, y: y + 4, width: 640, height: 52,
      rotation: 0, zIndex: 3, opacity: 1,
      text,
      fontSize: TYPO.h3.fontSize, fontFamily: "Noto Sans JP", fontWeight: TYPO.h3.fontWeight,
      color: TYPO.h3.color, textAlign: "left", lineHeight: TYPO.h3.lineHeight,
    },
    makeDivider(y + 68, `${idPrefix}_div`),
  ];
  if (hasImportant) {
    elements.push(...makeImportantBadge(880, y + 8, `${idPrefix}_imp`));
  }
  return elements;
}

// 5 items → spacing=128 (均等配分: 678/5≈136)
const MOCK_LIST_ELEMENTS: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),
  ...makeHeader("面接で聞かれるTOP5", "1/3"),
  ...makeListItem(0, "01", "自己紹介をお願いします", 208, 128, false, "li1"),
  ...makeListItem(1, "02", "志望動機を教えてください", 208, 128, true, "li2"),
  ...makeListItem(2, "03", "長所と短所を教えてください", 208, 128, false, "li3"),
  ...makeListItem(3, "04", "学生時代に力を入れたことは？", 208, 128, true, "li4"),
  ...makeListItem(4, "05", "逆質問はありますか？", 208, 128, false, "li5"),
  ...makeBubble("面接対策はこれでバッチリ！💪"),
];

// =============================================
// COMPARISON SLIDE (比較型) — spacing拡大
// =============================================
const COL_L = 80;
const COL_R = 548;
const COL_W = 432;

function makeCompRow(
  index: number, left: string, right: string,
  startY: number, spacing: number, id: string,
): El[] {
  const y = startY + index * spacing;
  return [
    {
      id: `${id}_l`, type: "text",
      x: COL_L, y, width: COL_W, height: 80,
      rotation: 0, zIndex: 3, opacity: 1,
      text: left, fontSize: 30, fontFamily: "Noto Sans JP", fontWeight: "bold",
      color: COLOR.teal, textAlign: "center", lineHeight: 1.5,
    },
    {
      id: `${id}_r`, type: "text",
      x: COL_R, y, width: COL_W, height: 80,
      rotation: 0, zIndex: 3, opacity: 1,
      text: right, fontSize: 30, fontFamily: "Noto Sans JP", fontWeight: "bold",
      color: COLOR.red, textAlign: "center", lineHeight: 1.5,
    },
    makeDivider(y + 96, `${id}_div`),
  ];
}

// 5 rows → spacing=120 (均等配分)
const MOCK_COMPARISON_ELEMENTS: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),

  {
    id: "cmp_title", type: "text",
    x: 80, y: 104, width: 920, height: 56,
    rotation: 0, zIndex: 3, opacity: 1,
    text: "転職活動 成功 vs 失敗",
    fontSize: TYPO.h2.fontSize, fontFamily: "Noto Sans JP", fontWeight: TYPO.h2.fontWeight,
    color: TYPO.h2.color, textAlign: "center", lineHeight: TYPO.h2.lineHeight,
  },

  {
    id: "cmp_vline", type: "shape",
    x: 540, y: 176, width: 2, height: 640,
    rotation: 0, zIndex: 2, opacity: 0.2,
    shapeType: "rect", backgroundColor: COLOR.gray[200],
    borderColor: "transparent", borderWidth: 0, borderRadius: 0,
  },

  ...makePill(COL_L + 110, 176, 192, 48, "✅ 成功", COLOR.teal, COLOR.white, "cmp_ll"),
  ...makePill(COL_R + 110, 176, 192, 48, "❌ 失敗", COLOR.red, COLOR.white, "cmp_lr"),

  ...makeCompRow(0, "計画的に準備する", "行き当たりばったり", 256, 120, "cr1"),
  ...makeCompRow(1, "企業研究を徹底", "情報収集が不足", 256, 120, "cr2"),
  ...makeCompRow(2, "複数社に応募", "1社だけに絞る", 256, 120, "cr3"),
  ...makeCompRow(3, "面接練習を重ねる", "ぶっつけ本番", 256, 120, "cr4"),
  ...makeCompRow(4, "プロに相談", "独りで悩む", 256, 120, "cr5"),

  ...makeBubble("あなたはどっち？コメントで教えて💬"),
];

// =============================================
// CHECKLIST SLIDE (チェックリスト型)
// =============================================
function makeCheckItem(
  index: number, text: string, checked: boolean,
  startY: number, spacing: number, idPrefix: string,
): El[] {
  const y = startY + index * spacing;
  return [
    {
      id: `${idPrefix}_chk`, type: "text",
      x: 96, y, width: 56, height: 56,
      rotation: 0, zIndex: 3, opacity: 1,
      text: checked ? "☑" : "☐", fontSize: 36,
      fontFamily: "Noto Sans JP", fontWeight: "bold",
      color: checked ? COLOR.teal : COLOR.gray[200], textAlign: "left", lineHeight: 1.0,
    },
    {
      id: `${idPrefix}_txt`, type: "text",
      x: 168, y: y + 4, width: 740, height: 52,
      rotation: 0, zIndex: 3, opacity: 1,
      text, fontSize: TYPO.h3.fontSize, fontFamily: "Noto Sans JP",
      fontWeight: checked ? "bold" : "normal",
      color: checked ? COLOR.black : COLOR.gray[300], textAlign: "left", lineHeight: TYPO.h3.lineHeight,
    },
    makeDivider(y + 68, `${idPrefix}_div`),
  ];
}

// 8 items → spacing=80 (カードいっぱいに使う)
const MOCK_CHECKLIST_ELEMENTS: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),
  ...makeHeader("転職前チェックリスト"),
  ...makeCheckItem(0, "自己分析シートを作成した", true, 208, 80, "ck1"),
  ...makeCheckItem(1, "希望条件を明確にした", true, 208, 80, "ck2"),
  ...makeCheckItem(2, "職務経歴書を更新した", true, 208, 80, "ck3"),
  ...makeCheckItem(3, "面接の想定Q&Aを準備した", true, 208, 80, "ck4"),
  ...makeCheckItem(4, "転職エージェントに登録した", true, 208, 80, "ck5"),
  ...makeCheckItem(5, "退職のタイミングを検討した", true, 208, 80, "ck6"),
  ...makeCheckItem(6, "内定後の引き継ぎ計画を立てた", true, 208, 80, "ck7"),
  ...makeCheckItem(7, "入社前に必要な書類を確認した", true, 208, 80, "ck8"),
  ...makeBubble("全部チェックできた？✅"),
];

// =============================================
// CTA SLIDE (最終ページ) — コンテンツを中央寄せ
// =============================================
const MOCK_CTA_ELEMENTS: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),

  {
    id: "cta_h1", type: "text",
    x: 80, y: 120, width: 920, height: 128,
    rotation: 0, zIndex: 3, opacity: 1,
    text: "フォローして\n最新情報をゲット！",
    fontSize: 56, fontFamily: "Noto Sans JP", fontWeight: "bold",
    color: COLOR.black, textAlign: "center", lineHeight: 1.3,
  },

  {
    id: "cta_sub", type: "text",
    x: 80, y: 264, width: 920, height: 48,
    rotation: 0, zIndex: 3, opacity: 1,
    text: "転職・就活に役立つ情報を毎日発信中📮",
    fontSize: TYPO.body.fontSize, fontFamily: "Noto Sans JP", fontWeight: TYPO.body.fontWeight,
    color: TYPO.body.color, textAlign: "center", lineHeight: TYPO.body.lineHeight,
  },

  ...textInBox(
    { x: centerX(720), y: 336, width: 720, height: 176, bg: COLOR.gray[50], borderRadius: 16, borderColor: COLOR.gray[100], borderWidth: 1 },
    { text: "", fontSize: 1, color: "transparent" },
    { box: "cta_prof_bg", text: "cta_prof_dummy" },
    0,
  ),

  {
    id: "cta_icon", type: "shape",
    x: centerX(720) + 40, y: 368, width: 104, height: 104,
    rotation: 0, zIndex: 3, opacity: 0.4,
    shapeType: "circle", backgroundColor: COLOR.teal,
    borderColor: "transparent", borderWidth: 0, borderRadius: 52,
  },

  {
    id: "cta_name", type: "text",
    x: centerX(720) + 176, y: 376, width: 480, height: 40,
    rotation: 0, zIndex: 3, opacity: 1,
    text: "@your_account", fontSize: 34, fontFamily: "Noto Sans JP", fontWeight: "bold",
    color: COLOR.black, textAlign: "left", lineHeight: 1.2,
  },

  {
    id: "cta_desc", type: "text",
    x: centerX(720) + 176, y: 420, width: 480, height: 36,
    rotation: 0, zIndex: 3, opacity: 1,
    text: "就活・転職の最新情報を発信🔥",
    fontSize: TYPO.caption.fontSize, fontFamily: "Noto Sans JP", fontWeight: TYPO.caption.fontWeight,
    color: COLOR.gray[400], textAlign: "left", lineHeight: TYPO.caption.lineHeight,
  },

  ...makeButton(centerX(520), 536, 520, 64, "今すぐフォロー →", COLOR.red, COLOR.white, "cta_btn"),

  {
    id: "cta_benefits", type: "text",
    x: 80, y: 632, width: 920, height: 180,
    rotation: 0, zIndex: 3, opacity: 1,
    text: "📌 保存して見返せる転職ノウハウ\n💼 毎日更新の最新求人情報\n🎯 プロ直伝の面接テクニック",
    fontSize: TYPO.body.fontSize, fontFamily: "Noto Sans JP", fontWeight: TYPO.body.fontWeight,
    color: COLOR.gray[600], textAlign: "center", lineHeight: 1.8,
  },

  ...makeBubble("いいね❤️とフォローお願いします！"),
];

// =============================================
// POINT-CARD SLIDE (ポイント解説型) — 上下均等配分
// =============================================
const MOCK_POINT_CARD_ELEMENTS: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),

  makeSeriesHeader("絶対内定！4月にすべきこと5選", 72),
  ...makePointTitle("②", "自己分析", 128),
  ...makePriorityLine(5, "就活の軸も決めておこう！", 232),
  makeIllustrationPlaceholder(320, 328, 360, 180, "pc_illust"),
  ...makeExplanationBox(
    "過去の経験を時系列で書き出し、\n「頑張った理由」と「得た学び」を\n整理して、自分の強み・価値観・\nやりたいことを言語化しよう",
    528, 300, "pc_exp",
  ),

  ...makeBubble("自己分析が内定への第一歩だワン！🐕"),
];

// =============================================
// COMPANY-CARD SLIDE (企業カード型) — spacing拡大
// =============================================
const MOCK_COMPANY_CARD_ELEMENTS: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),

  ...makeTabBar(["01", "02", "03", "04", "05", "06", "07"], 0, 68),

  // 3 cards: cardH=232, available=758px, gap=31px
  ...makeCompanyCard(
    "サイバーエージェント", "800万円", "300名",
    "インターネット広告、ゲーム、メディア事業を展開。AbemaTVなど自社サービスも多数。若手の裁量が大きく成長環境◎",
    124, "cc1",
  ),
  ...makeCompanyCard(
    "楽天グループ", "780万円", "500名",
    "EC、フィンテック、モバイルなど70以上のサービスを展開。英語公用語化で知られ、グローバル人材を積極採用",
    380, "cc2",
  ),
  ...makeCompanyCard(
    "LINE（LINEヤフー）", "750万円", "200名",
    "メッセンジャー、決済、AI等を展開する国内最大級のIT企業。エンジニア採用に注力",
    636, "cc3",
  ),

  ...makeBubble("IT企業は成長率が高いワン！💻"),
];

// =============================================
// DEADLINE SLIDE (締切一覧型) — spacing拡大
// =============================================
const INDUSTRY_COLORS: Record<string, string> = {
  人材: "#7DD3FC",
  金融: "#0EA5E9",
  IT: "#38BDF8",
  商社: "#0284C7",
  インフラ: "#06B6D4",
  物流: "#22D3EE",
  メーカー: "#67E8F9",
  その他: "#A5F3FC",
};

const MOCK_DEADLINE_ELEMENTS: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),

  // 日付ヘッダー1
  ...textInBox(
    { x: 96, y: 88, width: 888, height: 56, bg: COLOR.teal, borderRadius: 8, zIndex: 3 },
    { text: "4/1 締切", fontSize: 30, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
    { box: "dl_hdr_bg", text: "dl_hdr_txt" },
    { h: 16, v: 8 },
  ),

  ...makeDeadlineItem("人材", INDUSTRY_COLORS["人材"], "リクルート", COLOR.black, 168, "dl1"),
  ...makeDeadlineItem("金融", INDUSTRY_COLORS["金融"], "三菱UFJモルガン・スタンレー証券", COLOR.black, 228, "dl2"),
  ...makeDeadlineItem("その他", INDUSTRY_COLORS["その他"], "内閣府", COLOR.black, 288, "dl3"),
  ...makeDeadlineItem("その他", INDUSTRY_COLORS["その他"], "JA", COLOR.teal, 348, "dl4"),

  // 日付ヘッダー2
  ...textInBox(
    { x: 96, y: 432, width: 888, height: 56, bg: COLOR.teal, borderRadius: 8, zIndex: 3 },
    { text: "4/2 締切", fontSize: 30, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
    { box: "dl_hdr2_bg", text: "dl_hdr2_txt" },
    { h: 16, v: 8 },
  ),

  ...makeDeadlineItem("商社", INDUSTRY_COLORS["商社"], "豊田通商", COLOR.black, 512, "dl5"),
  ...makeDeadlineItem("金融", INDUSTRY_COLORS["金融"], "ゴールドマン・サックス", COLOR.black, 572, "dl6"),
  ...makeDeadlineItem("IT", INDUSTRY_COLORS["IT"], "電通総研", COLOR.teal, 632, "dl7"),
  ...makeDeadlineItem("インフラ", INDUSTRY_COLORS["インフラ"], "JR東日本", COLOR.teal, 692, "dl8"),
  ...makeDeadlineItem("インフラ", INDUSTRY_COLORS["インフラ"], "JR西日本", COLOR.teal, 752, "dl9"),
  ...makeDeadlineItem("物流", INDUSTRY_COLORS["物流"], "日本郵政グループ", COLOR.black, 812, "dl10"),

  ...makeBubble("締切を見逃さないでワン！📅"),
];

// =============================================
// TAB-CHECKLIST SLIDE — spacing拡大
// =============================================
const MOCK_TAB_CHECKLIST_ELEMENTS: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),

  ...makeTabBar(["一次面接①", "一次面接②", "二次面接①", "二次面接②", "最終面接①", "最終面接②"], 0, 68),

  // セクションタイトル
  ...textInBox(
    { x: 160, y: 128, width: 760, height: 72, bg: COLOR.teal, borderRadius: 8, zIndex: 3 },
    { text: "一次面接", fontSize: 40, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
    { box: "tc_title_bg", text: "tc_title_txt" },
    { h: 20, v: 8 },
  ),

  // チェックリストラベル
  ...makePill(96, 232, 220, 44, "チェックリスト", COLOR.teal, COLOR.white, "tc_cklabel"),

  // 4 items → spacing=136 (均等配分: y232+44+24=300 → 860-300=560/4=140)
  ...makeCheckItem(0, "第一印象（清潔感/話し方/礼儀/目線）", true, 304, 136, "tc_ck1"),
  ...makeCheckItem(1, "簡潔に分かりやすく話せるか", true, 304, 136, "tc_ck2"),
  ...makeCheckItem(2, "企業理念や事業内容への理解", true, 304, 136, "tc_ck3"),
  ...makeCheckItem(3, "書類と面接の発言に矛盾がないか", true, 304, 136, "tc_ck4"),

  ...makeBubble("一次面接は第一印象が大事だワン！✨"),
];

// =============================================
// QA SLIDE — spacing大幅拡大 (4項目なので均等に)
// =============================================
const MOCK_QA_ELEMENTS: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),

  ...makeTabBar(["一次面接①", "一次面接②", "二次面接①", "二次面接②", "最終面接①", "最終面接②"], 1, 68),

  ...textInBox(
    { x: 96, y: 128, width: 888, height: 64, bg: COLOR.teal, borderRadius: 8, zIndex: 3 },
    { text: "一次面接の頻出質問と対策", fontSize: 30, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
    { box: "qa_hdr_bg", text: "qa_hdr_txt" },
    { h: 20, v: 8 },
  ),

  // 4 items → spacing=160 (均等配分: 680/4≈170)
  ...makeQAItem(
    "「自己紹介をお願いします」",
    "簡潔にまとめつつ、志望動機や強みを\nまぜるといい印象を与えられるよ！",
    216, "qa1",
  ),
  ...makeQAItem(
    "「なぜこの業界を志望するのですか」",
    "具体的なエピソードや理由を述べる\nことが重要になるよ！",
    376, "qa2",
  ),
  ...makeQAItem(
    "「強み/弱みを教えてください」",
    "短所は、改善努力している点を含めて\n説明するのがポイント！",
    536, "qa3",
  ),
  ...makeQAItem(
    "「学生時代に力を入れたことは何？」",
    "その経験がどのように自己成長に繋\nがったかを説明しよう！",
    696, "qa4",
  ),

  ...makeBubble("質問を事前に準備しておくワン！📝"),
];

// =============================================
// RANKING SLIDE — spacing拡大 (6項目を均等に)
// =============================================
function makeRankItem(
  rank: number, company: string, description: string,
  y: number, id: string,
): El[] {
  const medal = rank <= 3
    ? ["🥇", "🥈", "🥉"][rank - 1]
    : String(rank).padStart(2, "0");
  const medalColor = rank <= 3 ? COLOR.red : COLOR.teal;
  return [
    {
      id: `${id}_rank`, type: "text",
      x: 96, y, width: 64, height: 56,
      rotation: 0, zIndex: 3, opacity: 1,
      text: medal, fontSize: rank <= 3 ? 36 : 44,
      fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: medalColor, textAlign: "center" as const, lineHeight: 1.0,
    },
    {
      id: `${id}_name`, type: "text",
      x: 176, y, width: 480, height: 44,
      rotation: 0, zIndex: 3, opacity: 1,
      text: company, fontSize: 30, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.black, textAlign: "left" as const, lineHeight: 1.3,
    },
    {
      id: `${id}_desc`, type: "text",
      x: 176, y: y + 44, width: 740, height: 32,
      rotation: 0, zIndex: 3, opacity: 1,
      text: description, fontSize: 20, fontFamily: "Noto Sans JP", fontWeight: "bold" as const,
      color: COLOR.gray[400], textAlign: "left" as const, lineHeight: 1.3,
    },
    makeDivider(y + 84, `${id}_div`),
  ];
}

// 6 items → spacing=104 (均等配分: 678/6≈113)
const MOCK_RANKING_ELEMENTS: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),

  ...makeHeader("受かりやすい大手企業30選", "1/5"),

  ...makeRankItem(1, "楽天グループ", "EC・フィンテック — 平均年収780万円", 208, "rk1"),
  ...makeRankItem(2, "サイバーエージェント", "広告・ゲーム・メディア — 平均年収800万円", 312, "rk2"),
  ...makeRankItem(3, "DeNA", "ゲーム・ヘルスケア — 平均年収750万円", 416, "rk3"),
  ...makeRankItem(4, "LINE（LINEヤフー）", "メッセンジャー・AI — 平均年収750万円", 520, "rk4"),
  ...makeRankItem(5, "メルカリ", "フリマアプリ・フィンテック — 平均年収820万円", 624, "rk5"),
  ...makeRankItem(6, "リクルート", "人材・メディア — 平均年収950万円", 728, "rk6"),

  ...makeBubble("この企業リスト保存しておくワン！📌"),
];

// =============================================
// 追加台本 12〜21: 新コンテンツ
// =============================================

// 12: cover — 「共感しまくり！就活生あるある」
const MOCK_COVER_ARUARU: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),
  ...makeBanner("共感しまくり！？", 104),
  { id: "cv2_t1", type: "text", x: 80, y: 232, width: 920, height: 128, rotation: 0, zIndex: 4, opacity: 1,
    text: "就活生", fontSize: 112, fontFamily: "Noto Sans JP", fontWeight: "bold", color: COLOR.black, textAlign: "center", lineHeight: 1.1 },
  { id: "cv2_t2", type: "text", x: 80, y: 376, width: 920, height: 128, rotation: 0, zIndex: 4, opacity: 1,
    text: "あるある", fontSize: 112, fontFamily: "Noto Sans JP", fontWeight: "bold", color: COLOR.red, textAlign: "center", lineHeight: 1.1 },
  makeIllustrationPlaceholder(360, 520, 280, 180, "cv2_ill"),
  ...makeSubtitleBar("何個共感した？スワイプして確かめるワン！", 784),
  ...makeBubble("何個共感した？スワイプして確かめるワン！"),
];

// 13: list — 「GDで評価されるポイント6選」— 6 items spacing=96
const MOCK_LIST_GD: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),
  ...makeHeader("GDで評価されるポイント6選", "1/2"),
  ...makeListItem(0, "01", "論理的に意見を述べる", 208, 104, true, "gd1"),
  ...makeListItem(1, "02", "他のメンバーの意見を引き出す", 208, 104, false, "gd2"),
  ...makeListItem(2, "03", "時間配分を意識する", 208, 104, false, "gd3"),
  ...makeListItem(3, "04", "反対意見も建設的に伝える", 208, 104, true, "gd4"),
  ...makeListItem(4, "05", "最後に結論をまとめる", 208, 104, false, "gd5"),
  ...makeListItem(5, "06", "全員が発言できる場を作る", 208, 104, false, "gd6"),
  ...makeBubble("GDは協調性が一番大事だワン！🤝"),
];

// 14: comparison — 「内定者 vs 不合格者の違い」
const MOCK_COMP_NAITEI: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),
  { id: "cn_title", type: "text", x: 80, y: 104, width: 920, height: 56, rotation: 0, zIndex: 3, opacity: 1,
    text: "内定者 vs 不合格者の違い", fontSize: 44, fontFamily: "Noto Sans JP", fontWeight: "bold", color: COLOR.black, textAlign: "center", lineHeight: 1.3 },
  { id: "cn_vline", type: "shape", x: 540, y: 176, width: 2, height: 640, rotation: 0, zIndex: 2, opacity: 0.2,
    shapeType: "rect", backgroundColor: COLOR.gray[200], borderColor: "transparent", borderWidth: 0, borderRadius: 0 },
  ...makePill(COL_L + 110, 176, 192, 48, "✅ 内定者", COLOR.teal, COLOR.white, "cn_ll"),
  ...makePill(COL_R + 110, 176, 192, 48, "❌ 不合格者", COLOR.red, COLOR.white, "cn_lr"),
  ...makeCompRow(0, "企業の理念を理解", "志望動機が曖昧", 256, 120, "cn1"),
  ...makeCompRow(1, "具体的なエピソード", "抽象的な話ばかり", 256, 120, "cn2"),
  ...makeCompRow(2, "逆質問を3つ以上準備", "逆質問「特にないです」", 256, 120, "cn3"),
  ...makeCompRow(3, "入社後のビジョン明確", "「とりあえず安定」", 256, 120, "cn4"),
  ...makeCompRow(4, "PREP法で回答", "結論が最後にくる", 256, 120, "cn5"),
  ...makeBubble("内定者のマネをしてみるワン！🎯"),
];

// 15: checklist — 「内定承諾前チェックリスト」— 8 items spacing=80
const MOCK_CHECK_NAITEI: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),
  ...makeHeader("内定承諾前チェックリスト"),
  ...makeCheckItem(0, "年収・賞与・昇給制度を確認した", true, 208, 80, "nc1"),
  ...makeCheckItem(1, "残業時間・休日数を調べた", true, 208, 80, "nc2"),
  ...makeCheckItem(2, "配属先・勤務地を確認した", true, 208, 80, "nc3"),
  ...makeCheckItem(3, "口コミサイトで社員の声を見た", true, 208, 80, "nc4"),
  ...makeCheckItem(4, "OB/OG訪問で実態を聞いた", true, 208, 80, "nc5"),
  ...makeCheckItem(5, "他社の内定と比較検討した", true, 208, 80, "nc6"),
  ...makeCheckItem(6, "家族に相談した", true, 208, 80, "nc7"),
  ...makeCheckItem(7, "入社後のキャリアパスを確認した", true, 208, 80, "nc8"),
  ...makeBubble("承諾は慎重に！後悔しない選択をワン🐕"),
];

// 16: point-card — 「ガクチカの書き方」
const MOCK_PC_GAKUCHIKA: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),
  makeSeriesHeader("評価されるガクチカネタ60選", 72),
  ...makePointTitle("①", "STAR法で書く", 128),
  ...makePriorityLine(4, "構造化すれば誰でも書ける！", 232),
  makeIllustrationPlaceholder(320, 320, 360, 180, "gk_ill"),
  ...makeExplanationBox(
    "Situation（状況）→ Task（課題）\n→ Action（行動）→ Result（結果）\nの順に書くことで、論理的で\n伝わりやすいガクチカが完成！",
    520, 310, "gk_exp",
  ),
  ...makeBubble("STAR法は万能テンプレだワン！✍️"),
];

// 17: company-card — 「食品業界 隠れ優良企業」— spacing拡大
const MOCK_CC_FOOD: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),
  ...makeTabBar(["01", "02", "03", "04", "05", "06"], 1, 68),
  ...makeCompanyCard(
    "味の素", "1,047万円", "50名",
    "調味料から医薬品まで幅広い事業展開。海外売上比率60%超のグローバル食品メーカー。福利厚生充実",
    124, "fd1",
  ),
  ...makeCompanyCard(
    "キッコーマン", "820万円", "30名",
    "醤油で世界シェアNo.1。北米・欧州に強く海外駐在チャンスも。ワークライフバランス◎",
    380, "fd2",
  ),
  ...makeCompanyCard(
    "カゴメ", "760万円", "40名",
    "トマト製品でトップシェア。健康志向の高まりで成長中。残業少なく働きやすい環境",
    636, "fd3",
  ),
  ...makeBubble("食品業界は安定性バツグンだワン！🍅"),
];

// 18: deadline — 「3/15-21 本選考 締切38選」— spacing拡大
const MOCK_DL_MAR: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),
  ...textInBox(
    { x: 96, y: 88, width: 888, height: 56, bg: COLOR.teal, borderRadius: 8, zIndex: 3 },
    { text: "3/15 締切", fontSize: 30, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
    { box: "dm_h1_bg", text: "dm_h1_txt" }, { h: 16, v: 8 },
  ),
  ...makeDeadlineItem("メーカー", INDUSTRY_COLORS["メーカー"], "トヨタ自動車", COLOR.black, 168, "dm1"),
  ...makeDeadlineItem("金融", INDUSTRY_COLORS["金融"], "三井住友銀行", COLOR.black, 228, "dm2"),
  ...makeDeadlineItem("IT", INDUSTRY_COLORS["IT"], "NTTデータ", COLOR.teal, 288, "dm3"),
  ...textInBox(
    { x: 96, y: 376, width: 888, height: 56, bg: COLOR.teal, borderRadius: 8, zIndex: 3 },
    { text: "3/17 締切", fontSize: 30, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
    { box: "dm_h2_bg", text: "dm_h2_txt" }, { h: 16, v: 8 },
  ),
  ...makeDeadlineItem("商社", INDUSTRY_COLORS["商社"], "伊藤忠商事", COLOR.black, 456, "dm4"),
  ...makeDeadlineItem("メーカー", INDUSTRY_COLORS["メーカー"], "ソニーグループ", COLOR.black, 516, "dm5"),
  ...makeDeadlineItem("インフラ", INDUSTRY_COLORS["インフラ"], "東京電力HD", COLOR.teal, 576, "dm6"),
  ...textInBox(
    { x: 96, y: 664, width: 888, height: 56, bg: COLOR.teal, borderRadius: 8, zIndex: 3 },
    { text: "3/20 締切", fontSize: 30, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
    { box: "dm_h3_bg", text: "dm_h3_txt" }, { h: 16, v: 8 },
  ),
  ...makeDeadlineItem("金融", INDUSTRY_COLORS["金融"], "野村證券", COLOR.black, 744, "dm7"),
  ...makeDeadlineItem("IT", INDUSTRY_COLORS["IT"], "富士通", COLOR.teal, 804, "dm8"),
  ...makeBubble("3月の締切ラッシュに注意だワン！⚡"),
];

// 19: qa — 「最終面接の頻出質問」— spacing=160で均等配分
const MOCK_QA_FINAL: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),
  ...makeTabBar(["一次面接①", "一次面接②", "二次面接①", "二次面接②", "最終面接①", "最終面接②"], 4, 68),
  ...textInBox(
    { x: 96, y: 128, width: 888, height: 64, bg: COLOR.teal, borderRadius: 8, zIndex: 3 },
    { text: "最終面接の頻出質問と対策", fontSize: 30, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
    { box: "qf_hdr_bg", text: "qf_hdr_txt" }, { h: 20, v: 8 },
  ),
  ...makeQAItem("「入社後のキャリアプランは？」", "5年後・10年後の具体的なビジョンを\n企業の事業と紐づけて語ろう！", 216, "qf1"),
  ...makeQAItem("「他社の選考状況を教えて」", "正直に答えつつ、御社が第一志望で\nある理由を明確に伝えよう！", 376, "qf2"),
  ...makeQAItem("「当社でなければならない理由は？」", "企業研究で見つけた独自の強みと\n自分の価値観を結びつけよう！", 536, "qf3"),
  ...makeQAItem("「最後に伝えたいことは？」", "入社への熱意と、自分が貢献できる\n具体的なポイントをアピール！", 696, "qf4"),
  ...makeBubble("最終面接は熱意が最重要だワン！🔥"),
];

// 20: ranking — 「東京勤務 高年収企業」— spacing=104で均等
const MOCK_RANK_TOKYO: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),
  ...makeHeader("東京勤務 高年収企業28選", "2/5"),
  ...makeRankItem(1, "キーエンス", "精密機器 — 平均年収2,183万円", 208, "rt1"),
  ...makeRankItem(2, "三菱商事", "総合商社 — 平均年収1,939万円", 312, "rt2"),
  ...makeRankItem(3, "伊藤忠商事", "総合商社 — 平均年収1,730万円", 416, "rt3"),
  ...makeRankItem(4, "三井物産", "総合商社 — 平均年収1,783万円", 520, "rt4"),
  ...makeRankItem(5, "ゴールドマン・サックス", "外資金融 — 平均年収1,500万円", 624, "rt5"),
  ...makeRankItem(6, "野村総合研究所", "ITコンサル — 平均年収1,271万円", 728, "rt6"),
  ...makeBubble("高年収を目指すなら要チェックだワン！💰"),
];

// 21: tab-checklist — 「二次面接のポイント」— spacing拡大
const MOCK_TC_NIJI: El[] = [
  makeBrand("よりそい就活"),
  makeCard(),
  ...makeTabBar(["一次面接①", "一次面接②", "二次面接①", "二次面接②", "最終面接①", "最終面接②"], 2, 68),
  ...textInBox(
    { x: 160, y: 128, width: 760, height: 72, bg: COLOR.teal, borderRadius: 8, zIndex: 3 },
    { text: "二次面接", fontSize: 40, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
    { box: "tc2_t_bg", text: "tc2_t_txt" }, { h: 20, v: 8 },
  ),
  ...makePill(96, 232, 220, 44, "チェックリスト", COLOR.teal, COLOR.white, "tc2_ck"),
  // 5 items → spacing=112 (y232+44+24=300 → 860-300=560/5=112)
  ...makeCheckItem(0, "一次面接の回答と一貫性があるか", true, 304, 112, "tc2_c1"),
  ...makeCheckItem(1, "自分の強みを具体的に説明できるか", true, 304, 112, "tc2_c2"),
  ...makeCheckItem(2, "チームでの役割を語れるか", true, 304, 112, "tc2_c3"),
  ...makeCheckItem(3, "困難を乗り越えた経験を準備したか", true, 304, 112, "tc2_c4"),
  ...makeCheckItem(4, "深掘り質問への想定回答があるか", true, 304, 112, "tc2_c5"),
  ...makeBubble("二次はスキルの深掘りが来るワン！💡"),
];

// =============================================
// 21シナリオ一覧
// =============================================
interface Scenario {
  id: number;
  name: string;
  slideType: string;
  elements: El[];
}

const SCENARIOS: Scenario[] = [
  { id: 1,  name: "表紙 — 転職成功の5つの秘訣",       slideType: "cover",          elements: MOCK_COVER_ELEMENTS },
  { id: 2,  name: "リスト — 面接で聞かれるTOP5",       slideType: "list",           elements: MOCK_LIST_ELEMENTS },
  { id: 3,  name: "比較 — 転職活動 成功vs失敗",        slideType: "comparison",      elements: MOCK_COMPARISON_ELEMENTS },
  { id: 4,  name: "チェック — 転職前チェックリスト",    slideType: "checklist",       elements: MOCK_CHECKLIST_ELEMENTS },
  { id: 5,  name: "CTA — フォローして最新情報をゲット", slideType: "cta",            elements: MOCK_CTA_ELEMENTS },
  { id: 6,  name: "ポイント — 自己分析のやり方",       slideType: "point-card",      elements: MOCK_POINT_CARD_ELEMENTS },
  { id: 7,  name: "企業カード — IT企業20選",           slideType: "company-card",    elements: MOCK_COMPANY_CARD_ELEMENTS },
  { id: 8,  name: "締切一覧 — 4/1-7 本選考締切",      slideType: "deadline",        elements: MOCK_DEADLINE_ELEMENTS },
  { id: 9,  name: "タブ型 — 一次面接のポイント",       slideType: "tab-checklist",   elements: MOCK_TAB_CHECKLIST_ELEMENTS },
  { id: 10, name: "Q&A — 一次面接の頻出質問",         slideType: "qa",             elements: MOCK_QA_ELEMENTS },
  { id: 11, name: "ランキング — 受かりやすい大手企業",  slideType: "ranking",         elements: MOCK_RANKING_ELEMENTS },
  { id: 12, name: "表紙 — 就活生あるある",             slideType: "cover",          elements: MOCK_COVER_ARUARU },
  { id: 13, name: "リスト — GD評価ポイント6選",        slideType: "list",           elements: MOCK_LIST_GD },
  { id: 14, name: "比較 — 内定者vs不合格者の違い",     slideType: "comparison",      elements: MOCK_COMP_NAITEI },
  { id: 15, name: "チェック — 内定承諾前チェックリスト", slideType: "checklist",       elements: MOCK_CHECK_NAITEI },
  { id: 16, name: "ポイント — ガクチカの書き方",       slideType: "point-card",      elements: MOCK_PC_GAKUCHIKA },
  { id: 17, name: "企業カード — 食品業界 隠れ優良",    slideType: "company-card",    elements: MOCK_CC_FOOD },
  { id: 18, name: "締切一覧 — 3/15-21 本選考締切",    slideType: "deadline",        elements: MOCK_DL_MAR },
  { id: 19, name: "Q&A — 最終面接の頻出質問",         slideType: "qa",             elements: MOCK_QA_FINAL },
  { id: 20, name: "ランキング — 東京勤務 高年収企業",   slideType: "ranking",         elements: MOCK_RANK_TOKYO },
];

const SCENARIO_TC_NIJI: Scenario = { id: 21, name: "タブ型 — 二次面接のポイント", slideType: "tab-checklist", elements: MOCK_TC_NIJI };

// =============================================
// API Route
// =============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slideType, scenarioId } = body;

    await new Promise((r) => setTimeout(r, 200));

    if (scenarioId !== undefined) {
      const allScenarios = [...SCENARIOS, SCENARIO_TC_NIJI];
      const scenario = allScenarios.find((s) => s.id === scenarioId) || SCENARIOS[0];
      return NextResponse.json({
        elements: scenario.elements,
        scenario: { id: scenario.id, name: scenario.name, slideType: scenario.slideType },
        scenarios: allScenarios.map((s) => ({ id: s.id, name: s.name, slideType: s.slideType })),
        background: { type: "gradient", color: "#38BDF8", gradient: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 40%, #06B6D4 70%, #22D3EE 100%)" },
        colorScheme: {
          primary: "#38BDF8", secondary: "#0EA5E9", bg: "#38BDF8", accent: "#CC2B2B",
          textLight: "#FFFFFF", textDark: "#1A1A1A", cardBg: "#FFFFFF",
        },
      });
    }

    let elements;
    switch (slideType) {
      case "list": elements = MOCK_LIST_ELEMENTS; break;
      case "comparison": elements = MOCK_COMPARISON_ELEMENTS; break;
      case "checklist": elements = MOCK_CHECKLIST_ELEMENTS; break;
      case "cta": elements = MOCK_CTA_ELEMENTS; break;
      case "point-card": elements = MOCK_POINT_CARD_ELEMENTS; break;
      case "company-card": elements = MOCK_COMPANY_CARD_ELEMENTS; break;
      case "deadline": elements = MOCK_DEADLINE_ELEMENTS; break;
      case "tab-checklist": elements = MOCK_TAB_CHECKLIST_ELEMENTS; break;
      case "qa": elements = MOCK_QA_ELEMENTS; break;
      case "ranking": elements = MOCK_RANKING_ELEMENTS; break;
      default: elements = MOCK_COVER_ELEMENTS;
    }

    return NextResponse.json({
      elements,
      scenarios: [...SCENARIOS, SCENARIO_TC_NIJI].map((s) => ({ id: s.id, name: s.name, slideType: s.slideType })),
      background: { type: "gradient", color: "#38BDF8", gradient: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 40%, #06B6D4 70%, #22D3EE 100%)" },
      colorScheme: {
        primary: "#38BDF8", secondary: "#0EA5E9", bg: "#38BDF8", accent: "#CC2B2B",
        textLight: "#FFFFFF", textDark: "#1A1A1A", cardBg: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Test generation failed:", error);
    return NextResponse.json({ error: "Test generation failed" }, { status: 500 });
  }
}
