"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ZapIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LayoutIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { type CanvasTemplate, getCategoryLabel } from "./TemplatePicker";

interface QuickPostModalProps {
  onGenerate: (
    slides: Array<{ elements: unknown[]; background: unknown }>
  ) => void;
}

interface TextFieldInfo {
  elementId: string;
  label: string;
  originalText: string;
  value: string;
}

interface ParsedCanvasData {
  elements: Array<{
    id: string;
    type: string;
    text?: string;
    fontSize?: number;
    [key: string]: unknown;
  }>;
  background: unknown;
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

function detectTextLabel(fontSize?: number): string {
  if (fontSize && fontSize > 48) return "タイトル";
  if (fontSize && fontSize > 32) return "小見出し";
  return "本文";
}

export default function QuickPostModal({ onGenerate }: QuickPostModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [templates, setTemplates] = useState<CanvasTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<CanvasTemplate | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCanvasData | null>(null);
  const [textFields, setTextFields] = useState<TextFieldInfo[]>([]);

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
      setStep(1);
      setSelectedTemplate(null);
      setParsedData(null);
      setTextFields([]);
    }
  }, [open, fetchTemplates]);

  const handleSelectTemplate = async (template: CanvasTemplate) => {
    try {
      const res = await fetch(`/api/canvas-templates/${template.id}`);
      if (!res.ok) return;
      const full = await res.json();
      const parsed: ParsedCanvasData = JSON.parse(full.canvasData);

      setSelectedTemplate(template);
      setParsedData(parsed);

      // Extract text elements for editing
      const fields: TextFieldInfo[] = parsed.elements
        .filter(
          (el) => el.type === "text" && el.text !== undefined
        )
        .map((el) => ({
          elementId: el.id,
          label: detectTextLabel(el.fontSize),
          originalText: el.text ?? "",
          value: el.text ?? "",
        }));

      setTextFields(fields);
      setStep(2);
    } catch (error) {
      console.error("Failed to load template:", error);
    }
  };

  const handleTextChange = (elementId: string, value: string) => {
    setTextFields((prev) =>
      prev.map((f) => (f.elementId === elementId ? { ...f, value } : f))
    );
  };

  const previewData = useMemo(() => {
    if (!parsedData) return null;
    const elements = parsedData.elements.map((el) => {
      const field = textFields.find((f) => f.elementId === el.id);
      if (field) {
        return { ...el, text: field.value };
      }
      return el;
    });
    return { elements, background: parsedData.background };
  }, [parsedData, textFields]);

  const handleGenerate = () => {
    if (!previewData) return;
    onGenerate([previewData]);
    setOpen(false);
  };

  const stepTitles: Record<number, string> = {
    1: "テンプレートを選択",
    2: "テキストを入力",
    3: "プレビュー",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <ZapIcon data-icon="inline-start" className="size-4" />
            テンプレから作成
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stepTitles[step]}</DialogTitle>
          <DialogDescription>
            {step === 1 && "テンプレートを選んでテキストを変えるだけで投稿を作成"}
            {step === 2 && "テンプレート内のテキストを編集してください"}
            {step === 3 && "内容を確認して生成してください"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 justify-center pb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step
                  ? "w-8 bg-primary"
                  : s < step
                    ? "w-6 bg-primary/40"
                    : "w-6 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Select template */}
        {step === 1 && (
          <div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                読み込み中...
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <LayoutIcon className="size-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  テンプレートがありません
                </p>
                <p className="text-xs mt-1">
                  まずキャンバスエディタでデザインを作成し、テンプレートとして保存してください
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    className="group relative rounded-lg border bg-card overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all text-left"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div
                      className="aspect-square w-full"
                      style={getBackgroundPreviewStyle(template.canvasData)}
                    />
                    <div className="p-2 space-y-1">
                      <p className="text-xs font-medium truncate">
                        {template.name}
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {getCategoryLabel(template.category)}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Edit text */}
        {step === 2 && (
          <div className="space-y-4">
            {textFields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                このテンプレートにはテキスト要素がありません。
                <br />
                そのまま生成に進めます。
              </div>
            ) : (
              <div className="space-y-3">
                {textFields.map((field) => (
                  <div key={field.elementId} className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5"
                      >
                        {field.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/60">
                        元: {field.originalText.slice(0, 30)}
                        {field.originalText.length > 30 ? "..." : ""}
                      </span>
                    </label>
                    <Input
                      value={field.value}
                      onChange={(
                        e: React.ChangeEvent<HTMLInputElement>
                      ) =>
                        handleTextChange(field.elementId, e.target.value)
                      }
                      placeholder={field.originalText || field.label}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && previewData && (
          <div className="space-y-4">
            {/* Simple preview showing background + text overlay */}
            <div className="mx-auto w-64 h-64 rounded-lg overflow-hidden border relative">
              <div
                className="absolute inset-0"
                style={
                  selectedTemplate
                    ? getBackgroundPreviewStyle(selectedTemplate.canvasData)
                    : {}
                }
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-2">
                {textFields.map((field) => (
                  <p
                    key={field.elementId}
                    className={`text-center font-bold drop-shadow-md ${
                      field.label === "タイトル"
                        ? "text-lg"
                        : field.label === "小見出し"
                          ? "text-sm"
                          : "text-xs"
                    }`}
                    style={{ color: "#fff" }}
                  >
                    {field.value || field.originalText}
                  </p>
                ))}
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              実際のレイアウトはキャンバスエディタで微調整できます
            </p>
          </div>
        )}

        {/* Navigation footer */}
        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {step > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                >
                  <ArrowLeftIcon
                    data-icon="inline-start"
                    className="size-4"
                  />
                  戻る
                </Button>
              )}
            </div>
            <div>
              {step === 2 && (
                <Button
                  size="sm"
                  onClick={() => setStep(3)}
                >
                  プレビュー
                  <ArrowRightIcon
                    data-icon="inline-end"
                    className="size-4"
                  />
                </Button>
              )}
              {step === 3 && (
                <Button
                  size="sm"
                  onClick={handleGenerate}
                >
                  <ZapIcon data-icon="inline-start" className="size-4" />
                  生成
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
