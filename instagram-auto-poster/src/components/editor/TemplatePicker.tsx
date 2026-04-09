"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LayoutIcon, Trash2Icon, PlusIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CanvasTemplate {
  id: number;
  name: string;
  category: string;
  slideType: string | null;
  slotMap: string | null;
  thumbnail: string | null;
  canvasData: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplatePickerProps {
  onApplyTemplate: (canvasData: {
    elements: unknown[];
    background: unknown;
  }) => void;
  onSaveAsTemplate: () => void;
  currentCanvasData?: {
    elements: unknown[];
    background: unknown;
  };
}

const CATEGORIES = [
  { value: "cover", label: "表紙" },
  { value: "list", label: "リスト" },
  { value: "cta", label: "CTA" },
  { value: "general", label: "汎用" },
];

const SLIDE_TYPES = [
  { value: "", label: "なし（手動選択）" },
  { value: "cover", label: "表紙" },
  { value: "list", label: "リスト" },
  { value: "comparison", label: "比較" },
  { value: "checklist", label: "チェックリスト" },
  { value: "cta", label: "CTA" },
  { value: "point-card", label: "ポイントカード" },
  { value: "company-card", label: "企業カード" },
  { value: "deadline", label: "締切一覧" },
  { value: "tab-checklist", label: "タブ型チェック" },
  { value: "qa", label: "Q&A" },
  { value: "ranking", label: "ランキング" },
];

function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function getBackgroundPreviewStyle(
  canvasData: string
): React.CSSProperties {
  try {
    const parsed = JSON.parse(canvasData);
    const bg = parsed.background;
    if (!bg) return { backgroundColor: "#e5e7eb" };
    if (bg.type === "gradient" && bg.gradient)
      return { background: bg.gradient };
    if (bg.type === "image" && bg.imageUrl)
      return {
        backgroundImage: `url(${bg.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    return { backgroundColor: bg.color ?? "#e5e7eb" };
  } catch {
    return { backgroundColor: "#e5e7eb" };
  }
}

export default function TemplatePicker({
  onApplyTemplate,
  onSaveAsTemplate,
  currentCanvasData,
}: TemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<CanvasTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveCategory, setSaveCategory] = useState("general");
  const [saveSlideType, setSaveSlideType] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/canvas-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, fetchTemplates]);

  const handleApply = async (template: CanvasTemplate) => {
    try {
      const res = await fetch(`/api/canvas-templates/${template.id}`);
      if (!res.ok) return;
      const full = await res.json();
      const parsed = JSON.parse(full.canvasData);
      onApplyTemplate(parsed);
      setOpen(false);
    } catch (error) {
      console.error("Failed to apply template:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/canvas-templates/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  const handleSaveCurrentDesign = () => {
    setShowSaveForm(true);
  };

  const handleSaveSubmit = async () => {
    if (!saveName.trim() || !currentCanvasData) return;
    setSaving(true);
    try {
      const res = await fetch("/api/canvas-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveName.trim(),
          category: saveCategory,
          slideType: saveSlideType || undefined,
          canvasData: JSON.stringify(currentCanvasData),
        }),
      });
      if (!res.ok) throw new Error("Failed to save template");
      onSaveAsTemplate();
      setShowSaveForm(false);
      setSaveName("");
      setSaveCategory("general");
      setSaveSlideType("");
      await fetchTemplates();
    } catch (error) {
      console.error("Failed to save template:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <LayoutIcon data-icon="inline-start" className="size-4" />
            テンプレート
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>キャンバステンプレート</DialogTitle>
          <DialogDescription>
            保存したテンプレートを選択して適用、または現在のデザインをテンプレートとして保存
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Save current design */}
          {!showSaveForm ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSaveCurrentDesign}
            >
              <PlusIcon data-icon="inline-start" className="size-4" />
              現在のデザインをテンプレートとして保存
            </Button>
          ) : (
            <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <SaveIcon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  テンプレートとして保存
                </span>
              </div>
              <Input
                placeholder="テンプレート名"
                value={saveName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSaveName(e.target.value)
                }
              />
              <Select
                value={saveCategory}
                onValueChange={(val: string | null) => setSaveCategory(val ?? "general")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  スライドタイプ（台本自動生成で使用）
                </label>
                <Select
                  value={saveSlideType}
                  onValueChange={(val: string | null) => setSaveSlideType(val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="スライドタイプを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {SLIDE_TYPES.map((st) => (
                      <SelectItem key={st.value || "_none"} value={st.value || "_none"}>
                        {st.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSaveForm(false)}
                >
                  キャンセル
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveSubmit}
                  disabled={!saveName.trim() || saving}
                >
                  保存
                </Button>
              </div>
            </div>
          )}

          {/* Template grid */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              読み込み中...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <LayoutIcon className="size-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">保存されたテンプレートはありません</p>
              <p className="text-xs mt-1">
                キャンバスエディタでデザインを作成し、テンプレートとして保存してください
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="group relative rounded-lg border bg-card overflow-hidden hover:ring-2 hover:ring-primary/30 transition-all"
                >
                  {/* Preview */}
                  <div
                    className="aspect-square w-full"
                    style={getBackgroundPreviewStyle(template.canvasData)}
                  />

                  {/* Info */}
                  <div className="p-2 space-y-1.5">
                    <p className="text-xs font-medium truncate">
                      {template.name}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex gap-1 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">
                          {getCategoryLabel(template.category)}
                        </Badge>
                        {template.slideType && (
                          <Badge className="text-[10px] bg-teal-500">
                            {template.slideType}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="xs"
                        onClick={() => handleApply(template)}
                      >
                        適用
                      </Button>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    className="absolute top-1 right-1 p-1 rounded-md bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id);
                    }}
                  >
                    <Trash2Icon className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { CATEGORIES, getCategoryLabel };
export type { CanvasTemplate };
