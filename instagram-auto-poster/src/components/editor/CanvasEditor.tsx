"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import CanvasElementView, {
  type CanvasElement,
} from "./CanvasElementView";

export type { CanvasElement };

export interface SlideCanvasData {
  elements: CanvasElement[];
  background: {
    type: "solid" | "gradient" | "image";
    color?: string;
    gradient?: string;
    imageUrl?: string;
  };
}

interface CanvasEditorProps {
  data: SlideCanvasData;
  onChange: (data: SlideCanvasData) => void;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
}

const CANVAS_SIZE = 1080;

export default function CanvasEditor({
  data,
  onChange,
  selectedElementId,
  onSelectElement,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [displaySize, setDisplaySize] = useState(540);

  // Auto-fit canvas to container
  useEffect(() => {
    const updateSize = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const maxW = rect.width - 48;
      const maxH = rect.height - 48;
      const size = Math.min(maxW, maxH, 800);
      setDisplaySize(Math.max(300, size));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const scale = displaySize / CANVAS_SIZE;

  const dragStateRef = useRef<{
    type: "move" | "resize";
    elementId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    handle?: string;
  } | null>(null);

  const dataRef = useRef(data);
  dataRef.current = data;

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.preventDefault();
      onSelectElement(elementId);
      setEditingElementId(null);

      const el = data.elements.find((el) => el.id === elementId);
      if (!el) return;

      dragStateRef.current = {
        type: "move",
        elementId,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        origW: el.width,
        origH: el.height,
      };
      setIsDragging(true);
    },
    [data.elements, onSelectElement]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, elementId: string, handle: string) => {
      e.preventDefault();
      const el = data.elements.find((el) => el.id === elementId);
      if (!el) return;

      dragStateRef.current = {
        type: "resize",
        elementId,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        origW: el.width,
        origH: el.height,
        handle,
      };
      setIsDragging(true);
    },
    [data.elements]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const state = dragStateRef.current;
      if (!state) return;

      const dx = (e.clientX - state.startX) / scale;
      const dy = (e.clientY - state.startY) / scale;

      const currentData = dataRef.current;
      const elements = currentData.elements.map((el) => {
        if (el.id !== state.elementId) return el;

        if (state.type === "move") {
          return {
            ...el,
            x: Math.round(state.origX + dx),
            y: Math.round(state.origY + dy),
          };
        }

        if (state.type === "resize" && state.handle) {
          let newX = state.origX;
          let newY = state.origY;
          let newW = state.origW;
          let newH = state.origH;

          const handle = state.handle;
          if (handle.includes("left")) {
            newX = state.origX + dx;
            newW = state.origW - dx;
          } else if (handle.includes("right")) {
            newW = state.origW + dx;
          }
          if (handle.includes("top")) {
            newY = state.origY + dy;
            newH = state.origH - dy;
          } else if (handle.includes("bottom")) {
            newH = state.origH + dy;
          }

          const minSize = 20;
          if (newW < minSize) {
            if (handle.includes("left")) newX = state.origX + state.origW - minSize;
            newW = minSize;
          }
          if (newH < minSize) {
            if (handle.includes("top")) newY = state.origY + state.origH - minSize;
            newH = minSize;
          }

          return {
            ...el,
            x: Math.round(newX),
            y: Math.round(newY),
            width: Math.round(newW),
            height: Math.round(newH),
          };
        }

        return el;
      });

      onChange({ ...currentData, elements });
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isDragging, onChange, scale]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || e.target === canvasRef.current) {
        onSelectElement(null);
        setEditingElementId(null);
      }
    },
    [onSelectElement]
  );

  const handleElementDoubleClick = useCallback(
    (elementId: string) => {
      const el = data.elements.find((el) => el.id === elementId);
      if (el?.type === "text") {
        setEditingElementId(elementId);
      }
    },
    [data.elements]
  );

  const handleTextChange = useCallback(
    (elementId: string, text: string) => {
      const elements = data.elements.map((el) =>
        el.id === elementId ? { ...el, text } : el
      );
      onChange({ ...data, elements });
    },
    [data, onChange]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedElementId) return;
    const elements = data.elements.filter((el) => el.id !== selectedElementId);
    onChange({ ...data, elements });
    onSelectElement(null);
    setEditingElementId(null);
  }, [data, onChange, selectedElementId, onSelectElement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingElementId) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId) {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === "Escape") {
        onSelectElement(null);
        setEditingElementId(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingElementId, selectedElementId, deleteSelected, onSelectElement]);

  const getBackgroundStyle = (): React.CSSProperties => {
    const bg = data.background;
    if (bg.type === "gradient" && bg.gradient) return { background: bg.gradient };
    if (bg.type === "image" && bg.imageUrl) {
      return {
        backgroundImage: `url(${bg.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    return { backgroundColor: bg.color ?? "#ffffff" };
  };

  const sortedElements = [...data.elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={wrapperRef}
      className="flex-1 flex items-center justify-center w-full h-full"
      onClick={handleCanvasClick}
    >
      <div
        style={{
          width: `${displaySize}px`,
          height: `${displaySize}px`,
          overflow: "hidden",
          borderRadius: "8px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          border: "1px solid #d1d5db",
          flexShrink: 0,
        }}
      >
        <div
          ref={canvasRef}
          style={{
            width: `${CANVAS_SIZE}px`,
            height: `${CANVAS_SIZE}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "relative",
            ...getBackgroundStyle(),
          }}
          onClick={handleCanvasClick}
        >
          {sortedElements.map((element) => (
            <CanvasElementView
              key={element.id}
              element={element}
              isSelected={element.id === selectedElementId}
              isEditing={element.id === editingElementId}
              scale={scale}
              onMouseDown={(e) => handleElementMouseDown(e, element.id)}
              onDoubleClick={() => handleElementDoubleClick(element.id)}
              onTextChange={(text) => handleTextChange(element.id, text)}
              onResizeStart={(e, handle) =>
                handleResizeStart(e, element.id, handle)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
