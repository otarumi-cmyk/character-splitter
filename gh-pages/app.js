// GitHub Pages用の設定（API URLを環境変数から取得）
const API_BASE_URL = window.API_BASE_URL || 'https://your-replit-url.repl.co';

const form = document.getElementById("upload-form");
const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("file-input");
const previewWrapper = document.getElementById("preview-wrapper");
const previewImage = document.getElementById("preview-image");
const confSlider = document.getElementById("conf-threshold");
const confValue = document.getElementById("conf-value");
const maxInstancesInput = document.getElementById("max-instances");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const resultsSection = document.getElementById("results-section");
const resultsSummary = document.getElementById("results-summary");
const resultsGrid = document.getElementById("results-grid");
const downloadZipBtn = document.getElementById("download-zip");
const retryBtn = document.getElementById("retry-btn");
const normalizeSizeCheck = document.getElementById("normalize-size-check");
const normalizeSizeInputs = document.getElementById("normalize-size-inputs");
const normalizeWidthInput = document.getElementById("normalize-width");
const normalizeHeightInput = document.getElementById("normalize-height");

let latestZipUrl = null;

// サイズ統一チェックボックスの表示/非表示
if (normalizeSizeCheck && normalizeSizeInputs) {
  normalizeSizeCheck.addEventListener("change", () => {
    normalizeSizeInputs.style.display = normalizeSizeCheck.checked ? "block" : "none";
  });
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = "status" + (type ? " " + type : "");
}

function resetResults() {
  resultsSection.classList.add("hidden");
  resultsGrid.innerHTML = "";
  resultsSummary.textContent = "";
  latestZipUrl = null;
}

function handleFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setStatus("画像ファイルを選択してください。", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    previewWrapper.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
  setStatus("");
  resetResults();
}

// ドラッグ＆ドロップ
["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove("dragover");
  });
});

dropArea.addEventListener("drop", (e) => {
  const files = e.dataTransfer.files;
  if (files && files[0]) {
    fileInput.files = files;
    handleFile(files[0]);
  }
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  handleFile(file);
});

// スライダー表示
confSlider.addEventListener("input", () => {
  confValue.textContent = confSlider.value;
});

// フォーム送信
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  if (!file) {
    setStatus("先に画像を選択してください。", "error");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("conf_threshold", confSlider.value);
  const maxInstances = maxInstancesInput.value.trim();
  if (maxInstances) {
    formData.append("max_instances", maxInstances);
  }
  
  // サイズ統一オプション
  if (normalizeSizeCheck && normalizeSizeCheck.checked) {
    const width = normalizeWidthInput ? normalizeWidthInput.value.trim() : "";
    const height = normalizeHeightInput ? normalizeHeightInput.value.trim() : "";
    if (width && height) {
      formData.append("normalize_width", width);
      formData.append("normalize_height", height);
    }
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "AI が処理中です...";
  setStatus("サーバーで画像を解析中です。数十秒かかる場合があります。", "");
  resetResults();

  try {
    const res = await fetch(`${API_BASE_URL}/api/split`, {
      method: "POST",
      body: formData,
    });

    // レスポンスが空の場合の処理
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      setStatus(`サーバーエラー (${res.status}): ${text || "レスポンスが空です"}`, "error");
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      const text = await res.text();
      setStatus(`JSON解析エラー: サーバーが不正なレスポンスを返しました。ステータス: ${res.status}`, "error");
      console.error("JSON parse error:", jsonError, "Response text:", text);
      return;
    }

    if (!res.ok) {
      const msg = data.detail || data.message || `処理中にエラーが発生しました (${res.status})`;
      setStatus(msg, "error");
      return;
    }

    const { count, images, zip_url } = data;
    latestZipUrl = zip_url ? `${API_BASE_URL}${zip_url}` : null;

    setStatus(`キャラクターを ${count} 体検出しました。`, "success");
    resultsSummary.textContent = `検出されたキャラクター数: ${count} 体`;
    resultsGrid.innerHTML = "";

    images.forEach((img, index) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const thumb = document.createElement("div");
      thumb.className = "result-thumb";
      const imageEl = document.createElement("img");
      imageEl.src = `${API_BASE_URL}${img.url}`;
      imageEl.alt = img.name;
      thumb.appendChild(imageEl);

      const meta = document.createElement("div");
      meta.className = "result-meta";
      const name = document.createElement("div");
      name.className = "result-name";
      name.textContent = `Character #${String(index + 1).padStart(2, "0")}`;
      const size = document.createElement("div");
      size.textContent = `${img.width} × ${img.height} px`;
      meta.appendChild(name);
      meta.appendChild(size);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "result-dl-btn";
      btn.textContent = "PNG をダウンロード";
      btn.addEventListener("click", () => {
        const a = document.createElement("a");
        a.href = `${API_BASE_URL}${img.url}`;
        a.download = img.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });

      card.appendChild(thumb);
      card.appendChild(meta);
      card.appendChild(btn);
      resultsGrid.appendChild(card);
    });

    resultsSection.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    setStatus("通信エラーが発生しました。時間をおいて再度お試しください。", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "キャラクターを自動分割";
  }
});

// ZIP 一括ダウンロード
downloadZipBtn.addEventListener("click", () => {
  if (!latestZipUrl) return;
  const a = document.createElement("a");
  a.href = latestZipUrl;
  a.download = "characters.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
});

// しきい値変更して再実行しやすくする
retryBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
