/**
 * Built-in Templates — DB不要でテンプレートを使えるようにする
 *
 * ai-generate-testのハードコード済みレイアウトと同じ構造を再利用。
 * GPT-4o-miniにJSON生成させるのをやめて、確実にきれいなレイアウトを保証する。
 */

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
} from "./layout-rules";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type El = any;

const BG = {
  type: "gradient" as const,
  color: "#38BDF8",
  gradient:
    "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 40%, #06B6D4 70%, #22D3EE 100%)",
};

// =============================================
// ローカルヘルパー (ai-generate-testと同じ)
// =============================================

function makeListItem(
  index: number,
  num: string,
  text: string,
  startY: number,
  spacing: number,
  hasImportant: boolean,
  idPrefix: string,
): El[] {
  const y = startY + index * spacing;
  const elements: El[] = [
    {
      id: `${idPrefix}_num`,
      type: "text",
      x: 96,
      y,
      width: 64,
      height: 56,
      rotation: 0,
      zIndex: 3,
      opacity: 1,
      text: num,
      fontSize: TYPO.h3Number.fontSize,
      fontFamily: "Noto Sans JP",
      fontWeight: TYPO.h3Number.fontWeight,
      color: TYPO.h3Number.color,
      textAlign: "left",
      lineHeight: TYPO.h3Number.lineHeight,
    },
    {
      id: `${idPrefix}_txt`,
      type: "text",
      x: 176,
      y: y + 4,
      width: 640,
      height: 52,
      rotation: 0,
      zIndex: 3,
      opacity: 1,
      text,
      fontSize: TYPO.h3.fontSize,
      fontFamily: "Noto Sans JP",
      fontWeight: TYPO.h3.fontWeight,
      color: TYPO.h3.color,
      textAlign: "left",
      lineHeight: TYPO.h3.lineHeight,
    },
    makeDivider(y + 68, `${idPrefix}_div`),
  ];
  if (hasImportant) {
    elements.push(...makeImportantBadge(880, y + 8, `${idPrefix}_imp`));
  }
  return elements;
}

const COL_L = 80;
const COL_R = 548;
const COL_W = 432;

function makeCompRow(
  index: number,
  left: string,
  right: string,
  startY: number,
  spacing: number,
  id: string,
): El[] {
  const y = startY + index * spacing;
  return [
    {
      id: `${id}_l`,
      type: "text",
      x: COL_L,
      y,
      width: COL_W,
      height: 80,
      rotation: 0,
      zIndex: 3,
      opacity: 1,
      text: left,
      fontSize: 30,
      fontFamily: "Noto Sans JP",
      fontWeight: "bold",
      color: COLOR.teal,
      textAlign: "center",
      lineHeight: 1.5,
    },
    {
      id: `${id}_r`,
      type: "text",
      x: COL_R,
      y,
      width: COL_W,
      height: 80,
      rotation: 0,
      zIndex: 3,
      opacity: 1,
      text: right,
      fontSize: 30,
      fontFamily: "Noto Sans JP",
      fontWeight: "bold",
      color: COLOR.red,
      textAlign: "center",
      lineHeight: 1.5,
    },
    makeDivider(y + 96, `${id}_div`),
  ];
}

function makeCheckItem(
  index: number,
  text: string,
  checked: boolean,
  startY: number,
  spacing: number,
  idPrefix: string,
): El[] {
  const y = startY + index * spacing;
  return [
    {
      id: `${idPrefix}_chk`,
      type: "text",
      x: 96,
      y,
      width: 56,
      height: 56,
      rotation: 0,
      zIndex: 3,
      opacity: 1,
      text: checked ? "☑" : "☐",
      fontSize: 36,
      fontFamily: "Noto Sans JP",
      fontWeight: "bold",
      color: checked ? COLOR.teal : COLOR.gray[200],
      textAlign: "left",
      lineHeight: 1.0,
    },
    {
      id: `${idPrefix}_txt`,
      type: "text",
      x: 168,
      y: y + 4,
      width: 740,
      height: 52,
      rotation: 0,
      zIndex: 3,
      opacity: 1,
      text,
      fontSize: TYPO.h3.fontSize,
      fontFamily: "Noto Sans JP",
      fontWeight: checked ? "bold" : "normal",
      color: checked ? COLOR.black : COLOR.gray[300],
      textAlign: "left",
      lineHeight: TYPO.h3.lineHeight,
    },
    makeDivider(y + 68, `${idPrefix}_div`),
  ];
}

function makeRankItem(
  rank: number,
  company: string,
  description: string,
  y: number,
  id: string,
): El[] {
  const medal = String(rank).padStart(2, "0");
  const medalColor = COLOR.teal;
  return [
    {
      id: `${id}_rank`,
      type: "text",
      x: 96,
      y,
      width: 64,
      height: 56,
      rotation: 0,
      zIndex: 3,
      opacity: 1,
      text: medal,
      fontSize: 44,
      fontFamily: "Noto Sans JP",
      fontWeight: "bold",
      color: medalColor,
      textAlign: "center",
      lineHeight: 1.0,
    },
    {
      id: `${id}_name`,
      type: "text",
      x: 176,
      y,
      width: 480,
      height: 44,
      rotation: 0,
      zIndex: 3,
      opacity: 1,
      text: company,
      fontSize: 30,
      fontFamily: "Noto Sans JP",
      fontWeight: "bold",
      color: COLOR.black,
      textAlign: "left",
      lineHeight: 1.3,
    },
    {
      id: `${id}_desc`,
      type: "text",
      x: 176,
      y: y + 44,
      width: 740,
      height: 32,
      rotation: 0,
      zIndex: 3,
      opacity: 1,
      text: description,
      fontSize: 20,
      fontFamily: "Noto Sans JP",
      fontWeight: "bold",
      color: COLOR.gray[400],
      textAlign: "left",
      lineHeight: 1.3,
    },
    makeDivider(y + 84, `${id}_div`),
  ];
}

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

// =============================================
// テンプレートビルダー (y座標: card y=80 基準)
// =============================================

function buildCover(): { elements: El[]; slotMap: Record<string, string> } {
  const elements: El[] = [
    makeBrand("@account"),
    makeCard(),
    ...makeBanner("就活生必見！プロが教える", 208),
    {
      id: "cv_title1", type: "text",
      x: 80, y: 359, width: 920, height: 120,
      rotation: 0, zIndex: 4, opacity: 1,
      text: "転職成功の", fontSize: 100,
      fontFamily: "Noto Sans JP", fontWeight: TYPO.hero.fontWeight,
      color: TYPO.hero.color, textAlign: "center", lineHeight: 1.1,
    },
    {
      id: "cv_num", type: "text",
      x: 170, y: 487, width: 280, height: 200,
      rotation: 0, zIndex: 5, opacity: 1,
      text: "5", fontSize: 180,
      fontFamily: "Noto Sans JP", fontWeight: TYPO.heroNumber.fontWeight,
      color: TYPO.heroNumber.color, textAlign: "center", lineHeight: 1.0,
    },
    {
      id: "cv_title2", type: "text",
      x: 395, y: 527, width: 500, height: 160,
      rotation: 0, zIndex: 5, opacity: 1,
      text: "つの秘訣", fontSize: 100,
      fontFamily: "Noto Sans JP", fontWeight: TYPO.hero.fontWeight,
      color: TYPO.hero.color, textAlign: "left", lineHeight: 1.1,
    },
    {
      id: "cv_line", type: "shape",
      x: centerX(600), y: 698, width: 600, height: 4,
      rotation: 0, zIndex: 3, opacity: 0.3,
      shapeType: "rect", backgroundColor: COLOR.teal,
      borderColor: "transparent", borderWidth: 0, borderRadius: 2,
    },
    {
      id: "cv_sen", type: "text",
      x: 80, y: 739, width: 920, height: 80,
      rotation: 0, zIndex: 4, opacity: 1,
      text: "〜 選 〜", fontSize: 64,
      fontFamily: "Noto Sans JP", fontWeight: "bold",
      color: COLOR.gray[400], textAlign: "center", lineHeight: 1.2,
    },
    {
      id: "cv_sub", type: "text",
      x: 80, y: 850, width: 920, height: 56,
      rotation: 0, zIndex: 4, opacity: 1,
      text: "これを読めば転職活動が変わる！", fontSize: 44,
      fontFamily: "Noto Sans JP", fontWeight: "bold",
      color: COLOR.teal, textAlign: "center", lineHeight: 1.4,
    },
    ...makeSubtitleBar("知らないと損する転職テクニック完全ガイド", 955),
    ...makeBubble("保存して何度も見返してね！📌"),
  ];
  const slotMap: Record<string, string> = {
    brand: "brand",
    title_line1: "cv_title1",
    impact_number: "cv_num",
    title_line2: "cv_title2",
    subtitle: "cv_sub",
    banner: "banner_txt",
    subtitle_bar: "stbar_txt",
    bubble: "bbl_txt",
  };
  return { elements, slotMap };
}

function buildList(): { elements: El[]; slotMap: Record<string, string> } {
  const elements: El[] = [
    makeBrand("@account"),
    makeCard(),
    ...makeHeader("[タイトル]", "1/3"),
    ...makeListItem(0, "01", "[項目1]", 258, 140, false, "li1"),
    ...makeListItem(1, "02", "[項目2]", 258, 140, true, "li2"),
    ...makeListItem(2, "03", "[項目3]", 258, 140, false, "li3"),
    ...makeListItem(3, "04", "[項目4]", 258, 140, true, "li4"),
    ...makeListItem(4, "05", "[項目5]", 258, 140, false, "li5"),
    ...makeBubble("保存して見返してね！📌"),
  ];
  const slotMap: Record<string, string> = {
    brand: "brand",
    header_title: "hdr_txt",
    header_page: "hdr_badge_txt",
    item_1: "li1_txt",
    item_2: "li2_txt",
    item_3: "li3_txt",
    item_4: "li4_txt",
    item_5: "li5_txt",
    bubble: "bbl_txt",
  };
  return { elements, slotMap };
}

function buildComparison(): { elements: El[]; slotMap: Record<string, string> } {
  const elements: El[] = [
    makeBrand("@account"),
    makeCard(),
    {
      id: "cmp_title", type: "text",
      x: 80, y: 154, width: 920, height: 56,
      rotation: 0, zIndex: 3, opacity: 1,
      text: "[タイトル]", fontSize: TYPO.h2.fontSize,
      fontFamily: "Noto Sans JP", fontWeight: TYPO.h2.fontWeight,
      color: TYPO.h2.color, textAlign: "center", lineHeight: TYPO.h2.lineHeight,
    },
    {
      id: "cmp_vline", type: "shape",
      x: 540, y: 226, width: 2, height: 700,
      rotation: 0, zIndex: 2, opacity: 0.2,
      shapeType: "rect", backgroundColor: COLOR.gray[200],
      borderColor: "transparent", borderWidth: 0, borderRadius: 0,
    },
    ...makePill(COL_L + 110, 226, 192, 48, "✅ 成功", COLOR.teal, COLOR.white, "cmp_ll"),
    ...makePill(COL_R + 110, 226, 192, 48, "❌ 失敗", COLOR.red, COLOR.white, "cmp_lr"),
    ...makeCompRow(0, "[良い例1]", "[悪い例1]", 306, 130, "cr1"),
    ...makeCompRow(1, "[良い例2]", "[悪い例2]", 306, 130, "cr2"),
    ...makeCompRow(2, "[良い例3]", "[悪い例3]", 306, 130, "cr3"),
    ...makeCompRow(3, "[良い例4]", "[悪い例4]", 306, 130, "cr4"),
    ...makeCompRow(4, "[良い例5]", "[悪い例5]", 306, 130, "cr5"),
    ...makeBubble("あなたはどっち？💬"),
  ];
  const slotMap: Record<string, string> = {
    brand: "brand",
    title: "cmp_title",
    row_1_l: "cr1_l",
    row_1_r: "cr1_r",
    row_2_l: "cr2_l",
    row_2_r: "cr2_r",
    row_3_l: "cr3_l",
    row_3_r: "cr3_r",
    row_4_l: "cr4_l",
    row_4_r: "cr4_r",
    row_5_l: "cr5_l",
    row_5_r: "cr5_r",
    bubble: "bbl_txt",
  };
  return { elements, slotMap };
}

function buildChecklist(): { elements: El[]; slotMap: Record<string, string> } {
  const elements: El[] = [
    makeBrand("@account"),
    makeCard(),
    ...makeHeader("[タイトル]"),
    ...makeCheckItem(0, "[項目1]", true, 258, 90, "ck1"),
    ...makeCheckItem(1, "[項目2]", true, 258, 90, "ck2"),
    ...makeCheckItem(2, "[項目3]", true, 258, 90, "ck3"),
    ...makeCheckItem(3, "[項目4]", true, 258, 90, "ck4"),
    ...makeCheckItem(4, "[項目5]", true, 258, 90, "ck5"),
    ...makeCheckItem(5, "[項目6]", true, 258, 90, "ck6"),
    ...makeCheckItem(6, "[項目7]", true, 258, 90, "ck7"),
    ...makeCheckItem(7, "[項目8]", true, 258, 90, "ck8"),
    ...makeBubble("全部チェックできた？✅"),
  ];
  const slotMap: Record<string, string> = {
    brand: "brand",
    header_title: "hdr_txt",
    item_1: "ck1_txt",
    item_2: "ck2_txt",
    item_3: "ck3_txt",
    item_4: "ck4_txt",
    item_5: "ck5_txt",
    item_6: "ck6_txt",
    item_7: "ck7_txt",
    item_8: "ck8_txt",
    bubble: "bbl_txt",
  };
  return { elements, slotMap };
}

function buildPointCard(): { elements: El[]; slotMap: Record<string, string> } {
  const elements: El[] = [
    makeBrand("@account"),
    makeCard(),
    makeSeriesHeader("[シリーズ名]", 122),
    ...makePointTitle("①", "[トピック]", 178),
    ...makePriorityLine(5, "", 282),
    ...makeExplanationBox(
      "[詳細説明テキスト]\n[ポイントの解説]",
      360, 540, "pc_exp",
    ),
    ...makeBubble("保存して見返してね！📌"),
  ];
  const slotMap: Record<string, string> = {
    brand: "brand",
    series_header: "shdr",
    point_title: "ptitle_txt",
    explanation: "pc_exp_txt",
    bubble: "bbl_txt",
  };
  return { elements, slotMap };
}

function buildCompanyCard(): { elements: El[]; slotMap: Record<string, string> } {
  const elements: El[] = [
    makeBrand("@account"),
    makeCard(),
    ...makeTabBar(["01", "02", "03", "04", "05", "06", "07"], 0, 118),
    ...makeCompanyCard(
      "[企業名1]", "---万円", "---名",
      "[企業の概要説明テキスト]", 174, "cc1",
    ),
    ...makeCompanyCard(
      "[企業名2]", "---万円", "---名",
      "[企業の概要説明テキスト]", 440, "cc2",
    ),
    ...makeCompanyCard(
      "[企業名3]", "---万円", "---名",
      "[企業の概要説明テキスト]", 706, "cc3",
    ),
    ...makeBubble("企業研究は大事だワン！💼"),
  ];
  const slotMap: Record<string, string> = {
    brand: "brand",
    card_1_name: "cc1_hdr_txt",
    card_1_salary: "cc1_sal_val",
    card_1_count: "cc1_hc_val",
    card_1_desc: "cc1_desc",
    card_2_name: "cc2_hdr_txt",
    card_2_salary: "cc2_sal_val",
    card_2_count: "cc2_hc_val",
    card_2_desc: "cc2_desc",
    card_3_name: "cc3_hdr_txt",
    card_3_salary: "cc3_sal_val",
    card_3_count: "cc3_hc_val",
    card_3_desc: "cc3_desc",
    bubble: "bbl_txt",
  };
  return { elements, slotMap };
}

function buildDeadline(): { elements: El[]; slotMap: Record<string, string> } {
  const defColor = INDUSTRY_COLORS["その他"];
  const elements: El[] = [
    makeBrand("@account"),
    makeCard(),
    // 日付ヘッダー1
    ...textInBox(
      { x: 96, y: 138, width: 888, height: 56, bg: COLOR.teal, borderRadius: 8, zIndex: 3 },
      { text: "[日付1] 締切", fontSize: 30, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
      { box: "dl_hdr_bg", text: "dl_hdr_txt" },
      { h: 16, v: 8 },
    ),
    ...makeDeadlineItem("[業界]", defColor, "[企業名1]", COLOR.black, 218, "dl1"),
    ...makeDeadlineItem("[業界]", defColor, "[企業名2]", COLOR.black, 278, "dl2"),
    ...makeDeadlineItem("[業界]", defColor, "[企業名3]", COLOR.black, 338, "dl3"),
    ...makeDeadlineItem("[業界]", defColor, "[企業名4]", COLOR.teal, 398, "dl4"),
    // 日付ヘッダー2
    ...textInBox(
      { x: 96, y: 482, width: 888, height: 56, bg: COLOR.teal, borderRadius: 8, zIndex: 3 },
      { text: "[日付2] 締切", fontSize: 30, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
      { box: "dl_hdr2_bg", text: "dl_hdr2_txt" },
      { h: 16, v: 8 },
    ),
    ...makeDeadlineItem("[業界]", defColor, "[企業名5]", COLOR.black, 562, "dl5"),
    ...makeDeadlineItem("[業界]", defColor, "[企業名6]", COLOR.black, 622, "dl6"),
    ...makeDeadlineItem("[業界]", defColor, "[企業名7]", COLOR.teal, 682, "dl7"),
    ...makeDeadlineItem("[業界]", defColor, "[企業名8]", COLOR.teal, 742, "dl8"),
    ...makeDeadlineItem("[業界]", defColor, "[企業名9]", COLOR.teal, 802, "dl9"),
    ...makeDeadlineItem("[業界]", defColor, "[企業名10]", COLOR.black, 862, "dl10"),
    ...makeBubble("締切を見逃さないでね！📅"),
  ];
  const slotMap: Record<string, string> = {
    brand: "brand",
    date_header_1: "dl_hdr_txt",
    date_header_2: "dl_hdr2_txt",
    item_1_industry: "dl1_ind_txt",
    item_1_company: "dl1_name",
    item_2_industry: "dl2_ind_txt",
    item_2_company: "dl2_name",
    item_3_industry: "dl3_ind_txt",
    item_3_company: "dl3_name",
    item_4_industry: "dl4_ind_txt",
    item_4_company: "dl4_name",
    item_5_industry: "dl5_ind_txt",
    item_5_company: "dl5_name",
    item_6_industry: "dl6_ind_txt",
    item_6_company: "dl6_name",
    item_7_industry: "dl7_ind_txt",
    item_7_company: "dl7_name",
    item_8_industry: "dl8_ind_txt",
    item_8_company: "dl8_name",
    item_9_industry: "dl9_ind_txt",
    item_9_company: "dl9_name",
    item_10_industry: "dl10_ind_txt",
    item_10_company: "dl10_name",
    bubble: "bbl_txt",
  };
  return { elements, slotMap };
}

function buildTabChecklist(): { elements: El[]; slotMap: Record<string, string> } {
  const elements: El[] = [
    makeBrand("@account"),
    makeCard(),
    ...makeTabBar(["セクション①", "セクション②", "セクション③", "セクション④", "セクション⑤", "セクション⑥"], 0, 118),
    ...textInBox(
      { x: 160, y: 178, width: 760, height: 72, bg: COLOR.teal, borderRadius: 8, zIndex: 3 },
      { text: "[セクション名]", fontSize: 40, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
      { box: "tc_title_bg", text: "tc_title_txt" },
      { h: 20, v: 8 },
    ),
    ...makePill(96, 282, 220, 44, "チェックリスト", COLOR.teal, COLOR.white, "tc_cklabel"),
    ...makeCheckItem(0, "[項目1]", true, 354, 150, "tc_ck1"),
    ...makeCheckItem(1, "[項目2]", true, 354, 150, "tc_ck2"),
    ...makeCheckItem(2, "[項目3]", true, 354, 150, "tc_ck3"),
    ...makeCheckItem(3, "[項目4]", true, 354, 150, "tc_ck4"),
    ...makeBubble("チェックしてみてね！✨"),
  ];
  const slotMap: Record<string, string> = {
    brand: "brand",
    section_title: "tc_title_txt",
    item_1: "tc_ck1_txt",
    item_2: "tc_ck2_txt",
    item_3: "tc_ck3_txt",
    item_4: "tc_ck4_txt",
    bubble: "bbl_txt",
  };
  return { elements, slotMap };
}

function buildQA(): { elements: El[]; slotMap: Record<string, string> } {
  const elements: El[] = [
    makeBrand("@account"),
    makeCard(),
    ...makeTabBar(["セクション①", "セクション②", "セクション③", "セクション④", "セクション⑤", "セクション⑥"], 0, 118),
    ...textInBox(
      { x: 96, y: 178, width: 888, height: 64, bg: COLOR.teal, borderRadius: 8, zIndex: 3 },
      { text: "[Q&Aタイトル]", fontSize: 30, fontWeight: "bold", color: COLOR.white, textAlign: "center", lineHeight: 1.2 },
      { box: "qa_hdr_bg", text: "qa_hdr_txt" },
      { h: 20, v: 8 },
    ),
    ...makeQAItem("[質問1]", "[回答1]", 266, "qa1"),
    ...makeQAItem("[質問2]", "[回答2]", 440, "qa2"),
    ...makeQAItem("[質問3]", "[回答3]", 614, "qa3"),
    ...makeQAItem("[質問4]", "[回答4]", 788, "qa4"),
    ...makeBubble("質問を事前に準備しよう！📝"),
  ];
  const slotMap: Record<string, string> = {
    brand: "brand",
    section_title: "qa_hdr_txt",
    q_1: "qa1_q",
    a_1: "qa1_a",
    q_2: "qa2_q",
    a_2: "qa2_a",
    q_3: "qa3_q",
    a_3: "qa3_a",
    q_4: "qa4_q",
    a_4: "qa4_a",
    bubble: "bbl_txt",
  };
  return { elements, slotMap };
}

function buildRanking(): { elements: El[]; slotMap: Record<string, string> } {
  const elements: El[] = [
    makeBrand("@account"),
    makeCard(),
    ...makeHeader("[ランキングタイトル]", "1/1"),
    ...makeRankItem(1, "[1位]", "[説明]", 258, "rk1"),
    ...makeRankItem(2, "[2位]", "[説明]", 378, "rk2"),
    ...makeRankItem(3, "[3位]", "[説明]", 498, "rk3"),
    ...makeRankItem(4, "[4位]", "[説明]", 618, "rk4"),
    ...makeRankItem(5, "[5位]", "[説明]", 738, "rk5"),
    ...makeRankItem(6, "[6位]", "[説明]", 858, "rk6"),
    ...makeBubble("このリスト保存しておこう！📌"),
  ];
  const slotMap: Record<string, string> = {
    brand: "brand",
    header_title: "hdr_txt",
    header_page: "hdr_badge_txt",
    rank_1_name: "rk1_name",
    rank_1_desc: "rk1_desc",
    rank_2_name: "rk2_name",
    rank_2_desc: "rk2_desc",
    rank_3_name: "rk3_name",
    rank_3_desc: "rk3_desc",
    rank_4_name: "rk4_name",
    rank_4_desc: "rk4_desc",
    rank_5_name: "rk5_name",
    rank_5_desc: "rk5_desc",
    rank_6_name: "rk6_name",
    rank_6_desc: "rk6_desc",
    bubble: "bbl_txt",
  };
  return { elements, slotMap };
}

// =============================================
// メインエクスポート
// =============================================

interface BuiltinTemplate {
  elements: El[];
  background: typeof BG;
  slotMap: Record<string, string>;
}

const builders: Record<string, () => { elements: El[]; slotMap: Record<string, string> }> = {
  cover: buildCover,
  list: buildList,
  comparison: buildComparison,
  checklist: buildChecklist,
  "point-card": buildPointCard,
  "company-card": buildCompanyCard,
  deadline: buildDeadline,
  "tab-checklist": buildTabChecklist,
  qa: buildQA,
  ranking: buildRanking,
};

/**
 * 指定slideTypeのビルトインテンプレートを返す。
 * エレメントはディープコピーされるので安全に変更可能。
 */
export function getBuiltinTemplate(slideType: string): BuiltinTemplate | null {
  const builder = builders[slideType];
  if (!builder) return null;

  const { elements, slotMap } = builder();
  // ディープコピーして返す（元テンプレを汚さない）
  return {
    elements: JSON.parse(JSON.stringify(elements)),
    background: { ...BG },
    slotMap,
  };
}
