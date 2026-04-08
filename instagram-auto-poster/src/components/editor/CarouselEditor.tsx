"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import SlideEditor, { type SlideData } from "./SlideEditor";
import SlidePreview from "./SlidePreview";
import {
  templateDefaults,
  defaultStyles,
  type TemplateType,
} from "@/lib/template-defaults";

const TEMPLATE_LABELS: Record<TemplateType, string> = {
  cover: "Cover",
  "content-list": "Content List",
  cta: "CTA",
};

interface CarouselEditorProps {
  slides: SlideData[];
  onChange: (slides: SlideData[]) => void;
}

function createSlide(templateType: TemplateType): SlideData {
  return {
    templateType,
    content: { ...templateDefaults[templateType] },
    styles: { ...defaultStyles },
  };
}

export default function CarouselEditor({ slides, onChange }: CarouselEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addTemplateType, setAddTemplateType] = useState<TemplateType>("cover");

  const currentSlide = slides[selectedIndex] || null;

  const handleAddSlide = useCallback(() => {
    const newSlides = [...slides, createSlide(addTemplateType)];
    onChange(newSlides);
    setSelectedIndex(newSlides.length - 1);
  }, [slides, onChange, addTemplateType]);

  const handleDeleteSlide = useCallback(
    (index: number) => {
      if (slides.length <= 1) return;
      const newSlides = slides.filter((_, i) => i !== index);
      onChange(newSlides);
      if (selectedIndex >= newSlides.length) {
        setSelectedIndex(Math.max(0, newSlides.length - 1));
      } else if (selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1);
      }
    },
    [slides, onChange, selectedIndex]
  );

  const handleMoveSlide = useCallback(
    (index: number, direction: -1 | 1) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= slides.length) return;
      const newSlides = [...slides];
      [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
      onChange(newSlides);
      if (selectedIndex === index) {
        setSelectedIndex(newIndex);
      } else if (selectedIndex === newIndex) {
        setSelectedIndex(index);
      }
    },
    [slides, onChange, selectedIndex]
  );

  const handleSlideChange = useCallback(
    (updatedSlide: SlideData) => {
      const newSlides = [...slides];
      newSlides[selectedIndex] = updatedSlide;
      onChange(newSlides);
    },
    [slides, onChange, selectedIndex]
  );

  return (
    <div className="space-y-4">
      {/* Thumbnail Strip */}
      <div className="border border-border rounded-xl bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-foreground flex-1">
            Slides ({slides.length})
          </h3>
          <div className="flex items-center gap-2">
            <Select
              value={addTemplateType}
              onValueChange={(v) => { if (v) setAddTemplateType(v as TemplateType); }}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TEMPLATE_LABELS) as TemplateType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {TEMPLATE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddSlide}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Slide
            </Button>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`flex-shrink-0 group relative cursor-pointer rounded-lg transition-all ${
                selectedIndex === index
                  ? "ring-2 ring-primary shadow-lg"
                  : "ring-1 ring-border hover:ring-primary/50"
              }`}
              onClick={() => setSelectedIndex(index)}
            >
              <SlidePreview
                templateType={slide.templateType}
                content={slide.content}
                styles={slide.styles}
                size={120}
              />

              {/* Slide number badge */}
              <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold rounded-md px-1.5 py-0.5">
                {index + 1}
              </div>

              {/* Template type label */}
              <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[9px] font-medium rounded-md px-1.5 py-0.5 text-center truncate">
                {TEMPLATE_LABELS[slide.templateType as TemplateType] || slide.templateType}
              </div>

              {/* Controls overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveSlide(index, -1);
                  }}
                  disabled={index === 0}
                  className="p-1 bg-white/20 rounded hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move left"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSlide(index);
                  }}
                  disabled={slides.length <= 1}
                  className="p-1 bg-red-500/60 rounded hover:bg-red-500/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Delete slide"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveSlide(index, 1);
                  }}
                  disabled={index === slides.length - 1}
                  className="p-1 bg-white/20 rounded hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move right"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor for Selected Slide */}
      {currentSlide && (
        <SlideEditor slide={currentSlide} onChange={handleSlideChange} />
      )}
    </div>
  );
}

export { createSlide };
