"use client";

import { useState } from "react";
import CanvasEditor, {
  type SlideCanvasData,
  type CanvasElement,
} from "@/components/editor/CanvasEditor";

interface SlideSpec {
  slideNumber: number;
  slideType: string;
  title: string;
  content: string;
  description: string;
}

interface AnalysisResult {
  summary: string;
  totalSlides: number;
  slides: SlideSpec[];
  suggestedHashtags: string[];
  suggestedCaption: string;
}

interface SlideData {
  id: string;
  canvas: SlideCanvasData;
}

const slideTypeLabels: Record<string, { label: string; color: string }> = {
  cover: { label: "表紙", color: "bg-purple-100 text-purple-700" },
  list: { label: "リスト", color: "bg-blue-100 text-blue-700" },
  comparison: { label: "比較", color: "bg-orange-100 text-orange-700" },
  checklist: { label: "チェック", color: "bg-green-100 text-green-700" },
  cta: { label: "CTA", color: "bg-pink-100 text-pink-700" },
  "point-card": { label: "ポイント", color: "bg-teal-100 text-teal-700" },
  "company-card": { label: "企業カード", color: "bg-indigo-100 text-indigo-700" },
  deadline: { label: "締切一覧", color: "bg-red-100 text-red-700" },
  "tab-checklist": { label: "タブ型", color: "bg-cyan-100 text-cyan-700" },
  qa: { label: "Q&A", color: "bg-amber-100 text-amber-700" },
  ranking: { label: "ランキング", color: "bg-emerald-100 text-emerald-700" },
};

export default function TestScriptPage() {
  const [step, setStep] = useState<"input" | "review" | "generating" | "done">("input");
  const [script, setScript] = useState(
    `転職成功の5つの秘訣を紹介します。

1. 自己分析を徹底する
まず自分の強みと弱みを把握しましょう。

2. 業界研究を欠かさない
志望業界のトレンドを常にチェック。

3. 職務経歴書を磨く
具体的な数字と成果を入れることがポイント。

4. 面接対策は万全に
よくある質問への回答を事前に準備。

5. エージェントを活用
プロのアドバイスで効率的に転職活動。

フォローして最新の転職情報をゲットしよう！`
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genIndex, setGenIndex] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [viewIndex, setViewIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/ai-script-analyze-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "分析失敗");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGenerate() {
    if (!analysis) return;
    setStep("generating");
    setGenerating(true);
    const newSlides: SlideData[] = [];

    for (let i = 0; i < analysis.slides.length; i++) {
      setGenIndex(i);
      const spec = analysis.slides[i];
      try {
        const res = await fetch("/api/ai-generate-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slideType: spec.slideType, title: spec.title }),
        });
        const result = await res.json();
        newSlides.push({
          id: crypto.randomUUID(),
          canvas: {
            elements: result.elements.map((el: Record<string, unknown>, j: number) => ({
              ...el,
              id: (el.id as string) || crypto.randomUUID(),
              rotation: (el.rotation as number) || 0,
              zIndex: (el.zIndex as number) || j + 1,
              opacity: (el.opacity as number) ?? 1,
            })) as CanvasElement[],
            background: {
              type: (result.background.type as "solid") || "solid",
              color: result.background.color as string,
            },
          },
        });
      } catch (e) {
        console.error(`Slide ${i + 1} failed:`, e);
      }
    }

    setSlides(newSlides);
    setViewIndex(0);
    setStep("done");
    setGenerating(false);
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📝 台本→自動生成 テスト（APIなし）</h1>

      {/* Step 1: Input */}
      {step === "input" && (
        <div className="max-w-xl space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">台本テキスト</label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={12}
              className="w-full border rounded-lg p-3 text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full bg-teal-500 text-white py-3 rounded-lg font-bold hover:bg-teal-600 disabled:opacity-50"
          >
            {analyzing ? "分析中..." : "✨ 台本を分析してカルーセル構成を提案"}
          </button>
        </div>
      )}

      {/* Step 2: Review */}
      {step === "review" && analysis && (
        <div className="max-w-xl space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold">📊 分析結果</p>
            <p className="text-sm text-gray-600 mt-1">{analysis.summary}</p>
            <p className="text-xs text-gray-400 mt-1">全{analysis.totalSlides}枚のカルーセル</p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-sm">カルーセル構成:</p>
            {analysis.slides.map((s, i) => {
              const t = slideTypeLabels[s.slideType] || { label: s.slideType, color: "bg-gray-100" };
              return (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">#{s.slideNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.color}`}>{t.label}</span>
                    <span className="text-sm font-bold">{s.title}</span>
                  </div>
                  {s.content && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.content}</p>}
                </div>
              );
            })}
          </div>

          {analysis.suggestedHashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {analysis.suggestedHashtags.map((tag, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep("input")} className="flex-1 border rounded-lg py-2 font-bold">
              戻る
            </button>
            <button
              onClick={handleGenerate}
              className="flex-1 bg-teal-500 text-white rounded-lg py-2 font-bold hover:bg-teal-600"
            >
              🚀 全スライドを自動生成
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generating */}
      {step === "generating" && analysis && (
        <div className="max-w-xl space-y-4">
          <p className="text-center font-bold text-lg">⏳ AIがスライドを生成中...</p>
          <p className="text-center text-sm text-gray-500">{genIndex + 1} / {analysis.totalSlides} 枚目</p>
          <div className="space-y-1">
            {analysis.slides.map((s, i) => {
              const t = slideTypeLabels[s.slideType] || { label: s.slideType, color: "bg-gray-100" };
              const done = i < genIndex;
              const current = i === genIndex;
              return (
                <div key={i} className={`flex items-center gap-2 p-2 rounded text-sm ${current ? "bg-teal-50 border border-teal-200" : done ? "bg-green-50" : "bg-gray-50"}`}>
                  {done ? "✅" : current ? "⏳" : "⬜"}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.color}`}>{t.label}</span>
                  <span className="flex-1 truncate">{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Done - View slides */}
      {step === "done" && slides.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <p className="font-bold text-lg">✅ 生成完了！ {slides.length}枚のスライド</p>
            <button onClick={() => { setStep("input"); setSlides([]); setAnalysis(null); }} className="text-sm text-teal-600 underline">
              最初からやり直す
            </button>
          </div>

          {/* Slide navigation */}
          <div className="flex gap-2 mb-4">
            {slides.map((_, i) => {
              const spec = analysis?.slides[i];
              const t = spec ? (slideTypeLabels[spec.slideType] || { label: spec.slideType, color: "bg-gray-100" }) : { label: `${i+1}`, color: "bg-gray-100" };
              return (
                <button
                  key={i}
                  onClick={() => { setViewIndex(i); setSelectedId(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${i === viewIndex ? "bg-teal-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  {i + 1}. {t.label}
                </button>
              );
            })}
          </div>

          {/* Canvas */}
          <div className="flex gap-4">
            <div style={{ width: 450, height: 450 }}>
              <CanvasEditor
                data={slides[viewIndex].canvas}
                onChange={(data) => {
                  setSlides(prev => prev.map((s, i) => i === viewIndex ? { ...s, canvas: data } : s));
                }}
                selectedElementId={selectedId}
                onSelectElement={setSelectedId}
              />
            </div>
            <div className="text-sm space-y-2">
              <p className="font-bold">{analysis?.slides[viewIndex]?.title}</p>
              <p className="text-xs text-gray-500">{analysis?.slides[viewIndex]?.description}</p>
              <p className="text-xs text-gray-400">要素数: {slides[viewIndex].canvas.elements.length}</p>
              <p className="text-xs text-gray-400">背景: {slides[viewIndex].canvas.background.color}</p>
            </div>
          </div>

          {/* Caption */}
          {analysis?.suggestedCaption && (
            <div className="mt-4 bg-gray-50 rounded-lg p-3 max-w-xl">
              <p className="text-xs font-bold text-gray-400 mb-1">提案キャプション:</p>
              <p className="text-sm whitespace-pre-line">{analysis.suggestedCaption}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
