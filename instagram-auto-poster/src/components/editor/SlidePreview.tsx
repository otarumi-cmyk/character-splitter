"use client";

import { useMemo } from "react";

// Simplified inline template HTML strings based on the full templates
const TEMPLATE_HTML: Record<string, string> = {
  cover: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  :root {
    --primary-color: #6C5CE7;
    --secondary-color: #FD79A8;
    --bg-color: #0F0A1A;
    --text-color: #FFFFFF;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1350px; overflow: hidden;
    font-family: 'Noto Sans JP', -apple-system, sans-serif;
    background: var(--bg-color); color: var(--text-color);
    position: relative;
  }
  .background {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 20% 80%, color-mix(in srgb, var(--primary-color) 35%, transparent) 0%, transparent 70%),
      radial-gradient(ellipse 70% 50% at 85% 20%, color-mix(in srgb, var(--secondary-color) 30%, transparent) 0%, transparent 70%),
      var(--bg-color);
  }
  .deco-circle-1 {
    position: absolute; width: 320px; height: 320px; border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--secondary-color) 20%, transparent);
    top: -80px; right: -60px;
  }
  .deco-circle-2 {
    position: absolute; width: 200px; height: 200px; border-radius: 50%;
    background: linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 15%, transparent), color-mix(in srgb, var(--secondary-color) 10%, transparent));
    bottom: 180px; left: -60px;
  }
  .deco-line-1 {
    position: absolute; width: 200px; height: 3px;
    background: linear-gradient(90deg, var(--primary-color), transparent);
    top: 340px; left: 60px; border-radius: 2px;
  }
  .deco-diamond {
    position: absolute; width: 24px; height: 24px;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    transform: rotate(45deg); bottom: 260px; right: 140px;
    border-radius: 4px; opacity: 0.4;
  }
  .content {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%; padding: 80px 70px; text-align: center;
  }
  .tag {
    display: inline-block; padding: 10px 28px; border-radius: 50px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 30%, transparent), color-mix(in srgb, var(--secondary-color) 30%, transparent));
    border: 1px solid rgba(255,255,255,0.15);
    font-size: 22px; font-weight: 500; letter-spacing: 0.08em;
    margin-bottom: 40px; color: rgba(255,255,255,0.9);
  }
  .title {
    font-size: 72px; font-weight: 900; line-height: 1.3;
    letter-spacing: -0.02em; margin-bottom: 36px;
    background: linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 40%, var(--secondary-color) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; max-width: 900px;
  }
  .subtitle {
    font-size: 28px; font-weight: 500; line-height: 1.6;
    color: rgba(255,255,255,0.7); max-width: 700px;
  }
  .divider {
    width: 60px; height: 4px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    border-radius: 2px; margin: 32px 0;
  }
  .brand-footer {
    position: absolute; bottom: 50px; left: 0; right: 0;
    display: flex; align-items: center; justify-content: center; gap: 14px; z-index: 1;
  }
  .brand-logo {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 18px; color: #fff;
  }
  .brand-text {
    font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.6);
  }
  .glow {
    position: absolute; width: 500px; height: 200px;
    background: radial-gradient(ellipse, color-mix(in srgb, var(--primary-color) 20%, transparent) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%, -60%);
    filter: blur(40px); z-index: 0;
  }
</style>
</head>
<body>
  <div class="background"></div>
  <div class="deco-circle-1"></div>
  <div class="deco-circle-2"></div>
  <div class="deco-line-1"></div>
  <div class="deco-diamond"></div>
  <div class="glow"></div>
  <div class="content">
    <div class="tag">CAREER TIPS</div>
    <h1 class="title">{{title}}</h1>
    <div class="divider"></div>
    <p class="subtitle">{{subtitle}}</p>
  </div>
  <div class="brand-footer">
    <div class="brand-logo">C</div>
    <span class="brand-text">{{brandName}}</span>
  </div>
</body>
</html>`,

  "content-list": `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  :root {
    --primary-color: #6C5CE7;
    --secondary-color: #FD79A8;
    --bg-color: #0F0A1A;
    --text-color: #FFFFFF;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1350px; overflow: hidden;
    font-family: 'Noto Sans JP', -apple-system, sans-serif;
    background: var(--bg-color); color: var(--text-color);
    position: relative;
  }
  .background {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 60% 40% at 10% 90%, color-mix(in srgb, var(--primary-color) 20%, transparent) 0%, transparent 70%),
      radial-gradient(ellipse 50% 35% at 95% 10%, color-mix(in srgb, var(--secondary-color) 15%, transparent) 0%, transparent 70%),
      var(--bg-color);
  }
  .accent-bar {
    position: absolute; top: 0; left: 0; right: 0; height: 6px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--primary-color));
  }
  .side-stripe {
    position: absolute; left: 0; top: 0; bottom: 0; width: 5px;
    background: linear-gradient(180deg, var(--primary-color), var(--secondary-color));
    opacity: 0.4;
  }
  .header {
    position: relative; z-index: 1; padding: 52px 70px 0;
    display: flex; align-items: center; gap: 20px;
  }
  .header-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .header-icon svg { width: 26px; height: 26px; fill: #fff; }
  .header-title {
    font-size: 38px; font-weight: 900;
    background: linear-gradient(135deg, #FFFFFF 30%, var(--secondary-color));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .header-divider {
    margin: 24px 70px 0; height: 1px;
    background: linear-gradient(90deg, color-mix(in srgb, var(--primary-color) 40%, transparent), color-mix(in srgb, var(--secondary-color) 20%, transparent), transparent);
  }
  .items {
    position: relative; z-index: 1; padding: 28px 70px 50px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .item {
    display: flex; align-items: flex-start; gap: 22px;
    padding: 22px 28px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 18px; position: relative; overflow: hidden;
  }
  .item::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
    background: linear-gradient(180deg, var(--primary-color), var(--secondary-color));
    border-radius: 0 2px 2px 0; opacity: 0.6;
  }
  .item-number {
    width: 48px; height: 48px; border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 900; color: #fff; flex-shrink: 0;
  }
  .item-content { flex: 1; min-width: 0; }
  .item-title { font-size: 26px; font-weight: 800; line-height: 1.35; margin-bottom: 6px; color: #fff; }
  .item-desc { font-size: 19px; font-weight: 400; line-height: 1.5; color: rgba(255,255,255,0.55); }
  .swipe-hint {
    position: absolute; bottom: 36px; left: 0; right: 0; text-align: center; z-index: 1;
  }
  .swipe-hint span { font-size: 16px; font-weight: 500; color: rgba(255,255,255,0.3); letter-spacing: 0.1em; }
  .swipe-hint .arrow { display: inline-block; margin-left: 6px; color: color-mix(in srgb, var(--secondary-color) 40%, transparent); }
</style>
</head>
<body>
  <div class="background"></div>
  <div class="accent-bar"></div>
  <div class="side-stripe"></div>
  <div class="header">
    <div class="header-icon">
      <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6m-6 7h6m-6 4h6" stroke="white" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <h2 class="header-title">{{headerTitle}}</h2>
  </div>
  <div class="header-divider"></div>
  <div class="items">
    <div class="item"><div class="item-number">1</div><div class="item-content"><div class="item-title">{{item1Title}}</div><div class="item-desc">{{item1Desc}}</div></div></div>
    <div class="item"><div class="item-number">2</div><div class="item-content"><div class="item-title">{{item2Title}}</div><div class="item-desc">{{item2Desc}}</div></div></div>
    <div class="item"><div class="item-number">3</div><div class="item-content"><div class="item-title">{{item3Title}}</div><div class="item-desc">{{item3Desc}}</div></div></div>
    <div class="item"><div class="item-number">4</div><div class="item-content"><div class="item-title">{{item4Title}}</div><div class="item-desc">{{item4Desc}}</div></div></div>
    <div class="item"><div class="item-number">5</div><div class="item-content"><div class="item-title">{{item5Title}}</div><div class="item-desc">{{item5Desc}}</div></div></div>
  </div>
  <div class="swipe-hint"><span>SWIPE <span class="arrow">&rsaquo;&rsaquo;</span></span></div>
</body>
</html>`,

  cta: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  :root {
    --primary-color: #6C5CE7;
    --secondary-color: #FD79A8;
    --bg-color: #0F0A1A;
    --text-color: #FFFFFF;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1350px; overflow: hidden;
    font-family: 'Noto Sans JP', -apple-system, sans-serif;
    background: var(--bg-color); color: var(--text-color);
    position: relative;
  }
  .background {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 90% 70% at 50% 50%, color-mix(in srgb, var(--primary-color) 25%, transparent) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 20% 80%, color-mix(in srgb, var(--secondary-color) 20%, transparent) 0%, transparent 60%),
      var(--bg-color);
  }
  .ring {
    position: absolute; border-radius: 50%; border: 2px solid;
  }
  .ring-1 {
    width: 600px; height: 600px; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    border-color: color-mix(in srgb, var(--primary-color) 8%, transparent);
  }
  .ring-2 {
    width: 450px; height: 450px; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    border-color: color-mix(in srgb, var(--secondary-color) 10%, transparent);
  }
  .corner-deco {
    position: absolute; width: 120px; height: 120px;
  }
  .corner-deco.top-left {
    top: 30px; left: 30px;
    border-top: 3px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
    border-left: 3px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
    border-radius: 16px 0 0 0;
  }
  .corner-deco.bottom-right {
    bottom: 30px; right: 30px;
    border-bottom: 3px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
    border-right: 3px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
    border-radius: 0 0 16px 0;
  }
  .content {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%; padding: 80px 70px; text-align: center;
  }
  .hand-icon {
    width: 90px; height: 90px; margin-bottom: 32px;
  }
  .cta-text {
    font-size: 56px; font-weight: 900; line-height: 1.35;
    margin-bottom: 40px;
    background: linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 50%, var(--secondary-color) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; max-width: 850px;
  }
  .actions {
    display: flex; gap: 20px; margin-bottom: 48px;
  }
  .action-pill {
    display: flex; align-items: center; gap: 10px;
    padding: 16px 32px; border-radius: 60px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  }
  .action-pill .icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
  .action-pill .icon svg { width: 24px; height: 24px; }
  .action-pill .label { font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.85); }
  .profile-card {
    display: flex; align-items: center; gap: 18px;
    padding: 20px 36px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 20%, transparent), color-mix(in srgb, var(--secondary-color) 15%, transparent));
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px; margin-bottom: 48px;
  }
  .profile-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 22px; color: #fff; flex-shrink: 0;
  }
  .profile-info { text-align: left; }
  .profile-handle { font-size: 24px; font-weight: 800; color: #fff; }
  .profile-label { font-size: 17px; font-weight: 500; color: rgba(255,255,255,0.5); margin-top: 2px; }
  .follow-btn {
    margin-left: 20px; padding: 12px 32px; border-radius: 12px;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    font-size: 20px; font-weight: 800; color: #fff;
  }
  .brand-footer {
    position: absolute; bottom: 44px; left: 0; right: 0;
    display: flex; align-items: center; justify-content: center; gap: 12px; z-index: 1;
  }
  .brand-logo {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 16px; color: #fff;
  }
  .brand-text { font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.45); }
  .glow-center {
    position: absolute; width: 400px; height: 400px;
    top: 50%; left: 50%; transform: translate(-50%, -55%);
    background: radial-gradient(ellipse, color-mix(in srgb, var(--primary-color) 12%, transparent) 0%, transparent 70%);
    filter: blur(50px); z-index: 0;
  }
</style>
</head>
<body>
  <div class="background"></div>
  <div class="ring ring-1"></div>
  <div class="ring ring-2"></div>
  <div class="corner-deco top-left"></div>
  <div class="corner-deco bottom-right"></div>
  <div class="glow-center"></div>
  <div class="content">
    <div class="hand-icon">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="handGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="var(--primary-color)"/><stop offset="100%" stop-color="var(--secondary-color)"/></linearGradient></defs>
        <circle cx="50" cy="50" r="46" fill="url(#handGrad)" opacity="0.15"/>
        <circle cx="50" cy="50" r="46" stroke="url(#handGrad)" stroke-width="3" fill="none" opacity="0.6"/>
        <path d="M50 28V62M50 62L36 48M50 62L64 48" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h1 class="cta-text">{{ctaText}}</h1>
    <div class="actions">
      <div class="action-pill"><div class="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#FD79A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="label">&#x3044;&#x3044;&#x306D;</span></div>
      <div class="action-pill"><div class="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="#6C5CE7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="label">&#x4FDD;&#x5B58;</span></div>
      <div class="action-pill"><div class="icon"><svg viewBox="0 0 24 24" fill="none"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke="#FD79A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="label">&#x30B7;&#x30A7;&#x30A2;</span></div>
    </div>
    <div class="profile-card">
      <div class="profile-avatar">C</div>
      <div class="profile-info">
        <div class="profile-handle">{{profileText}}</div>
        <div class="profile-label">&#x30D5;&#x30A9;&#x30ED;&#x30FC;&#x3057;&#x3066;&#x6700;&#x65B0;&#x60C5;&#x5831;&#x3092;&#x30C1;&#x30A7;&#x30C3;&#x30AF;</div>
      </div>
      <div class="follow-btn">&#x30D5;&#x30A9;&#x30ED;&#x30FC;</div>
    </div>
  </div>
  <div class="brand-footer">
    <div class="brand-logo">C</div>
    <span class="brand-text">{{brandName}}</span>
  </div>
</body>
</html>`,
};

function buildSrcdoc(
  templateType: string,
  content: Record<string, string>,
  styles?: Record<string, string>
): string {
  let html = TEMPLATE_HTML[templateType] || TEMPLATE_HTML["cover"];

  // Replace all {{placeholder}} with content values
  for (const [key, value] of Object.entries(content)) {
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    html = html.replaceAll(`{{${key}}}`, escaped);
  }

  // Remove any remaining unreplaced placeholders
  html = html.replace(/\{\{[^}]+\}\}/g, "");

  // Inject CSS variables from styles
  if (styles && Object.keys(styles).length > 0) {
    const cssVars = Object.entries(styles)
      .map(([key, value]) => `${key}: ${value};`)
      .join(" ");
    html = html.replace(":root {", `:root { ${cssVars}`);
  }

  return html;
}

interface SlidePreviewProps {
  templateType: string;
  content: Record<string, string>;
  styles?: Record<string, string>;
  size?: number;
}

export default function SlidePreview({
  templateType,
  content,
  styles,
  size = 300,
}: SlidePreviewProps) {
  const srcdoc = useMemo(
    () => buildSrcdoc(templateType, content, styles),
    [templateType, content, styles]
  );

  const scale = size / 1080;
  const displayH = size * (1350 / 1080);

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border bg-black"
      style={{ width: size, height: displayH }}
    >
      <iframe
        srcDoc={srcdoc}
        title="Slide Preview"
        sandbox="allow-same-origin"
        className="pointer-events-none origin-top-left border-0"
        style={{
          width: 1080,
          height: 1350,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

export { TEMPLATE_HTML, buildSrcdoc };
