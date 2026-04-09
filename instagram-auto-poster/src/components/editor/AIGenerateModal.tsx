"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";

interface AIGenerateModalProps {
  onGenerate: (result: {
    elements: unknown[];
    background: { type: string; gradient?: string; color?: string };
  }) => void;
}

const slideTypes = [
  { value: "cover", label: "表紙", desc: "タイトルとキャッチコピー" },
  { value: "list", label: "リスト", desc: "番号付きリスト形式" },
  { value: "comparison", label: "比較", desc: "2カラム比較型" },
  { value: "checklist", label: "チェック", desc: "チェックリスト型" },
  { value: "cta", label: "CTA", desc: "フォロー誘導スライド" },
  { value: "point-card", label: "ポイント", desc: "ポイント解説型" },
  { value: "company-card", label: "企業カード", desc: "企業情報カード型" },
  { value: "deadline", label: "締切一覧", desc: "締切日別企業リスト" },
  { value: "tab-checklist", label: "タブ型", desc: "タブ+チェックリスト" },
  { value: "qa", label: "Q&A", desc: "質問と対策一覧" },
  { value: "ranking", label: "ランキング", desc: "企業ランキング型" },
] as const;

const colorSchemes = [
  { value: "ababa", label: "ABABA風", color: "#38BDF8" },
  { value: "purple", label: "パープル", color: "#6C5CE7" },
  { value: "blue", label: "ブルー", color: "#0984E3" },
  { value: "orange", label: "オレンジ", color: "#E17055" },
  { value: "dark", label: "ダーク", color: "#2D3436" },
  { value: "green", label: "グリーン", color: "#00B894" },
] as const;

export default function AIGenerateModal({ onGenerate }: AIGenerateModalProps) {
  const [open, setOpen] = useState(false);
  const [slideType, setSlideType] = useState<string>("cover");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [brandName, setBrandName] = useState("@your_account");
  const [colorScheme, setColorScheme] = useState<string>("ababa");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slideType,
          title: title.trim(),
          content: content.trim() || undefined,
          brandName: brandName.trim() || undefined,
          colorScheme,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "生成に失敗しました");
      }

      const result = await res.json();
      onGenerate({
        elements: result.elements,
        background: result.background,
      });
      setOpen(false);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600 hover:text-white">
            <Sparkles className="size-4" />
            AI自動生成
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-purple-500" />
            AIでスライドを自動生成
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Slide Type */}
          <div className="space-y-2">
            <Label>スライドタイプ</Label>
            <div className="grid grid-cols-3 gap-2">
              {slideTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSlideType(type.value)}
                  className={`rounded-lg border-2 p-3 text-left transition-all ${
                    slideType === type.value
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {type.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="ai-title">
              {slideType === "cta" ? "CTAテキスト" : "タイトル"}
            </Label>
            <Input
              id="ai-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                slideType === "cover"
                  ? "例: 転職成功の5つの秘訣"
                  : slideType === "list"
                  ? "例: 面接で聞かれるTOP5"
                  : "例: フォローで最新情報をGET!"
              }
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="ai-content">
              {slideType === "list"
                ? "リスト項目（1行ずつ）"
                : slideType === "cover"
                ? "サブタイトル（任意）"
                : "補足テキスト（任意）"}
            </Label>
            <Textarea
              id="ai-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={slideType === "list" ? 5 : 2}
              placeholder={
                slideType === "list"
                  ? "自己分析を徹底する\n業界研究を欠かさない\n職務経歴書を磨く\n面接対策は万全に\nエージェントを活用"
                  : "知らないと損する転職テクニック"
              }
            />
          </div>

          {/* Brand Name */}
          <div className="space-y-2">
            <Label htmlFor="ai-brand">アカウント名</Label>
            <Input
              id="ai-brand"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="@your_account"
            />
          </div>

          {/* Color Scheme */}
          <div className="space-y-2">
            <Label>カラースキーム</Label>
            <div className="flex gap-2">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme.value}
                  type="button"
                  onClick={() => setColorScheme(scheme.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                    colorScheme === scheme.value
                      ? "border-purple-500"
                      : "border-transparent hover:border-gray-200"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: scheme.color }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {scheme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !title.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                AIが生成中...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                レイアウトを自動生成
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
