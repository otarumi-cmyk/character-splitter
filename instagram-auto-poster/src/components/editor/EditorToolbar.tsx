"use client";

import { useCallback } from "react";
import {
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditorToolbarProps {
  selectedElement: {
    id: string;
    type: "text" | "shape" | "icon" | "image";
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: "left" | "center" | "right";
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
  } | null;
  onUpdateElement: (updates: Record<string, unknown>) => void;
  onDeleteElement: () => void;
  onDuplicateElement: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

export const FONT_FAMILIES = [
  // ── ゴシック系（読みやすい・ベーシック）──
  { value: "Noto Sans JP", label: "Noto Sans JP", category: "ゴシック" },
  { value: "Zen Kaku Gothic New", label: "Zen角ゴシック", category: "ゴシック" },
  { value: "Sawarabi Gothic", label: "さわらびゴシック", category: "ゴシック" },
  // ── 丸ゴシック系（やわらかい・親しみやすい）──
  { value: "M PLUS Rounded 1c", label: "M PLUS 丸ゴ", category: "丸ゴシック" },
  { value: "Zen Maru Gothic", label: "Zen丸ゴシック", category: "丸ゴシック" },
  { value: "Kosugi Maru", label: "小杉丸ゴシック", category: "丸ゴシック" },
  // ── 明朝系（上品・フォーマル）──
  { value: "Noto Serif JP", label: "Noto Serif JP", category: "明朝" },
  { value: "Shippori Mincho", label: "しっぽり明朝", category: "明朝" },
  // ── 手書き・かわいい系 ──
  { value: "Klee One", label: "クレー One", category: "手書き" },
  { value: "Hachi Maru Pop", label: "はちまるポップ", category: "手書き" },
  { value: "Yusei Magic", label: "油性マジック", category: "手書き" },
  { value: "Zen Antique", label: "Zenアンティーク", category: "手書き" },
  // ── インパクト・装飾系 ──
  { value: "Dela Gothic One", label: "デラゴシック", category: "インパクト" },
  { value: "Reggae One", label: "レゲエ One", category: "インパクト" },
  { value: "RocknRoll One", label: "ロックンロール", category: "インパクト" },
  { value: "Train One", label: "トレイン One", category: "インパクト" },
  { value: "DotGothic16", label: "ドットゴシック16", category: "インパクト" },
  // ── 欧文フォント ──
  { value: "Inter", label: "Inter", category: "欧文" },
  { value: "Poppins", label: "Poppins", category: "欧文" },
  { value: "Montserrat", label: "Montserrat", category: "欧文" },
  { value: "Oswald", label: "Oswald", category: "欧文" },
  { value: "Bebas Neue", label: "Bebas Neue", category: "欧文" },
];

export default function EditorToolbar({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onBringForward,
  onSendBackward,
}: EditorToolbarProps) {
  const handleFontSizeChange = useCallback(
    (delta: number) => {
      if (!selectedElement?.fontSize) return;
      const newSize = Math.min(200, Math.max(12, selectedElement.fontSize + delta));
      onUpdateElement({ fontSize: newSize });
    },
    [selectedElement?.fontSize, onUpdateElement]
  );

  const handleFontSizeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val)) {
        onUpdateElement({ fontSize: Math.min(200, Math.max(12, val)) });
      }
    },
    [onUpdateElement]
  );

  if (!selectedElement) {
    return (
      <div className="flex items-center h-12 px-4 bg-white border-b shadow-sm">
        <span className="text-sm text-muted-foreground">
          要素をクリックして編集
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 h-12 px-3 bg-white border-b shadow-sm overflow-x-auto">
      {/* Text formatting */}
      {selectedElement.type === "text" && (
        <>
          {/* Font family */}
          <Select
            value={selectedElement.fontFamily ?? "Noto Sans JP"}
            onValueChange={(val) => onUpdateElement({ fontFamily: val })}
          >
            <SelectTrigger size="sm" className="w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {(() => {
                const categories = [...new Set(FONT_FAMILIES.map(f => f.category))];
                return categories.map(cat => (
                  <div key={cat}>
                    <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{cat}</div>
                    {FONT_FAMILIES.filter(f => f.category === cat).map(font => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }} className="text-sm">{font.label}</span>
                      </SelectItem>
                    ))}
                  </div>
                ));
              })()}
            </SelectContent>
          </Select>

          {/* Font size */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleFontSizeChange(-2)}
              title="フォントサイズを小さく"
            >
              <span className="text-xs font-bold">−</span>
            </Button>
            <Input
              type="number"
              value={selectedElement.fontSize ?? 28}
              onChange={handleFontSizeInput}
              className="w-14 h-7 text-xs text-center px-1"
              min={12}
              max={200}
            />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleFontSizeChange(2)}
              title="フォントサイズを大きく"
            >
              <span className="text-xs font-bold">+</span>
            </Button>
          </div>

          {/* Bold toggle */}
          <Button
            variant={selectedElement.fontWeight === "bold" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() =>
              onUpdateElement({
                fontWeight: selectedElement.fontWeight === "bold" ? "normal" : "bold",
              })
            }
            title="太字"
          >
            <Bold className="size-4" />
          </Button>

          {/* Text alignment */}
          <div className="flex items-center rounded-md border border-border">
            <Button
              variant={selectedElement.textAlign === "left" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => onUpdateElement({ textAlign: "left" })}
              className="rounded-r-none"
              title="左揃え"
            >
              <AlignLeft className="size-3.5" />
            </Button>
            <Button
              variant={selectedElement.textAlign === "center" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => onUpdateElement({ textAlign: "center" })}
              className="rounded-none border-x border-border"
              title="中央揃え"
            >
              <AlignCenter className="size-3.5" />
            </Button>
            <Button
              variant={selectedElement.textAlign === "right" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => onUpdateElement({ textAlign: "right" })}
              className="rounded-l-none"
              title="右揃え"
            >
              <AlignRight className="size-3.5" />
            </Button>
          </div>

          {/* Text color */}
          <div className="flex items-center gap-1 ml-1">
            <label className="text-xs text-muted-foreground">色</label>
            <div className="relative">
              <div
                className="w-6 h-6 rounded border border-border cursor-pointer"
                style={{ backgroundColor: selectedElement.color ?? "#ffffff" }}
              />
              <input
                type="color"
                value={selectedElement.color ?? "#ffffff"}
                onChange={(e) => onUpdateElement({ color: e.target.value })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <Separator orientation="vertical" className="mx-1 h-6" />
        </>
      )}

      {/* Shape formatting */}
      {selectedElement.type === "shape" && (
        <>
          {/* Fill color */}
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground">塗り</label>
            <div className="relative">
              <div
                className="w-6 h-6 rounded border border-border cursor-pointer"
                style={{
                  backgroundColor: selectedElement.backgroundColor ?? "#6366f1",
                }}
              />
              <input
                type="color"
                value={selectedElement.backgroundColor ?? "#6366f1"}
                onChange={(e) =>
                  onUpdateElement({ backgroundColor: e.target.value })
                }
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Border color */}
          <div className="flex items-center gap-1 ml-2">
            <label className="text-xs text-muted-foreground">枠線</label>
            <div className="relative">
              <div
                className="w-6 h-6 rounded border border-border cursor-pointer"
                style={{
                  backgroundColor: selectedElement.borderColor ?? "#000000",
                }}
              />
              <input
                type="color"
                value={selectedElement.borderColor ?? "#000000"}
                onChange={(e) => onUpdateElement({ borderColor: e.target.value })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Border width */}
          <div className="flex items-center gap-1 ml-2">
            <label className="text-xs text-muted-foreground">幅</label>
            <Input
              type="number"
              value={selectedElement.borderWidth ?? 0}
              onChange={(e) =>
                onUpdateElement({
                  borderWidth: Math.min(10, Math.max(0, parseInt(e.target.value, 10) || 0)),
                })
              }
              className="w-12 h-7 text-xs text-center px-1"
              min={0}
              max={10}
            />
          </div>

          {/* Border radius */}
          <div className="flex items-center gap-1 ml-2">
            <label className="text-xs text-muted-foreground">角丸</label>
            <input
              type="range"
              value={selectedElement.borderRadius ?? 0}
              onChange={(e) =>
                onUpdateElement({ borderRadius: parseInt(e.target.value, 10) })
              }
              min={0}
              max={100}
              className="w-20 h-1.5 accent-primary"
            />
            <span className="text-xs text-muted-foreground w-7 text-right">
              {selectedElement.borderRadius ?? 0}
            </span>
          </div>

          <Separator orientation="vertical" className="mx-1 h-6" />
        </>
      )}

      {/* Common actions */}
      {/* Opacity */}
      <div className="flex items-center gap-1">
        <label className="text-xs text-muted-foreground">不透明度</label>
        <input
          type="range"
          value={selectedElement.opacity ?? 100}
          onChange={(e) =>
            onUpdateElement({ opacity: parseInt(e.target.value, 10) })
          }
          min={0}
          max={100}
          className="w-16 h-1.5 accent-primary"
        />
        <span className="text-xs text-muted-foreground w-8 text-right">
          {selectedElement.opacity ?? 100}%
        </span>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Layer controls */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onBringForward}
        title="前面へ"
      >
        <ArrowUp className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onSendBackward}
        title="背面へ"
      >
        <ArrowDown className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Duplicate & Delete */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDuplicateElement}
        title="複製"
      >
        <Copy className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDeleteElement}
        title="削除"
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
