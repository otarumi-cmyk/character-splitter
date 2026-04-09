"use client";

import React, { useCallback } from "react";
import { type CanvasElement } from "./CanvasElementView";
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Type,
  Square,
  Image as ImageIcon,
  Smile,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface LayersPanelProps {
  elements: CanvasElement[];
  selectedElementId: string | null;
  selectedElementIds: string[];
  onSelectElement: (id: string | null) => void;
  onSelectElements: (ids: string[]) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onReorderElement: (id: string, direction: "up" | "down" | "top" | "bottom") => void;
}

function getElementIcon(type: string) {
  switch (type) {
    case "text": return <Type className="size-3" />;
    case "shape": return <Square className="size-3" />;
    case "image": return <ImageIcon className="size-3" />;
    case "icon": return <Smile className="size-3" />;
    default: return <Square className="size-3" />;
  }
}

function getElementLabel(el: CanvasElement): string {
  if (el.type === "text" && el.text) {
    const t = el.text.replace(/\n/g, " ").trim();
    return t.length > 20 ? t.slice(0, 20) + "…" : t;
  }
  if (el.type === "shape") {
    return el.shapeType === "circle" ? "円" : el.shapeType === "line" ? "線" : "四角形";
  }
  if (el.type === "icon") return el.text || "アイコン";
  if (el.type === "image") return "画像";
  return el.id.slice(0, 8);
}

export default function LayersPanel({
  elements,
  selectedElementId,
  selectedElementIds,
  onSelectElement,
  onSelectElements,
  onUpdateElement,
  onReorderElement,
}: LayersPanelProps) {
  // zIndex降順（上にあるレイヤーが先）
  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  const handleToggleLock = useCallback(
    (e: React.MouseEvent, id: string, currentLocked: boolean) => {
      e.stopPropagation();
      onUpdateElement(id, { locked: !currentLocked });
    },
    [onUpdateElement]
  );

  const handleToggleVisibility = useCallback(
    (e: React.MouseEvent, id: string, currentHidden: boolean) => {
      e.stopPropagation();
      onUpdateElement(id, { hidden: !currentHidden });
    },
    [onUpdateElement]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+クリック: 複数選択トグル
        if (selectedElementIds.includes(id)) {
          const newIds = selectedElementIds.filter((i) => i !== id);
          onSelectElements(newIds);
          onSelectElement(newIds[newIds.length - 1] ?? null);
        } else {
          const newIds = [...selectedElementIds, id];
          onSelectElements(newIds);
          onSelectElement(id);
        }
      } else {
        onSelectElements([id]);
        onSelectElement(id);
      }
    },
    [selectedElementIds, onSelectElement, onSelectElements]
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-600">レイヤー</span>
        <span className="text-[10px] text-gray-400">{elements.length}要素</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.map((el) => {
          const isSelected = el.id === selectedElementId || selectedElementIds.includes(el.id);
          return (
            <div
              key={el.id}
              onClick={(e) => handleClick(e, el.id)}
              className={`flex items-center gap-1 px-2 py-1.5 border-b text-xs cursor-pointer transition-colors ${
                isSelected
                  ? "bg-blue-50 border-l-2 border-l-blue-500"
                  : "hover:bg-gray-50 border-l-2 border-l-transparent"
              } ${el.hidden ? "opacity-40" : ""}`}
            >
              {/* アイコン */}
              <span className="text-gray-400 flex-shrink-0">{getElementIcon(el.type)}</span>

              {/* ラベル */}
              <span className={`flex-1 truncate ${isSelected ? "text-blue-700 font-medium" : "text-gray-700"}`}>
                {getElementLabel(el)}
              </span>

              {/* z-index操作 */}
              <button
                onClick={(e) => { e.stopPropagation(); onReorderElement(el.id, "up"); }}
                className="p-0.5 text-gray-300 hover:text-gray-600"
                title="前面へ"
              >
                <ChevronUp className="size-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReorderElement(el.id, "down"); }}
                className="p-0.5 text-gray-300 hover:text-gray-600"
                title="背面へ"
              >
                <ChevronDown className="size-3" />
              </button>

              {/* 表示/非表示 */}
              <button
                onClick={(e) => handleToggleVisibility(e, el.id, !!el.hidden)}
                className={`p-0.5 ${el.hidden ? "text-amber-500" : "text-gray-300 hover:text-gray-600"}`}
                title={el.hidden ? "表示する" : "非表示にする"}
              >
                {el.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              </button>

              {/* ロック */}
              <button
                onClick={(e) => handleToggleLock(e, el.id, !!el.locked)}
                className={`p-0.5 ${el.locked ? "text-amber-500" : "text-gray-300 hover:text-gray-600"}`}
                title={el.locked ? "ロック解除" : "ロック"}
              >
                {el.locked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
