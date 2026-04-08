"use client";

import { useCallback } from "react";
import { Label } from "@/components/ui/label";

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky Blue
  "#1e293b", // Dark Slate
  "#ffffff", // White
  "#0F0A1A", // Near Black
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const handlePresetClick = useCallback(
    (color: string) => {
      onChange(color);
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg border border-border shadow-sm flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-8 rounded-md cursor-pointer border-0 bg-transparent"
        />
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handlePresetClick(color)}
            className={`w-full aspect-square rounded-md border-2 transition-all hover:scale-110 ${
              value.toLowerCase() === color.toLowerCase()
                ? "border-ring ring-2 ring-ring/30 scale-110"
                : "border-transparent hover:border-border"
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}
