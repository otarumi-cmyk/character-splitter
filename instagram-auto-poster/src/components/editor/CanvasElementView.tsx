"use client";

import React, { useRef, useEffect, useCallback } from "react";

export interface CanvasElement {
  id: string;
  type: "text" | "shape" | "icon" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  // Shape properties
  shapeType?: "rect" | "circle" | "rounded-rect" | "line";
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  // Image properties
  imageUrl?: string;
  objectFit?: "cover" | "contain" | "fill";
}

interface CanvasElementViewProps {
  element: CanvasElement;
  isSelected: boolean;
  isEditing: boolean;
  scale: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onTextChange: (text: string) => void;
  onResizeStart: (e: React.MouseEvent, handle: string) => void;
}

const HANDLE_SIZE = 8;

const HANDLES = [
  { id: "top-left", x: 0, y: 0, cursor: "nw-resize" },
  { id: "top-center", x: 0.5, y: 0, cursor: "n-resize" },
  { id: "top-right", x: 1, y: 0, cursor: "ne-resize" },
  { id: "middle-left", x: 0, y: 0.5, cursor: "w-resize" },
  { id: "middle-right", x: 1, y: 0.5, cursor: "e-resize" },
  { id: "bottom-left", x: 0, y: 1, cursor: "sw-resize" },
  { id: "bottom-center", x: 0.5, y: 1, cursor: "s-resize" },
  { id: "bottom-right", x: 1, y: 1, cursor: "se-resize" },
];

export default function CanvasElementView({
  element,
  isSelected,
  isEditing,
  scale,
  onMouseDown,
  onDoubleClick,
  onTextChange,
  onResizeStart,
}: CanvasElementViewProps) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(textRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const handleInput = useCallback(() => {
    if (textRef.current) {
      onTextChange(textRef.current.innerText);
    }
  }, [onTextChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        (e.target as HTMLElement).blur();
      }
      // Prevent drag while editing
      e.stopPropagation();
    },
    []
  );

  const getShapeBorderRadius = () => {
    if (element.shapeType === "circle") return "50%";
    if (element.shapeType === "rounded-rect")
      return `${element.borderRadius ?? 12}px`;
    return "0px";
  };

  const renderContent = () => {
    if (element.type === "text") {
      return (
        <div
          ref={textRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            height: "100%",
            fontSize: `${element.fontSize ?? 24}px`,
            fontFamily: element.fontFamily ?? "sans-serif",
            fontWeight: element.fontWeight ?? "normal",
            color: element.color ?? "#000000",
            textAlign: element.textAlign ?? "left",
            lineHeight: element.lineHeight ?? 1.4,
            overflow: "hidden",
            outline: "none",
            cursor: isEditing ? "text" : "move",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            userSelect: isEditing ? "text" : "none",
          }}
        >
          {element.text ?? ""}
        </div>
      );
    }

    if (element.type === "shape") {
      if (element.shapeType === "line") {
        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                height: `${element.borderWidth ?? 2}px`,
                backgroundColor:
                  element.backgroundColor ?? element.borderColor ?? "#000000",
              }}
            />
          </div>
        );
      }

      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: element.backgroundColor ?? "transparent",
            borderColor: element.borderColor ?? "transparent",
            borderWidth: `${element.borderWidth ?? 0}px`,
            borderStyle: element.borderWidth ? "solid" : "none",
            borderRadius: getShapeBorderRadius(),
            boxSizing: "border-box",
          }}
        />
      );
    }

    if (element.type === "icon") {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${Math.min(element.width, element.height) * 0.6}px`,
            color: element.color ?? "#000000",
          }}
        >
          {element.text ?? "★"}
        </div>
      );
    }

    if (element.type === "image" && element.imageUrl) {
      return (
        <img
          src={element.imageUrl}
          alt=""
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: element.objectFit ?? "cover",
            borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
            opacity: element.opacity ?? 1,
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      );
    }

    return null;
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: element.rotation
          ? `rotate(${element.rotation}deg)`
          : undefined,
        zIndex: element.zIndex,
        opacity: element.opacity ?? 1,
        cursor: isEditing ? "text" : "move",
      }}
      onMouseDown={(e) => {
        if (!isEditing) {
          e.stopPropagation();
          onMouseDown(e);
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      {renderContent()}

      {/* Selection border */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            inset: -1,
            border: "2px dashed #3b82f6",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
      )}

      {/* Resize handles */}
      {isSelected &&
        !isEditing &&
        HANDLES.map((handle) => (
          <div
            key={handle.id}
            style={{
              position: "absolute",
              left: `${handle.x * 100}%`,
              top: `${handle.y * 100}%`,
              width: `${HANDLE_SIZE / scale}px`,
              height: `${HANDLE_SIZE / scale}px`,
              backgroundColor: "#ffffff",
              border: `${1.5 / scale}px solid #3b82f6`,
              borderRadius: `${1 / scale}px`,
              transform: "translate(-50%, -50%)",
              cursor: handle.cursor,
              zIndex: 10000,
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart(e, handle.id);
            }}
          />
        ))}
    </div>
  );
}
