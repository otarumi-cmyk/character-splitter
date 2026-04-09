import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const BG = {
  type: "gradient" as const,
  color: "#38BDF8",
  gradient: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 40%, #06B6D4 70%, #22D3EE 100%)",
};

// slideType別のslotMap定義
// key = semantic slot name, value = element ID suffix pattern
function buildSlotMap(slideType: string, elements: Record<string, unknown>[], scenarioId: number): Record<string, string> {
  const map: Record<string, string> = {};
  const find = (id: string) => elements.find((e) => e.id === id);

  // brand は全テンプレ共通
  if (find("brand")) map.brand = "brand";

  // bubble text
  const bblTxt = elements.find((e) => typeof e.id === "string" && (e.id as string).startsWith("bbl") && (e.id as string).endsWith("_txt"));
  if (bblTxt) map.bubble = bblTxt.id as string;

  switch (slideType) {
    case "cover": {
      // scenario 1: cv_ prefix, scenario 12: ar_ prefix
      const isAruaru = scenarioId === 12;
      const p = isAruaru ? "ar" : "cv";
      if (find(`${p}_title1`)) map.title_line1 = `${p}_title1`;
      if (find(`${p}_num`)) map.impact_number = `${p}_num`;
      if (find(`${p}_title2`)) map.title_line2 = `${p}_title2`;
      if (find(`${p}_sen`)) map.suffix = `${p}_sen`;
      if (find(`${p}_sub`)) map.subtitle = `${p}_sub`;
      // banner & subtitle bar
      if (find("banner_txt")) map.banner = "banner_txt";
      if (find("stbar_txt")) map.subtitle_bar = "stbar_txt";
      break;
    }

    case "list": {
      // scenario 2: li{N} prefix, scenario 13: gd{N} prefix
      if (find("hdr_title_txt")) map.header_title = "hdr_title_txt";
      if (find("hdr_page_txt")) map.header_page = "hdr_page_txt";
      // Find list item text elements
      for (let i = 1; i <= 10; i++) {
        const liId = elements.find((e) => {
          const id = e.id as string;
          return id && id.endsWith(`${i}_txt`) && (id.startsWith("li") || id.startsWith("gd"));
        });
        if (liId) map[`item_${i}`] = liId.id as string;
      }
      break;
    }

    case "comparison": {
      // scenario 3: cmp_ prefix, scenario 14: cn_ prefix
      const titleEl = find("cmp_title") || find("cn_title");
      if (titleEl) map.title = titleEl.id as string;
      const llTxt = find("cmp_ll_txt") || find("cn_ll_txt");
      if (llTxt) map.left_label = llTxt.id as string;
      const lrTxt = find("cmp_lr_txt") || find("cn_lr_txt");
      if (lrTxt) map.right_label = lrTxt.id as string;
      for (let i = 1; i <= 10; i++) {
        const lEl = elements.find((e) => {
          const id = e.id as string;
          return id && (id === `cr${i}_l` || id === `cn${i}_l`);
        });
        const rEl = elements.find((e) => {
          const id = e.id as string;
          return id && (id === `cr${i}_r` || id === `cn${i}_r`);
        });
        if (lEl) map[`row_${i}_l`] = lEl.id as string;
        if (rEl) map[`row_${i}_r`] = rEl.id as string;
      }
      break;
    }

    case "checklist": {
      if (find("hdr_title_txt")) map.header_title = "hdr_title_txt";
      for (let i = 1; i <= 10; i++) {
        const ckEl = elements.find((e) => {
          const id = e.id as string;
          return id && id.endsWith(`${i}_txt`) && id.startsWith("ck");
        });
        if (ckEl) map[`item_${i}`] = ckEl.id as string;
      }
      break;
    }

    case "cta": {
      if (find("cta_h1")) map.heading = "cta_h1";
      if (find("cta_sub")) map.subtitle = "cta_sub";
      if (find("cta_name")) map.account_name = "cta_name";
      if (find("cta_desc")) map.account_desc = "cta_desc";
      if (find("cta_btn_txt")) map.button = "cta_btn_txt";
      if (find("cta_benefits")) map.benefits = "cta_benefits";
      break;
    }

    case "point-card": {
      if (find("shdr_txt")) map.series_header = "shdr_txt";
      const ptNum = find("pt_num") || find("gk_num");
      if (ptNum) map.point_number = ptNum.id as string;
      const ptTitle = find("pt_title") || find("gk_title");
      if (ptTitle) map.point_title = ptTitle.id as string;
      if (find("prio_sub")) map.priority_subtitle = "prio_sub";
      const expTxt = find("pc_exp_txt") || find("gk_exp_txt");
      if (expTxt) map.explanation = expTxt.id as string;
      break;
    }

    case "company-card": {
      for (let i = 1; i <= 3; i++) {
        const prefixes = [`cc${i}`, `fd${i}`];
        for (const p of prefixes) {
          if (find(`${p}_name`)) {
            map[`card_${i}_name`] = `${p}_name`;
            if (find(`${p}_salary`)) map[`card_${i}_salary`] = `${p}_salary`;
            if (find(`${p}_count`)) map[`card_${i}_count`] = `${p}_count`;
            if (find(`${p}_desc`)) map[`card_${i}_desc`] = `${p}_desc`;
            break;
          }
        }
      }
      break;
    }

    case "deadline": {
      // date headers & items
      const dlPrefixes = scenarioId === 18 ? "dm" : "dl";
      // Find all _txt headers
      for (let i = 1; i <= 3; i++) {
        const hdrId = `${dlPrefixes}_hdr${i === 1 ? "" : String(i)}_txt`;
        if (find(hdrId)) map[`date_header_${i}`] = hdrId;
      }
      // Find industry & company text elements
      for (let i = 1; i <= 10; i++) {
        const indEl = find(`${dlPrefixes}${i}_industry_txt`);
        if (indEl) map[`item_${i}_industry`] = indEl.id as string;
        const compEl = find(`${dlPrefixes}${i}_company_txt`);
        if (compEl) map[`item_${i}_company`] = compEl.id as string;
      }
      break;
    }

    case "tab-checklist": {
      const titleEl = find("tc_title_txt") || find("tc2_t_txt");
      if (titleEl) map.section_title = titleEl.id as string;
      const ckLabel = find("tc_cklabel_txt") || find("tc2_ck_txt");
      if (ckLabel) map.checklist_label = ckLabel.id as string;
      for (let i = 1; i <= 8; i++) {
        const el = elements.find((e) => {
          const id = e.id as string;
          return id && (id === `tc_ck${i}_txt` || id === `tc2_ck${i}_txt`);
        });
        if (el) map[`item_${i}`] = el.id as string;
      }
      break;
    }

    case "qa": {
      const hdrEl = find("qa_hdr_txt") || find("qf_hdr_txt");
      if (hdrEl) map.section_title = hdrEl.id as string;
      for (let i = 1; i <= 8; i++) {
        const qEl = elements.find((e) => {
          const id = e.id as string;
          return id && (id === `qa${i}_q_txt` || id === `qf${i}_q_txt`);
        });
        const aEl = elements.find((e) => {
          const id = e.id as string;
          return id && (id === `qa${i}_a_txt` || id === `qf${i}_a_txt`);
        });
        if (qEl) map[`q_${i}`] = qEl.id as string;
        if (aEl) map[`a_${i}`] = aEl.id as string;
      }
      break;
    }

    case "ranking": {
      if (find("hdr_title_txt")) map.header_title = "hdr_title_txt";
      if (find("hdr_page_txt")) map.header_page = "hdr_page_txt";
      for (let i = 1; i <= 10; i++) {
        const nameEl = find(`rk${i}_name`);
        if (nameEl) map[`rank_${i}_name`] = nameEl.id as string;
        const descEl = find(`rk${i}_desc`);
        if (descEl) map[`rank_${i}_desc`] = descEl.id as string;
      }
      break;
    }
  }

  return map;
}

export async function POST() {
  try {
    // テスト API から全21シナリオを取得
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const scenarioIds = Array.from({ length: 21 }, (_, i) => i + 1);
    let savedCount = 0;

    // 既存のシードテンプレートを削除 (category = "seed")
    await prisma.canvasTemplate.deleteMany({
      where: { category: "seed" },
    });

    for (const scenarioId of scenarioIds) {
      const res = await fetch(`${baseUrl}/api/ai-generate-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const scenario = data.scenario;
      if (!scenario) continue;

      const slotMap = buildSlotMap(
        scenario.slideType,
        data.elements,
        scenario.id,
      );

      await prisma.canvasTemplate.create({
        data: {
          name: scenario.name,
          category: "seed",
          slideType: scenario.slideType,
          slotMap: JSON.stringify(slotMap),
          canvasData: JSON.stringify({
            elements: data.elements,
            background: data.background || BG,
          }),
        },
      });
      savedCount++;
    }

    return NextResponse.json({
      success: true,
      count: savedCount,
      message: `${savedCount}件のテンプレートをシード登録しました`,
    });
  } catch (error) {
    console.error("Seed templates failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "シード登録に失敗しました" },
      { status: 500 },
    );
  }
}
