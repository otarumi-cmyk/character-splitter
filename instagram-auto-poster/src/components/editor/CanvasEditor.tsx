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
  // 複数選択
  selectedElementIds?: string[];
  onSelectElements?: (ids: string[]) => void;
}

const CANVAS_W = 1080;
const CANVAS_H = 1350;
const SNAP_THRESHOLD = 6; // px in canvas coords

interface SnapGuide {
  type: "vertical" | "horizontal";
  pos: number; // x or y in canvas coords
}

/** Compute snap targets from other elements + canvas center/edges */
function computeSnap(
  movingRect: { x: number; y: number; width: number; height: number },
  otherElements: CanvasElement[],
  canvasW: number,
  canvasH: number = canvasW,
): { snappedX: number; snappedY: number; guides: SnapGuide[] } {
  const mx = movingRect.x;
  const my = movingRect.y;
  const mw = movingRect.width;
  const mh = movingRect.height;
  const mCx = mx + mw / 2;
  const mCy = my + mh / 2;
  const mR = mx + mw;
  const mB = my + mh;

  // Collect all snap targets: [position, label]
  const vTargets: number[] = [0, canvasW / 2, canvasW]; // canvas left, center, right
  const hTargets: number[] = [0, canvasH / 2, canvasH]; // canvas top, center, bottom

  for (const el of otherElements) {
    vTargets.push(el.x, el.x + el.width / 2, el.x + el.width);
    hTargets.push(el.y, el.y + el.height / 2, el.y + el.height);
  }

  let bestDx = Infinity;
  let snapX = mx;
  let snapVPos: number | null = null;

  // Check left, center, right of moving element against all vertical targets
  for (const t of vTargets) {
    for (const [edge, offset] of [[mx, 0], [mCx, mw / 2], [mR, mw]] as [number, number][]) {
      const d = Math.abs(edge - t);
      if (d < SNAP_THRESHOLD && d < Math.abs(bestDx)) {
        bestDx = d;
        snapX = t - offset;
        snapVPos = t;
      }
    }
  }

  let bestDy = Infinity;
  let snapY = my;
  let snapHPos: number | null = null;

  for (const t of hTargets) {
    for (const [edge, offset] of [[my, 0], [mCy, mh / 2], [mB, mh]] as [number, number][]) {
      const d = Math.abs(edge - t);
      if (d < SNAP_THRESHOLD && d < Math.abs(bestDy)) {
        bestDy = d;
        snapY = t - offset;
        snapHPos = t;
      }
    }
  }

  const guides: SnapGuide[] = [];
  if (snapVPos !== null) guides.push({ type: "vertical", pos: snapVPos });
  if (snapHPos !== null) guides.push({ type: "horizontal", pos: snapHPos });

  return { snappedX: Math.round(snapX), snappedY: Math.round(snapY), guides };
}

export default function CanvasEditor({
  data,
  onChange,
  selectedElementId,
  onSelectElement,
  selectedElementIds: externalIds,
  onSelectElements,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [displaySize, setDisplaySize] = useState(540);
  // 内部の複数選択（外部指定がなければ内部管理）
  const [internalIds, setInternalIds] = useState<string[]>([]);
  const selectedIds = externalIds ?? internalIds;
  const setSelectedIds = onSelectElements ?? setInternalIds;
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);

  // 矩形選択
  const [boxSelect, setBoxSelect] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);

  // Auto-fit canvas to container
  useEffect(() => {
    const updateSize = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const maxW = rect.width - 48;
      const maxH = rect.height - 48;
      // Fit by width, but also check height constraint
      const fitW = Math.min(maxW, 800);
      const fitH = maxH / (CANVAS_H / CANVAS_W);
      const size = Math.max(300, Math.min(fitW, fitH));
      setDisplaySize(size);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const scale = displaySize / CANVAS_W;
  const displayHeight = displaySize * (CANVAS_H / CANVAS_W);

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
    // 複数要素の元位置
    multiOrig?: Array<{ id: string; x: number; y: number }>;
  } | null>(null);

  const dataRef = useRef(data);
  dataRef.current = data;
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.preventDefault();
      const el = data.elements.find((el) => el.id === elementId);
      if (!el) return;

      // ロック中は選択だけ（ドラッグしない）
      const isMulti = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      if (isMulti) {
        // Ctrl/Cmd+クリック: トグル
        const ids = selectedIdsRef.current;
        if (ids.includes(elementId)) {
          const newIds = ids.filter((id) => id !== elementId);
          setSelectedIds(newIds);
          onSelectElement(newIds[newIds.length - 1] ?? null);
        } else {
          const newIds = [...ids, elementId];
          setSelectedIds(newIds);
          onSelectElement(elementId);
        }
      } else if (isShift && selectedIdsRef.current.length > 0) {
        // Shift+クリック: 範囲追加
        if (!selectedIdsRef.current.includes(elementId)) {
          const newIds = [...selectedIdsRef.current, elementId];
          setSelectedIds(newIds);
          onSelectElement(elementId);
        }
      } else {
        // 通常クリック: 単一選択（ただし既に複数選択のメンバーならまとめてドラッグ）
        if (!selectedIdsRef.current.includes(elementId)) {
          setSelectedIds([elementId]);
        }
        onSelectElement(elementId);
      }

      setEditingElementId(null);

      if (el.locked) return; // ロック中はドラッグ不可

      // ドラッグ開始: 複数選択されているなら全要素の元位置を記録
      const currentIds = selectedIdsRef.current.includes(elementId) ? selectedIdsRef.current : [elementId];
      const multiOrig = currentIds
        .map((id) => data.elements.find((e) => e.id === id))
        .filter((e): e is CanvasElement => !!e && !e.locked)
        .map((e) => ({ id: e.id, x: e.x, y: e.y }));

      dragStateRef.current = {
        type: "move",
        elementId,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        origW: el.width,
        origH: el.height,
        multiOrig,
      };
      setIsDragging(true);
    },
    [data.elements, onSelectElement, setSelectedIds]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, elementId: string, handle: string) => {
      e.preventDefault();
      const el = data.elements.find((el) => el.id === elementId);
      if (!el || el.locked) return;

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
      // 矩形選択中
      if (boxSelect) {
        setBoxSelect((prev) =>
          prev ? { ...prev, x: e.clientX, y: e.clientY } : null
        );
        return;
      }

      const state = dragStateRef.current;
      if (!state) return;

      const dx = (e.clientX - state.startX) / scale;
      const dy = (e.clientY - state.startY) / scale;

      const currentData = dataRef.current;

      if (state.type === "move" && state.multiOrig && state.multiOrig.length > 0) {
        // 複数要素を同時移動 — primary要素でスナップ計算
        const primaryOrig = state.multiOrig.find((o) => o.id === state.elementId) || state.multiOrig[0];
        const primaryEl = currentData.elements.find((e) => e.id === primaryOrig.id);
        if (!primaryEl) return;
        const rawX = primaryOrig.x + dx;
        const rawY = primaryOrig.y + dy;
        const otherEls = currentData.elements.filter((e) => !state.multiOrig!.some((o) => o.id === e.id));
        const { snappedX, snappedY, guides } = computeSnap(
          { x: rawX, y: rawY, width: primaryEl.width, height: primaryEl.height },
          otherEls, CANVAS_W, CANVAS_H,
        );
        setSnapGuides(guides);
        const snapDx = snappedX - primaryOrig.x;
        const snapDy = snappedY - primaryOrig.y;
        const elements = currentData.elements.map((el) => {
          const orig = state.multiOrig!.find((o) => o.id === el.id);
          if (!orig) return el;
          return { ...el, x: Math.round(orig.x + snapDx), y: Math.round(orig.y + snapDy) };
        });
        onChange({ ...currentData, elements });
        return;
      }

      const elements = currentData.elements.map((el) => {
        if (el.id !== state.elementId) return el;

        if (state.type === "move") {
          const rawX = state.origX + dx;
          const rawY = state.origY + dy;
          const otherEls = currentData.elements.filter((e) => e.id !== el.id);
          const { snappedX, snappedY, guides } = computeSnap(
            { x: rawX, y: rawY, width: el.width, height: el.height },
            otherEls, CANVAS_W, CANVAS_H,
          );
          setSnapGuides(guides);
          return { ...el, x: snappedX, y: snappedY };
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

    const handleMouseUp = (e: MouseEvent) => {
      // 矩形選択の完了
      if (boxSelect && canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const sx = (Math.min(boxSelect.startX, e.clientX) - canvasRect.left) / scale;
        const sy = (Math.min(boxSelect.startY, e.clientY) - canvasRect.top) / scale;
        const ex = (Math.max(boxSelect.startX, e.clientX) - canvasRect.left) / scale;
        const ey = (Math.max(boxSelect.startY, e.clientY) - canvasRect.top) / scale;

        const hits = dataRef.current.elements.filter((el) => {
          return el.x < ex && el.x + el.width > sx && el.y < ey && el.y + el.height > sy;
        });
        if (hits.length > 0) {
          const ids = hits.map((el) => el.id);
          setSelectedIds(ids);
          onSelectElement(ids[ids.length - 1]);
        }
        setBoxSelect(null);
        return;
      }

      dragStateRef.current = null;
      setIsDragging(false);
      setSnapGuides([]);
    };

    if (isDragging || boxSelect) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isDragging, boxSelect, onChange, scale, onSelectElement, setSelectedIds]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // 空白クリックで矩形選択開始
      if (e.target === e.currentTarget || e.target === canvasRef.current) {
        if (!e.ctrlKey && !e.metaKey) {
          onSelectElement(null);
          setSelectedIds([]);
          setEditingElementId(null);
        }
        // 矩形選択開始
        setBoxSelect({ startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY });
      }
    },
    [onSelectElement, setSelectedIds]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || e.target === canvasRef.current) {
        // mouseDown で処理済み
      }
    },
    []
  );

  const handleElementDoubleClick = useCallback(
    (elementId: string) => {
      const el = data.elements.find((el) => el.id === elementId);
      if (el?.type === "text" && !el.locked) {
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
    const ids = selectedIdsRef.current;
    if (ids.length === 0 && !selectedElementId) return;
    const toDelete = ids.length > 0 ? new Set(ids) : new Set([selectedElementId!]);
    // ロック要素は削除しない
    const elements = data.elements.filter((el) => !toDelete.has(el.id) || el.locked);
    onChange({ ...data, elements });
    onSelectElement(null);
    setSelectedIds([]);
    setEditingElementId(null);
  }, [data, onChange, selectedElementId, onSelectElement, setSelectedIds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingElementId) return;
      if ((e.key === "Delete" || e.key === "Backspace") && (selectedElementId || selectedIds.length > 0)) {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === "Escape") {
        onSelectElement(null);
        setSelectedIds([]);
        setEditingElementId(null);
      }
      // Ctrl+A: 全選択
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        const allIds = data.elements.map((el) => el.id);
        setSelectedIds(allIds);
        if (allIds.length > 0) onSelectElement(allIds[allIds.length - 1]);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingElementId, selectedElementId, selectedIds, deleteSelected, onSelectElement, setSelectedIds, data.elements]);

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

  // 矩形選択のオーバーレイ位置
  const getBoxSelectStyle = (): React.CSSProperties | null => {
    if (!boxSelect || !canvasRef.current) return null;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const left = Math.min(boxSelect.startX, boxSelect.x) - canvasRect.left;
    const top = Math.min(boxSelect.startY, boxSelect.y) - canvasRect.top;
    const width = Math.abs(boxSelect.x - boxSelect.startX);
    const height = Math.abs(boxSelect.y - boxSelect.startY);
    return {
      position: "absolute",
      left: `${left / scale}px`,
      top: `${top / scale}px`,
      width: `${width / scale}px`,
      height: `${height / scale}px`,
      border: "2px solid #3b82f6",
      backgroundColor: "rgba(59,130,246,0.15)",
      pointerEvents: "none",
      zIndex: 99999,
    };
  };

  const sortedElements = [...data.elements].sort((a, b) => a.zIndex - b.zIndex);
  const boxStyle = getBoxSelectStyle();

  // キャンバス外クリックで選択解除
  const handleWrapperClick = useCallback(
    (e: React.MouseEvent) => {
      // クリックがキャンバス内部ではなくwrapper直接の場合のみ
      if (e.target === wrapperRef.current) {
        onSelectElement(null);
        setSelectedIds([]);
        setEditingElementId(null);
      }
    },
    [onSelectElement, setSelectedIds]
  );

  return (
    <div
      ref={wrapperRef}
      className="flex-1 flex items-center justify-center w-full h-full"
      onClick={handleWrapperClick}
    >
      <div
        style={{
          width: `${displaySize}px`,
          height: `${displayHeight}px`,
          overflow: "hidden",
          borderRadius: "8px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          border: "1px solid #d1d5db",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <div
          ref={canvasRef}
          style={{
            width: `${CANVAS_W}px`,
            height: `${CANVAS_H}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "relative",
            ...getBackgroundStyle(),
          }}
          onMouseDown={handleCanvasMouseDown}
          onClick={handleCanvasClick}
        >
          {sortedElements.map((element) => (
            <CanvasElementView
              key={element.id}
              element={element}
              isSelected={element.id === selectedElementId || selectedIds.includes(element.id)}
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
          {/* スナップガイドライン */}
          {snapGuides.map((g, i) =>
            g.type === "vertical" ? (
              <div
                key={`sg-${i}`}
                style={{
                  position: "absolute",
                  left: `${g.pos}px`,
                  top: 0,
                  width: "1px",
                  height: `${CANVAS_H}px`,
                  backgroundColor: "#f43f5e",
                  opacity: 0.7,
                  pointerEvents: "none",
                  zIndex: 99998,
                }}
              />
            ) : (
              <div
                key={`sg-${i}`}
                style={{
                  position: "absolute",
                  top: `${g.pos}px`,
                  left: 0,
                  height: "1px",
                  width: `${CANVAS_W}px`,
                  backgroundColor: "#f43f5e",
                  opacity: 0.7,
                  pointerEvents: "none",
                  zIndex: 99998,
                }}
              />
            )
          )}
          {/* 矩形選択オーバーレイ */}
          {boxStyle && <div style={boxStyle} />}
        </div>
      </div>
    </div>
  );
}
