"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CanvasEditor, {
  type SlideCanvasData,
  type CanvasElement,
} from "@/components/editor/CanvasEditor";
import EditorToolbar from "@/components/editor/EditorToolbar";
import AIGenerateModal from "@/components/editor/AIGenerateModal";
import TemplatePicker from "@/components/editor/TemplatePicker";
import QuickPostModal from "@/components/editor/QuickPostModal";
import ElementPanel from "@/components/editor/ElementPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  Send,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";

interface SlideData {
  id: string;
  canvas: SlideCanvasData;
}

function createDefaultSlide(): SlideData {
  return {
    id: crypto.randomUUID(),
    canvas: {
      elements: [],
      background: {
        type: "gradient",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      },
    },
  };
}

export default function NewPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [slides, setSlides] = useState<SlideData[]>([createDefaultSlide()]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [showMetaPanel, setShowMetaPanel] = useState(false);

  const currentSlide = slides[currentSlideIndex];

  const handleCanvasChange = useCallback(
    (data: SlideCanvasData) => {
      setSlides((prev) =>
        prev.map((s, i) => (i === currentSlideIndex ? { ...s, canvas: data } : s))
      );
    },
    [currentSlideIndex]
  );

  const handleAddElement = useCallback(
    (partial: Partial<CanvasElement>) => {
      const newElement: CanvasElement = {
        id: crypto.randomUUID(),
        type: "text",
        x: 340,
        y: 400,
        width: 400,
        height: 100,
        rotation: 0,
        zIndex: currentSlide.canvas.elements.length + 1,
        opacity: 1,
        ...partial,
      };
      const newData = {
        ...currentSlide.canvas,
        elements: [...currentSlide.canvas.elements, newElement],
      };
      handleCanvasChange(newData);
      setSelectedElementId(newElement.id);
    },
    [currentSlide, handleCanvasChange]
  );

  const handleUpdateElement = useCallback(
    (updates: Record<string, unknown>) => {
      if (!selectedElementId) return;
      const newElements = currentSlide.canvas.elements.map((el) =>
        el.id === selectedElementId ? { ...el, ...updates } : el
      );
      handleCanvasChange({ ...currentSlide.canvas, elements: newElements });
    },
    [selectedElementId, currentSlide, handleCanvasChange]
  );

  const handleDeleteElement = useCallback(() => {
    if (!selectedElementId) return;
    const newElements = currentSlide.canvas.elements.filter(
      (el) => el.id !== selectedElementId
    );
    handleCanvasChange({ ...currentSlide.canvas, elements: newElements });
    setSelectedElementId(null);
  }, [selectedElementId, currentSlide, handleCanvasChange]);

  const handleDuplicateElement = useCallback(() => {
    if (!selectedElementId) return;
    const el = currentSlide.canvas.elements.find(
      (e) => e.id === selectedElementId
    );
    if (!el) return;
    const newEl = {
      ...el,
      id: crypto.randomUUID(),
      x: el.x + 20,
      y: el.y + 20,
      zIndex: currentSlide.canvas.elements.length + 1,
    };
    handleCanvasChange({
      ...currentSlide.canvas,
      elements: [...currentSlide.canvas.elements, newEl],
    });
    setSelectedElementId(newEl.id);
  }, [selectedElementId, currentSlide, handleCanvasChange]);

  const handleBringForward = useCallback(() => {
    if (!selectedElementId) return;
    const maxZ = Math.max(
      ...currentSlide.canvas.elements.map((e) => e.zIndex)
    );
    handleUpdateElement({ zIndex: maxZ + 1 });
  }, [selectedElementId, currentSlide, handleUpdateElement]);

  const handleSendBackward = useCallback(() => {
    if (!selectedElementId) return;
    const minZ = Math.min(
      ...currentSlide.canvas.elements.map((e) => e.zIndex)
    );
    handleUpdateElement({ zIndex: Math.max(0, minZ - 1) });
  }, [selectedElementId, currentSlide, handleUpdateElement]);

  const handleBackgroundChange = useCallback(
    (bg: SlideCanvasData["background"]) => {
      handleCanvasChange({ ...currentSlide.canvas, background: bg });
    },
    [currentSlide, handleCanvasChange]
  );

  const handleAIGenerate = useCallback(
    (result: { elements: unknown[]; background: { type: string; gradient?: string; color?: string } }) => {
      const newData: SlideCanvasData = {
        elements: (result.elements as CanvasElement[]).map((el, i) => ({
          ...el,
          id: el.id || crypto.randomUUID(),
          rotation: el.rotation || 0,
          zIndex: el.zIndex || i + 1,
          opacity: el.opacity ?? 1,
        })),
        background: {
          type: (result.background.type as "solid" | "gradient" | "image") || "gradient",
          gradient: result.background.gradient,
          color: result.background.color,
        },
      };
      handleCanvasChange(newData);
      setSelectedElementId(null);
    },
    [handleCanvasChange]
  );

  const handleApplyTemplate = useCallback(
    (canvasData: { elements: unknown[]; background: unknown }) => {
      const bg = canvasData.background as SlideCanvasData["background"];
      const newData: SlideCanvasData = {
        elements: (canvasData.elements as CanvasElement[]).map((el, i) => ({
          ...el,
          id: el.id || crypto.randomUUID(),
          rotation: el.rotation || 0,
          zIndex: el.zIndex || i + 1,
          opacity: el.opacity ?? 1,
        })),
        background: bg || { type: "gradient", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
      };
      handleCanvasChange(newData);
      setSelectedElementId(null);
    },
    [handleCanvasChange]
  );

  const handleSaveAsTemplate = useCallback(async () => {
    // This is handled inside TemplatePicker via the current canvas data
  }, []);

  const handleQuickGenerate = useCallback(
    (generatedSlides: Array<{ elements: unknown[]; background: unknown }>) => {
      const newSlides = generatedSlides.map((s, i) => ({
        id: crypto.randomUUID(),
        canvas: {
          elements: (s.elements as CanvasElement[]).map((el, j) => ({
            ...el,
            id: el.id || crypto.randomUUID(),
            rotation: el.rotation || 0,
            zIndex: el.zIndex || j + 1,
            opacity: el.opacity ?? 1,
          })),
          background: (s.background as SlideCanvasData["background"]) || {
            type: "gradient" as const,
            gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          },
        },
      }));
      if (newSlides.length > 0) {
        setSlides(newSlides);
        setCurrentSlideIndex(0);
        setSelectedElementId(null);
      }
    },
    []
  );

  const selectedElement = selectedElementId
    ? currentSlide.canvas.elements.find((e) => e.id === selectedElementId) || null
    : null;

  function addSlide() {
    const newSlide = createDefaultSlide();
    setSlides((prev) => [...prev, newSlide]);
    setCurrentSlideIndex(slides.length);
    setSelectedElementId(null);
  }

  function removeSlide(index: number) {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== index));
    if (currentSlideIndex >= slides.length - 1) {
      setCurrentSlideIndex(Math.max(0, slides.length - 2));
    }
    setSelectedElementId(null);
  }

  function getFormData() {
    return {
      title,
      caption,
      hashtags,
      slides: slides.map((s, i) => ({
        slideOrder: i,
        templateType: "canvas",
        content: JSON.stringify(s.canvas),
      })),
    };
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getFormData()),
      });
      if (!res.ok) throw new Error("保存に失敗しました");
      const post = await res.json();
      toast.success("投稿を保存しました");
      router.push(`/posts/${post.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getFormData()),
      });
      if (!res.ok) throw new Error("保存に失敗しました");
      const post = await res.json();
      const pubRes = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      if (!pubRes.ok) throw new Error("公開に失敗しました");
      toast.success("投稿を公開しました");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "公開に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    try {
      toast.info("画像を生成中...");
      const res = await fetch("/api/generate/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: slides.map((s) => s.canvas) }),
      });
      if (!res.ok) throw new Error("画像生成に失敗しました");
      const { images } = await res.json();
      for (const img of images) {
        const byteString = atob(img.base64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: "image/png" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `slide-${img.slideOrder + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      toast.success("画像をダウンロードしました");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "画像生成に失敗しました"
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
          >
            <ChevronLeft className="size-4" />
            戻る
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="投稿タイトル"
            className="w-[200px] text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <QuickPostModal onGenerate={handleQuickGenerate} />
          <AIGenerateModal onGenerate={handleAIGenerate} />
          <TemplatePicker
            onApplyTemplate={handleApplyTemplate}
            onSaveAsTemplate={handleSaveAsTemplate}
            currentCanvasData={currentSlide.canvas}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMetaPanel(!showMetaPanel)}
          >
            {showMetaPanel ? "エディターに戻る" : "キャプション編集"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="size-4" />
            DL
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="size-4" />
            保存
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handlePublish}
            disabled={saving}
          >
            <Send className="size-4" />
            公開
          </Button>
        </div>
      </div>

      {/* Editor Toolbar */}
      <EditorToolbar
        selectedElement={selectedElement}
        onUpdateElement={handleUpdateElement}
        onDeleteElement={handleDeleteElement}
        onDuplicateElement={handleDuplicateElement}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
      />

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <ElementPanel
          onAddElement={handleAddElement}
          background={currentSlide.canvas.background}
          onBackgroundChange={handleBackgroundChange}
        />

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col bg-gray-100 overflow-auto">
          {showMetaPanel ? (
            <div className="max-w-2xl mx-auto p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">キャプション</label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="投稿のキャプションを入力..."
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  {caption.length} / 2,200文字
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ハッシュタグ</label>
                <Textarea
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#転職 #キャリア #仕事術"
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <CanvasEditor
                data={currentSlide.canvas}
                onChange={handleCanvasChange}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
              />
            </div>
          )}

          {/* Slide Strip */}
          <div className="border-t bg-white p-3 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => {
                    setCurrentSlideIndex(index);
                    setSelectedElementId(null);
                  }}
                  className={`relative shrink-0 w-[80px] h-[80px] rounded border-2 transition-all ${
                    index === currentSlideIndex
                      ? "border-blue-500 shadow-md"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {/* Mini preview */}
                  <div
                    className="w-full h-full rounded overflow-hidden"
                    style={{
                      background:
                        slide.canvas.background.type === "gradient"
                          ? slide.canvas.background.gradient
                          : slide.canvas.background.type === "image"
                          ? `url(${slide.canvas.background.imageUrl}) center/cover`
                          : slide.canvas.background.color || "#ffffff",
                    }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <span className="text-[10px] font-bold text-white drop-shadow-md">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  {slides.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSlide(index);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] hover:bg-red-600"
                    >
                      <Trash2 className="size-2.5" />
                    </button>
                  )}
                </button>
              ))}
              <button
                onClick={addSlide}
                className="shrink-0 w-[80px] h-[80px] rounded border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                <Plus className="size-5 text-gray-400" />
              </button>
              {slides.length > 1 && (
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
                    }
                    disabled={currentSlideIndex === 0}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground min-w-[40px] text-center">
                    {currentSlideIndex + 1}/{slides.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setCurrentSlideIndex(
                        Math.min(slides.length - 1, currentSlideIndex + 1)
                      )
                    }
                    disabled={currentSlideIndex === slides.length - 1}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
