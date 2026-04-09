"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Lightbulb, RefreshCw } from "lucide-react";

interface IdeaSuggestion {
  title: string;
  description: string;
  category: string;
  hook: string;
}

const CATEGORIES = [
  { value: "all", label: "すべて" },
  { value: "面接対策", label: "面接対策" },
  { value: "ES・書類", label: "ES・書類" },
  { value: "業界研究", label: "業界研究" },
  { value: "就活準備", label: "就活準備" },
  { value: "メンタル", label: "メンタル" },
  { value: "マナー", label: "マナー" },
  { value: "転職", label: "転職" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "面接対策": "bg-blue-100 text-blue-700",
  "ES・書類": "bg-green-100 text-green-700",
  "業界研究": "bg-purple-100 text-purple-700",
  "就活準備": "bg-amber-100 text-amber-700",
  "メンタル": "bg-pink-100 text-pink-700",
  "マナー": "bg-teal-100 text-teal-700",
  "転職": "bg-orange-100 text-orange-700",
};

interface IdeaPickerModalProps {
  onSelectTheme: (theme: string) => void;
}

export default function IdeaPickerModal({ onSelectTheme }: IdeaPickerModalProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<IdeaSuggestion[]>([]);
  const [error, setError] = useState("");

  async function handleFetch() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scrape-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, count: 12 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "取得失敗");
      setIdeas(data.ideas || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(idea: IdeaSuggestion) {
    onSelectTheme(idea.title);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && ideas.length === 0 && !loading) handleFetch(); }}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600">
          <Lightbulb className="size-4" />
          ネタ提案
        </Button>
      } />
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>投稿ネタ提案</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                category === c.value
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c.label}
            </button>
          ))}
          <Button size="sm" variant="ghost" onClick={handleFetch} disabled={loading} className="ml-auto">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            再提案
          </Button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {loading && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Loader2 className="size-8 animate-spin mx-auto text-orange-500" />
              <p className="text-sm text-gray-500">ネタを考え中...</p>
            </div>
          </div>
        )}

        {!loading && ideas.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <p className="text-xs text-gray-400">{ideas.length}件のネタ — クリックでスライド自動生成</p>
            {ideas.filter((idea) => category === "all" || idea.category === category).map((idea, i) => (
              <div
                key={i}
                onClick={() => handleSelect(idea)}
                className="p-3 rounded-lg border hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition-all"
              >
                <div className="flex items-start gap-2">
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${CATEGORY_COLORS[idea.category] || "bg-gray-100 text-gray-600"}`}>
                    {idea.category}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{idea.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{idea.description}</p>
                    {idea.hook && (
                      <p className="text-xs text-orange-500 mt-1">🔥 {idea.hook}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
