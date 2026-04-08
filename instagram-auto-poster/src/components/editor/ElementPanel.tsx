"use client";

import { useState, useCallback, useRef } from "react";
import {
  Type,
  Square,
  Circle,
  Minus,
  Star,
  ChevronDown,
  Palette,
  Layout,
  Plus,
  ArrowRight,
  Hash,
  Sparkles,
  Image,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CanvasElement {
  id: string;
  type: "text" | "shape" | "icon" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  shapeType?: "rect" | "circle" | "rounded-rect" | "line";
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  imageUrl?: string;
  objectFit?: "cover" | "contain" | "fill";
}

interface ElementPanelProps {
  onAddElement: (element: Partial<CanvasElement>) => void;
  background: {
    type: "solid" | "gradient" | "image";
    color?: string;
    gradient?: string;
    imageUrl?: string;
  };
  onBackgroundChange: (bg: {
    type: "solid" | "gradient" | "image";
    color?: string;
    gradient?: string;
    imageUrl?: string;
  }) => void;
}

const PRESET_GRADIENTS = [
  {
    name: "Purple to Pink",
    value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    name: "Blue to Teal",
    value: "linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)",
  },
  {
    name: "Orange to Red",
    value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    name: "Dark",
    value: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)",
  },
  {
    name: "Green",
    value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  },
  {
    name: "Warm",
    value: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  },
];

function SectionHeader({
  icon: Icon,
  label,
  isOpen,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between w-full px-3 py-2 text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
    >
      <span className="flex items-center gap-2">
        <Icon className="size-4" />
        {label}
      </span>
      <ChevronDown
        className={`size-4 text-muted-foreground transition-transform ${
          isOpen ? "" : "-rotate-90"
        }`}
      />
    </button>
  );
}

export default function ElementPanel({
  onAddElement,
  background,
  onBackgroundChange,
}: ElementPanelProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    text: true,
    shapes: true,
    images: true,
    decorations: false,
    background: true,
    templates: false,
  });

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    async (file: File, mode: "element" | "background") => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        const url: string = data.url;

        if (mode === "element") {
          setUploadedImages((prev) => [url, ...prev]);
          onAddElement({
            type: "image",
            imageUrl: url,
            width: 400,
            height: 400,
            x: 340,
            y: 340,
            rotation: 0,
            opacity: 1,
          });
        } else {
          onBackgroundChange({ type: "image", imageUrl: url });
        }
      } catch (err) {
        console.error("Image upload error:", err);
      } finally {
        setIsUploading(false);
      }
    },
    [onAddElement, onBackgroundChange]
  );

  const addTextElement = useCallback(
    (
      fontSize: number,
      fontWeight: string,
      width: number,
      text: string
    ) => {
      onAddElement({
        type: "text",
        x: 540 - width / 2,
        y: 400,
        width,
        height: fontSize * 1.5,
        rotation: 0,
        text,
        fontSize,
        fontFamily: "Noto Sans JP",
        fontWeight,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.4,
        opacity: 100,
      });
    },
    [onAddElement]
  );

  const addShapeElement = useCallback(
    (
      shapeType: "rect" | "circle" | "rounded-rect" | "line",
      width: number,
      height: number,
      bg: string,
      borderRadius?: number
    ) => {
      onAddElement({
        type: "shape",
        x: 540 - width / 2,
        y: 540 - height / 2,
        width,
        height,
        rotation: 0,
        shapeType,
        backgroundColor: bg,
        borderColor: "transparent",
        borderWidth: 0,
        borderRadius: borderRadius ?? 0,
        opacity: 100,
      });
    },
    [onAddElement]
  );

  return (
    <div className="w-60 h-full bg-gray-50 border-r overflow-y-auto flex-shrink-0">
      {/* Text Section */}
      <SectionHeader
        icon={Type}
        label="テキスト"
        isOpen={openSections.text}
        onToggle={() => toggleSection("text")}
      />
      {openSections.text && (
        <div className="px-3 pb-3 space-y-2">
          <button
            type="button"
            onClick={() => addTextElement(64, "bold", 800, "見出しテキスト")}
            className="w-full p-3 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all text-left"
          >
            <div className="text-lg font-bold truncate">見出しを追加</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              64px / 太字
            </div>
          </button>
          <button
            type="button"
            onClick={() =>
              addTextElement(40, "bold", 700, "小見出しテキスト")
            }
            className="w-full p-3 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all text-left"
          >
            <div className="text-base font-bold truncate">小見出しを追加</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              40px / 太字
            </div>
          </button>
          <button
            type="button"
            onClick={() =>
              addTextElement(28, "normal", 600, "本文テキスト")
            }
            className="w-full p-3 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all text-left"
          >
            <div className="text-sm truncate">本文を追加</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              28px / 標準
            </div>
          </button>
        </div>
      )}

      {/* Shapes Section */}
      <SectionHeader
        icon={Square}
        label="図形"
        isOpen={openSections.shapes}
        onToggle={() => toggleSection("shapes")}
      />
      {openSections.shapes && (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => addShapeElement("rect", 300, 200, "#6366f1")}
              className="flex items-center justify-center p-2 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all aspect-square"
              title="四角形"
            >
              <div className="w-8 h-6 rounded-sm bg-indigo-500" />
            </button>
            <button
              type="button"
              onClick={() =>
                addShapeElement("circle", 200, 200, "#ec4899", 9999)
              }
              className="flex items-center justify-center p-2 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all aspect-square"
              title="円"
            >
              <div className="w-7 h-7 rounded-full bg-pink-500" />
            </button>
            <button
              type="button"
              onClick={() =>
                addShapeElement("rounded-rect", 300, 200, "#f59e0b", 20)
              }
              className="flex items-center justify-center p-2 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all aspect-square"
              title="角丸四角形"
            >
              <div className="w-8 h-6 rounded-md bg-amber-500" />
            </button>
            <button
              type="button"
              onClick={() => addShapeElement("line", 400, 4, "#1e293b")}
              className="flex items-center justify-center p-2 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all aspect-square"
              title="線"
            >
              <div className="w-8 h-0.5 bg-slate-800" />
            </button>
          </div>
        </div>
      )}

      {/* Images Section */}
      <SectionHeader
        icon={Image}
        label="画像 (Images)"
        isOpen={openSections.images}
        onToggle={() => toggleSection("images")}
      />
      {openSections.images && (
        <div className="px-3 pb-3 space-y-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, "element");
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-dashed border-border hover:border-primary/50 hover:shadow-sm transition-all text-sm text-muted-foreground disabled:opacity-50"
          >
            <Upload className="size-4" />
            {isUploading ? "アップロード中..." : "画像をアップロード"}
          </button>
          {uploadedImages.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                アップロード済み
              </label>
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    onClick={() =>
                      onAddElement({
                        type: "image",
                        imageUrl: url,
                        width: 400,
                        height: 400,
                        x: 340,
                        y: 340,
                        rotation: 0,
                        opacity: 1,
                      })
                    }
                    className="aspect-square rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all overflow-hidden"
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decorations Section */}
      <SectionHeader
        icon={Sparkles}
        label="装飾"
        isOpen={openSections.decorations}
        onToggle={() => toggleSection("decorations")}
      />
      {openSections.decorations && (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onAddElement({
                  type: "shape",
                  x: 440,
                  y: 440,
                  width: 80,
                  height: 80,
                  rotation: 0,
                  shapeType: "circle",
                  backgroundColor: "#6366f1",
                  borderRadius: 9999,
                  opacity: 100,
                });
                onAddElement({
                  type: "text",
                  x: 440,
                  y: 450,
                  width: 80,
                  height: 60,
                  rotation: 0,
                  text: "1",
                  fontSize: 36,
                  fontFamily: "Inter",
                  fontWeight: "bold",
                  color: "#ffffff",
                  textAlign: "center",
                  opacity: 100,
                });
              }}
              className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all"
              title="数字バッジ"
            >
              <Hash className="size-4 text-muted-foreground" />
              <span className="text-xs">数字バッジ</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAddElement({
                  type: "shape",
                  x: 440,
                  y: 500,
                  width: 200,
                  height: 60,
                  rotation: 0,
                  shapeType: "rounded-rect",
                  backgroundColor: "#6366f1",
                  borderRadius: 30,
                  opacity: 100,
                });
                onAddElement({
                  type: "text",
                  x: 450,
                  y: 510,
                  width: 180,
                  height: 40,
                  rotation: 0,
                  text: "→",
                  fontSize: 32,
                  fontFamily: "Inter",
                  fontWeight: "bold",
                  color: "#ffffff",
                  textAlign: "center",
                  opacity: 100,
                });
              }}
              className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all"
              title="矢印アイコン"
            >
              <ArrowRight className="size-4 text-muted-foreground" />
              <span className="text-xs">矢印</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAddElement({
                  type: "text",
                  x: 440,
                  y: 440,
                  width: 80,
                  height: 80,
                  rotation: 0,
                  text: "★",
                  fontSize: 60,
                  fontFamily: "Inter",
                  fontWeight: "normal",
                  color: "#f59e0b",
                  textAlign: "center",
                  opacity: 100,
                });
              }}
              className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all"
              title="星"
            >
              <Star className="size-4 text-muted-foreground" />
              <span className="text-xs">星</span>
            </button>
            <button
              type="button"
              onClick={() => {
                addShapeElement("line", 800, 2, "#ffffff80");
              }}
              className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all"
              title="区切り線"
            >
              <Minus className="size-4 text-muted-foreground" />
              <span className="text-xs">区切り線</span>
            </button>
          </div>
        </div>
      )}

      {/* Background Section */}
      <SectionHeader
        icon={Palette}
        label="背景"
        isOpen={openSections.background}
        onToggle={() => toggleSection("background")}
      />
      {openSections.background && (
        <div className="px-3 pb-3 space-y-3">
          {/* Solid color */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              単色
            </label>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-border flex-shrink-0"
                style={{
                  backgroundColor:
                    background.type === "solid"
                      ? background.color ?? "#1e293b"
                      : "#1e293b",
                }}
              />
              <input
                type="color"
                value={
                  background.type === "solid"
                    ? background.color ?? "#1e293b"
                    : "#1e293b"
                }
                onChange={(e) =>
                  onBackgroundChange({
                    type: "solid",
                    color: e.target.value,
                  })
                }
                className="w-full h-8 rounded-md cursor-pointer border-0 bg-transparent"
              />
            </div>
          </div>

          {/* Gradient presets */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              グラデーション
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_GRADIENTS.map((gradient) => (
                <button
                  key={gradient.name}
                  type="button"
                  onClick={() =>
                    onBackgroundChange({
                      type: "gradient",
                      gradient: gradient.value,
                    })
                  }
                  className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                    background.type === "gradient" &&
                    background.gradient === gradient.value
                      ? "border-ring ring-2 ring-ring/30 scale-105"
                      : "border-transparent hover:border-border"
                  }`}
                  style={{ background: gradient.value }}
                  title={gradient.name}
                />
              ))}
            </div>
          </div>

          {/* Background image */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              背景画像
            </label>
            <input
              ref={bgImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "background");
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => bgImageInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 p-2.5 bg-white rounded-lg border border-dashed border-border hover:border-primary/50 hover:shadow-sm transition-all text-xs text-muted-foreground disabled:opacity-50"
            >
              <Upload className="size-3.5" />
              {isUploading ? "アップロード中..." : "背景画像をアップロード"}
            </button>
            {background.type === "image" && background.imageUrl && (
              <div className="mt-2 relative">
                <img
                  src={background.imageUrl}
                  alt="背景プレビュー"
                  className="w-full h-16 object-cover rounded-lg border border-border"
                  draggable={false}
                />
                <button
                  type="button"
                  onClick={() =>
                    onBackgroundChange({ type: "solid", color: "#1e293b" })
                  }
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/80 transition-colors"
                  title="背景画像を削除"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Section */}
      <SectionHeader
        icon={Layout}
        label="テンプレート"
        isOpen={openSections.templates}
        onToggle={() => toggleSection("templates")}
      />
      {openSections.templates && (
        <div className="px-3 pb-3">
          <div className="space-y-2">
            {/* Cover template */}
            <button
              type="button"
              onClick={() => {
                onBackgroundChange({
                  type: "gradient",
                  gradient:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                });
                onAddElement({
                  type: "shape",
                  x: 80,
                  y: 120,
                  width: 920,
                  height: 6,
                  rotation: 0,
                  shapeType: "line",
                  backgroundColor: "#ffffff40",
                  opacity: 100,
                });
                onAddElement({
                  type: "text",
                  x: 80,
                  y: 300,
                  width: 920,
                  height: 120,
                  rotation: 0,
                  text: "タイトルテキスト",
                  fontSize: 72,
                  fontFamily: "Noto Sans JP",
                  fontWeight: "bold",
                  color: "#ffffff",
                  textAlign: "center",
                  lineHeight: 1.3,
                  opacity: 100,
                });
                onAddElement({
                  type: "text",
                  x: 140,
                  y: 460,
                  width: 800,
                  height: 60,
                  rotation: 0,
                  text: "サブタイトルをここに入力",
                  fontSize: 32,
                  fontFamily: "Noto Sans JP",
                  fontWeight: "normal",
                  color: "#ffffffcc",
                  textAlign: "center",
                  lineHeight: 1.4,
                  opacity: 100,
                });
                onAddElement({
                  type: "text",
                  x: 300,
                  y: 900,
                  width: 480,
                  height: 40,
                  rotation: 0,
                  text: "@your_account",
                  fontSize: 24,
                  fontFamily: "Inter",
                  fontWeight: "normal",
                  color: "#ffffff80",
                  textAlign: "center",
                  opacity: 100,
                });
                onAddElement({
                  type: "shape",
                  x: 80,
                  y: 960,
                  width: 920,
                  height: 6,
                  rotation: 0,
                  shapeType: "line",
                  backgroundColor: "#ffffff40",
                  opacity: 100,
                });
              }}
              className="w-full p-3 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  表紙
                </div>
                <div>
                  <div className="text-sm font-medium">表紙</div>
                  <div className="text-xs text-muted-foreground">
                    タイトル + サブタイトル + ブランド名
                  </div>
                </div>
              </div>
            </button>

            {/* List template */}
            <button
              type="button"
              onClick={() => {
                onBackgroundChange({
                  type: "gradient",
                  gradient:
                    "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)",
                });
                onAddElement({
                  type: "text",
                  x: 80,
                  y: 60,
                  width: 920,
                  height: 80,
                  rotation: 0,
                  text: "リストタイトル",
                  fontSize: 48,
                  fontFamily: "Noto Sans JP",
                  fontWeight: "bold",
                  color: "#ffffff",
                  textAlign: "left",
                  lineHeight: 1.3,
                  opacity: 100,
                });
                onAddElement({
                  type: "shape",
                  x: 80,
                  y: 160,
                  width: 920,
                  height: 3,
                  rotation: 0,
                  shapeType: "line",
                  backgroundColor: "#ffffff30",
                  opacity: 100,
                });
                for (let i = 1; i <= 5; i++) {
                  onAddElement({
                    type: "shape",
                    x: 80,
                    y: 170 + (i - 1) * 140,
                    width: 60,
                    height: 60,
                    rotation: 0,
                    shapeType: "circle",
                    backgroundColor: "#6366f1",
                    borderRadius: 9999,
                    opacity: 100,
                  });
                  onAddElement({
                    type: "text",
                    x: 80,
                    y: 178 + (i - 1) * 140,
                    width: 60,
                    height: 44,
                    rotation: 0,
                    text: String(i),
                    fontSize: 28,
                    fontFamily: "Inter",
                    fontWeight: "bold",
                    color: "#ffffff",
                    textAlign: "center",
                    opacity: 100,
                  });
                  onAddElement({
                    type: "text",
                    x: 160,
                    y: 180 + (i - 1) * 140,
                    width: 820,
                    height: 50,
                    rotation: 0,
                    text: `リスト項目 ${i}`,
                    fontSize: 30,
                    fontFamily: "Noto Sans JP",
                    fontWeight: "normal",
                    color: "#ffffff",
                    textAlign: "left",
                    lineHeight: 1.4,
                    opacity: 100,
                  });
                }
              }}
              className="w-full p-3 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)",
                  }}
                >
                  LIST
                </div>
                <div>
                  <div className="text-sm font-medium">リスト</div>
                  <div className="text-xs text-muted-foreground">
                    ヘッダー + 5項目の番号付きリスト
                  </div>
                </div>
              </div>
            </button>

            {/* CTA template */}
            <button
              type="button"
              onClick={() => {
                onBackgroundChange({
                  type: "gradient",
                  gradient:
                    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                });
                onAddElement({
                  type: "text",
                  x: 80,
                  y: 250,
                  width: 920,
                  height: 200,
                  rotation: 0,
                  text: "今すぐチェック！",
                  fontSize: 64,
                  fontFamily: "Noto Sans JP",
                  fontWeight: "bold",
                  color: "#ffffff",
                  textAlign: "center",
                  lineHeight: 1.3,
                  opacity: 100,
                });
                onAddElement({
                  type: "shape",
                  x: 240,
                  y: 540,
                  width: 600,
                  height: 80,
                  rotation: 0,
                  shapeType: "rounded-rect",
                  backgroundColor: "#ffffff",
                  borderRadius: 40,
                  opacity: 100,
                });
                onAddElement({
                  type: "text",
                  x: 240,
                  y: 552,
                  width: 600,
                  height: 56,
                  rotation: 0,
                  text: "フォローしてね →",
                  fontSize: 32,
                  fontFamily: "Noto Sans JP",
                  fontWeight: "bold",
                  color: "#f5576c",
                  textAlign: "center",
                  opacity: 100,
                });
                onAddElement({
                  type: "text",
                  x: 300,
                  y: 900,
                  width: 480,
                  height: 40,
                  rotation: 0,
                  text: "@your_account",
                  fontSize: 24,
                  fontFamily: "Inter",
                  fontWeight: "normal",
                  color: "#ffffff90",
                  textAlign: "center",
                  opacity: 100,
                });
              }}
              className="w-full p-3 bg-white rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  }}
                >
                  CTA
                </div>
                <div>
                  <div className="text-sm font-medium">CTA</div>
                  <div className="text-xs text-muted-foreground">
                    CTAテキスト + フォロー誘導 + ブランド
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Bottom padding */}
      <div className="h-4" />
    </div>
  );
}
