#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.heic'];
const PORT = 19876;

// ── ファイル引数モード ──────────────────────────────────────────
if (process.argv[2] && process.argv[2] !== 'serve') {
  const inputPath = path.resolve(process.argv[2].trim());
  const ext = path.extname(inputPath).toLowerCase();
  if (!fs.existsSync(inputPath)) {
    console.error(`[clipimage] ファイルが見つかりません: ${inputPath}`);
    process.exit(1);
  }
  if (!IMAGE_EXTS.includes(ext)) {
    console.error(`[clipimage] 画像ファイルではありません (${ext})`);
    process.exit(1);
  }
  console.log(inputPath);
  process.exit(0);
}

// ── サーバーモード（引数なし or "serve"）────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>clipimage</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, sans-serif; background: #0f0f0f; color: #eee;
         display: flex; flex-direction: column; align-items: center;
         justify-content: center; min-height: 100vh; gap: 20px; }
  #drop { width: 480px; height: 260px; border: 2px dashed #444; border-radius: 16px;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 12px; cursor: pointer;
          transition: border-color .2s, background .2s; }
  #drop.over { border-color: #4af; background: #1a2a3a; }
  #drop svg { opacity: .4; }
  #drop p { color: #888; font-size: 14px; }
  #result { width: 480px; display: none; flex-direction: column; gap: 10px; }
  #preview { max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: contain; }
  #pathbox { background: #1a1a1a; border: 1px solid #333; border-radius: 8px;
             padding: 12px 16px; font-family: monospace; font-size: 13px;
             color: #4af; word-break: break-all; }
  #copy { background: #4af; color: #000; border: none; border-radius: 8px;
          padding: 10px 20px; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: opacity .15s; }
  #copy:hover { opacity: .85; }
  #copy.done { background: #4a4; color: #fff; }
  #reset { background: none; border: 1px solid #444; border-radius: 8px;
           color: #888; padding: 10px 20px; font-size: 13px; cursor: pointer; }
  #reset:hover { border-color: #888; color: #eee; }
</style>
</head>
<body>
<div id="drop">
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
  <p>画像をここにドロップ</p>
  <p style="font-size:12px">.png .jpg .jpeg .gif .webp など</p>
</div>

<div id="result">
  <img id="preview" src="" alt="">
  <div id="pathbox"></div>
  <div style="display:flex;gap:8px">
    <button id="copy">パスをコピー</button>
    <button id="reset">別の画像</button>
  </div>
</div>

<script>
const drop = document.getElementById('drop');
const result = document.getElementById('result');
const preview = document.getElementById('preview');
const pathbox = document.getElementById('pathbox');
const copyBtn = document.getElementById('copy');
const resetBtn = document.getElementById('reset');

drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', e => {
  e.preventDefault();
  drop.classList.remove('over');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  upload(file);
});
drop.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = () => { if (input.files[0]) upload(input.files[0]); };
  input.click();
});

async function upload(file) {
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch('/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (data.path) {
    preview.src = URL.createObjectURL(file);
    pathbox.textContent = data.path;
    drop.style.display = 'none';
    result.style.display = 'flex';
  }
}

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(pathbox.textContent);
  copyBtn.textContent = 'コピーしました！'; copyBtn.classList.add('done');
  setTimeout(() => { copyBtn.textContent = 'パスをコピー'; copyBtn.classList.remove('done'); }, 2000);
});
resetBtn.addEventListener('click', () => {
  drop.style.display = 'flex'; result.style.display = 'none';
  preview.src = ''; pathbox.textContent = '';
});
</script>
</body>
</html>`;

function parseMultipart(body, boundary) {
  const parts = [];
  const sep = Buffer.from('--' + boundary);
  let start = 0;
  while (true) {
    const idx = body.indexOf(sep, start);
    if (idx === -1) break;
    const end = body.indexOf(sep, idx + sep.length);
    if (end === -1) break;
    const part = body.slice(idx + sep.length + 2, end - 2);
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) { start = end; continue; }
    const headers = part.slice(0, headerEnd).toString();
    const data = part.slice(headerEnd + 4);
    const nameMatch = headers.match(/name="([^"]+)"/);
    const fileMatch = headers.match(/filename="([^"]+)"/);
    if (nameMatch) parts.push({ name: nameMatch[1], filename: fileMatch?.[1], data });
    start = end;
  }
  return parts;
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(HTML);
  }

  if (req.method === 'POST' && req.url === '/upload') {
    const ct = req.headers['content-type'] || '';
    const boundaryMatch = ct.match(/boundary=(.+)/);
    if (!boundaryMatch) { res.writeHead(400); return res.end('{}'); }
    const boundary = boundaryMatch[1];

    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const parts = parseMultipart(body, boundary);
      const imgPart = parts.find(p => p.name === 'image' && p.filename);
      if (!imgPart) { res.writeHead(400); return res.end('{}'); }

      const ext = path.extname(imgPart.filename).toLowerCase() || '.png';
      const outPath = path.join(os.tmpdir(), `clipimage_${Date.now()}${ext}`);
      fs.writeFileSync(outPath, imgPart.data);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ path: outPath }));
    });
    return;
  }

  res.writeHead(404); res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;
  console.log(`[clipimage] ブラウザで開いています... ${url}`);
  console.log('[clipimage] 終了するには Ctrl+C');
  try { execSync(`open "${url}"`); } catch {}
});
