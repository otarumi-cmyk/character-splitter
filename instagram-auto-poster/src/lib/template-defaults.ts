export const templateDefaults = {
  cover: {
    title: "転職成功の\n5つの秘訣",
    subtitle: "知らないと損する転職テクニック",
    brandName: "@your_account",
  },
  "content-list": {
    headerTitle: "転職成功の5つの秘訣",
    item1Title: "自己分析を徹底する",
    item1Desc: "自分の強み・弱みを把握しよう",
    item2Title: "業界研究を欠かさない",
    item2Desc: "志望業界のトレンドを把握",
    item3Title: "職務経歴書を磨く",
    item3Desc: "実績を数字で具体的に記載",
    item4Title: "面接対策は万全に",
    item4Desc: "想定質問への回答を準備",
    item5Title: "エージェントを活用",
    item5Desc: "プロのサポートで効率的に",
  },
  cta: {
    ctaText: "フォローで\n最新情報をGET!",
    profileText: "@your_account をフォロー",
    brandName: "@your_account",
  },
};

export const defaultStyles = {
  "--primary-color": "#6366f1",
  "--secondary-color": "#ec4899",
  "--bg-color": "#ffffff",
  "--text-color": "#1e293b",
};

export type TemplateType = "cover" | "content-list" | "cta";

export function getTemplateFields(type: TemplateType): string[] {
  return Object.keys(templateDefaults[type]);
}
