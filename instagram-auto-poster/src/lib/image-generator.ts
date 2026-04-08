import puppeteer from "puppeteer";
import path from "path";
import fs from "fs/promises";

export interface SlideData {
  templateType: "cover" | "content-list" | "cta";
  content: Record<string, string>;
  styles?: Record<string, string>;
}

export async function generateSlideImage(slide: SlideData): Promise<Buffer> {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "templates",
    `${slide.templateType}.html`
  );
  let html = await fs.readFile(templatePath, "utf-8");

  // Replace placeholders
  for (const [key, value] of Object.entries(slide.content)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  // Apply custom styles via CSS variables
  if (slide.styles) {
    const styleVars = Object.entries(slide.styles)
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ");
    html = html.replace("</head>", `<style>:root { ${styleVars} }</style></head>`);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const screenshot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: 1080, height: 1080 },
    });

    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
}

export async function generateCarouselImages(
  slides: SlideData[]
): Promise<Buffer[]> {
  const images: Buffer[] = [];
  for (const slide of slides) {
    const image = await generateSlideImage(slide);
    images.push(image);
  }
  return images;
}
