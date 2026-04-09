"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Loader2, ArrowRight, Check, Sparkles } from "lucide-react";

interface SlideSpec {
  slideNumber: number;
  slideType: "cover" | "list" | "comparison" | "checklist" | "cta" | "point-card" | "company-card" | "deadline" | "tab-checklist" | "qa" | "ranking";
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

interface GeneratedSlide {
  elements: unknown[];
  background: { type: string; gradient?: string; color?: string };
  fromTemplate?: boolean;
  templateName?: string;
}

interface ScriptToPostModalProps {
  onGenerateAll: (slides: SlideSpec[], hashtags: string[], caption: string) => void;
  onGenerateAllWithResults?: (slides: GeneratedSlide[], hashtags: string[], caption: string) => void;
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

export default function ScriptToPostModal({ onGenerateAll, onGenerateAllWithResults }: ScriptToPostModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"input" | "review" | "generating">("input");
  const [script, setScript] = useState("");
  const [brandName, setBrandName] = useState("@your_account");
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!script.trim()) {
      setError("台本を入力してください");
      return;
    }
    setError("");
    setAnalyzing(true);

    try {
      const res = await fetch("/api/ai-script-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: script.trim(),
          brandName: brandName.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "分析に失敗しました");
      }

      const result: AnalysisResult = await res.json();
      setAnalysis(result);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析に失敗しました");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGenerateAll() {
    if (!analysis) return;
    setStep("generating");
    setGenerating(true);
    setGeneratingIndex(0);

    try {
      const generatedSlides: GeneratedSlide[] = [];

      for (let i = 0; i < analysis.slides.length; i++) {
        setGeneratingIndex(i);
        const slide = analysis.slides[i];

        // 1) テンプレートから注入を試みる
        let result: GeneratedSlide | null = null;
        try {
          const tplRes = await fetch("/api/template-inject", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slideType: slide.slideType,
              title: slide.title,
              content: slide.content || undefined,
              brandName: brandName.trim() || undefined,
            }),
          });
          if (tplRes.ok) {
            const tplData = await tplRes.json();
            if (!tplData.fallback && tplData.elements) {
              result = {
                elements: tplData.elements,
                background: tplData.background,
                fromTemplate: true,
                templateName: tplData.templateName,
              };
            }
          }
        } catch {
          // テンプレ注入失敗 → AI生成にフォールバック
        }

        // 2) テンプレなければAI生成
        if (!result) {
          const res = await fetch("/api/ai-generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slideType: slide.slideType,
              title: slide.title,
              content: slide.content || undefined,
              brandName: brandName.trim() || undefined,
              colorScheme: "ababa",
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(`スライド${i + 1}の生成に失敗: ${data.error}`);
          }
          const aiData = await res.json();
          result = {
            elements: aiData.elements,
            background: aiData.background,
            fromTemplate: false,
          };
        }

        generatedSlides.push(result);
      }

      // 結果を直接親に渡す（新しいコールバックがあれば使用）
      if (onGenerateAllWithResults) {
        onGenerateAllWithResults(
          generatedSlides,
          analysis.suggestedHashtags || [],
          analysis.suggestedCaption || ""
        );
      } else {
        onGenerateAll(
          analysis.slides,
          analysis.suggestedHashtags || [],
          analysis.suggestedCaption || ""
        );
      }
      setOpen(false);
      resetState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成に失敗しました");
      setStep("review");
    } finally {
      setGenerating(false);
    }
  }

  function resetState() {
    setStep("input");
    setScript("");
    setAnalysis(null);
    setError("");
    setGeneratingIndex(0);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 hover:from-teal-600 hover:to-emerald-600 hover:text-white">
            <FileText className="size-4" />
            台本から自動生成
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-teal-500" />
            台本からカルーセル投稿を自動生成
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 py-2">
          {[
            { key: "input", label: "台本入力" },
            { key: "review", label: "構成確認" },
            { key: "generating", label: "自動生成" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="size-3 text-gray-300" />}
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                step === s.key ? "bg-teal-100 text-teal-700 font-bold" : "text-gray-400"
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === s.key ? "bg-teal-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>{i + 1}</span>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Step 1: Script Input */}
        {step === "input" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="script-input">台本テキスト</Label>
              <Textarea
                id="script-input"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={10}
                placeholder={`例:
転職成功の5つの秘訣を紹介します。

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

フォローして最新の転職情報をゲットしよう！`}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                投稿したい内容をテキストで入力してください。AIが最適なカルーセル構成を提案します。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="script-brand">アカウント名</Label>
              <Input
                id="script-brand"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="@your_account"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !script.trim()}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
            >
              {analyzing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  AIが台本を分析中...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  台本を分析してカルーセル構成を提案
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Review Analysis */}
        {step === "review" && analysis && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium">分析結果</p>
              <p className="text-sm text-muted-foreground mt-1">{analysis.summary}</p>
              <p className="text-xs text-muted-foreground mt-1">全{analysis.totalSlides}枚のカルーセル</p>
            </div>

            {/* Slides preview */}
            <div className="space-y-2">
              <Label>カルーセル構成</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {analysis.slides.map((slide, i) => {
                  const typeInfo = slideTypeLabels[slide.slideType] || { label: slide.slideType, color: "bg-gray-100" };
                  return (
                    <div key={i} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">#{slide.slideNumber}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className="text-sm font-bold flex-1 truncate">{slide.title}</span>
                      </div>
                      {slide.content && (
                        <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">
                          {slide.content}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 italic">{slide.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hashtags */}
            {analysis.suggestedHashtags?.length > 0 && (
              <div className="space-y-1">
                <Label>提案ハッシュタグ</Label>
                <div className="flex flex-wrap gap-1">
                  {analysis.suggestedHashtags.map((tag, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("input")} className="flex-1">
                台本を修正
              </Button>
              <Button
                onClick={handleGenerateAll}
                disabled={generating}
                className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
              >
                <Sparkles className="size-4" />
                全スライドを自動生成
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === "generating" && analysis && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <Loader2 className="size-8 animate-spin text-teal-500 mx-auto mb-3" />
              <p className="font-bold">AIがスライドを生成中...</p>
              <p className="text-sm text-muted-foreground mt-1">
                {generatingIndex + 1} / {analysis.totalSlides} 枚目を生成中
              </p>
            </div>

            <div className="space-y-1.5">
              {analysis.slides.map((slide, i) => {
                const typeInfo = slideTypeLabels[slide.slideType] || { label: slide.slideType, color: "bg-gray-100" };
                const isDone = i < generatingIndex;
                const isCurrent = i === generatingIndex;
                return (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                    isCurrent ? "bg-teal-50 border border-teal-200" : isDone ? "bg-green-50" : "bg-gray-50"
                  }`}>
                    {isDone ? (
                      <Check className="size-4 text-green-500" />
                    ) : isCurrent ? (
                      <Loader2 className="size-4 animate-spin text-teal-500" />
                    ) : (
                      <div className="size-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <span className={`flex-1 truncate ${isDone ? "text-green-700" : isCurrent ? "text-teal-700 font-medium" : "text-gray-400"}`}>
                      {slide.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
