"use client";

import { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import ColorPicker from "./ColorPicker";
import SlidePreview from "./SlidePreview";
import {
  templateDefaults,
  defaultStyles,
  type TemplateType,
  getTemplateFields,
} from "@/lib/template-defaults";

export interface SlideData {
  templateType: TemplateType;
  content: Record<string, string>;
  styles: Record<string, string>;
}

const TEMPLATE_LABELS: Record<TemplateType, string> = {
  cover: "Cover (Headline)",
  "content-list": "Content List (5 Items)",
  cta: "CTA (Call to Action)",
};

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  subtitle: "Subtitle",
  brandName: "Brand Name",
  headerTitle: "Header Title",
  item1Title: "Item 1 Title",
  item1Desc: "Item 1 Description",
  item2Title: "Item 2 Title",
  item2Desc: "Item 2 Description",
  item3Title: "Item 3 Title",
  item3Desc: "Item 3 Description",
  item4Title: "Item 4 Title",
  item4Desc: "Item 4 Description",
  item5Title: "Item 5 Title",
  item5Desc: "Item 5 Description",
  ctaText: "CTA Text",
  profileText: "Profile Text",
};

const STYLE_LABELS: Record<string, string> = {
  "--primary-color": "Primary Color",
  "--secondary-color": "Secondary Color",
  "--bg-color": "Background Color",
  "--text-color": "Text Color",
};

interface SlideEditorProps {
  slide: SlideData;
  onChange: (slide: SlideData) => void;
}

export default function SlideEditor({ slide, onChange }: SlideEditorProps) {
  const fields = useMemo(
    () => getTemplateFields(slide.templateType),
    [slide.templateType]
  );

  const handleTemplateChange = useCallback(
    (type: string | null) => {
      if (!type) return;
      const newType = type as TemplateType;
      const defaults = templateDefaults[newType];
      onChange({
        ...slide,
        templateType: newType,
        content: { ...defaults },
      });
    },
    [slide, onChange]
  );

  const handleContentChange = useCallback(
    (field: string, value: string) => {
      onChange({
        ...slide,
        content: { ...slide.content, [field]: value },
      });
    },
    [slide, onChange]
  );

  const handleStyleChange = useCallback(
    (key: string, value: string) => {
      onChange({
        ...slide,
        styles: { ...slide.styles, [key]: value },
      });
    },
    [slide, onChange]
  );

  const isLongField = (field: string): boolean => {
    return field === "title" || field === "ctaText" || field.endsWith("Desc");
  };

  return (
    <div className="flex gap-4 h-full min-h-[600px]">
      {/* Left Sidebar - Template & Content */}
      <div className="w-72 flex-shrink-0 overflow-y-auto border border-border rounded-xl bg-card p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Template Type
          </h3>
          <Select
            value={slide.templateType}
            onValueChange={handleTemplateChange}
          >
            <SelectTrigger className="w-full">
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
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Content</h3>
          {fields.map((field) => (
            <div key={field} className="space-y-1">
              <Label
                htmlFor={`field-${field}`}
                className="text-xs text-muted-foreground"
              >
                {FIELD_LABELS[field] || field}
              </Label>
              {isLongField(field) ? (
                <Textarea
                  id={`field-${field}`}
                  value={slide.content[field] || ""}
                  onChange={(e) => handleContentChange(field, e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
              ) : (
                <Input
                  id={`field-${field}`}
                  value={slide.content[field] || ""}
                  onChange={(e) => handleContentChange(field, e.target.value)}
                  className="text-sm"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Center - Preview */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-xl border border-border p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Live Preview (1:1)
          </div>
          <SlidePreview
            templateType={slide.templateType}
            content={slide.content}
            styles={slide.styles}
            size={480}
          />
          <div className="text-xs text-muted-foreground">
            1080 x 1080px
          </div>
        </div>
      </div>

      {/* Right Sidebar - Styles */}
      <div className="w-64 flex-shrink-0 overflow-y-auto border border-border rounded-xl bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Style</h3>

        {Object.entries(STYLE_LABELS).map(([key, label]) => (
          <ColorPicker
            key={key}
            label={label}
            value={slide.styles[key] || defaultStyles[key as keyof typeof defaultStyles] || "#000000"}
            onChange={(color) => handleStyleChange(key, color)}
          />
        ))}

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Themes
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...slide,
                  styles: {
                    "--primary-color": "#6C5CE7",
                    "--secondary-color": "#FD79A8",
                    "--bg-color": "#0F0A1A",
                    "--text-color": "#FFFFFF",
                  },
                })
              }
              className="px-3 py-2 text-xs rounded-lg border border-border bg-[#0F0A1A] text-white hover:ring-2 hover:ring-ring/50 transition-all"
            >
              Dark Purple
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...slide,
                  styles: {
                    "--primary-color": "#3b82f6",
                    "--secondary-color": "#06b6d4",
                    "--bg-color": "#0c1222",
                    "--text-color": "#FFFFFF",
                  },
                })
              }
              className="px-3 py-2 text-xs rounded-lg border border-border bg-[#0c1222] text-white hover:ring-2 hover:ring-ring/50 transition-all"
            >
              Ocean Blue
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...slide,
                  styles: {
                    "--primary-color": "#f97316",
                    "--secondary-color": "#eab308",
                    "--bg-color": "#1a0f08",
                    "--text-color": "#FFFFFF",
                  },
                })
              }
              className="px-3 py-2 text-xs rounded-lg border border-border bg-[#1a0f08] text-white hover:ring-2 hover:ring-ring/50 transition-all"
            >
              Warm Sunset
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...slide,
                  styles: {
                    "--primary-color": "#22c55e",
                    "--secondary-color": "#06b6d4",
                    "--bg-color": "#0a1a14",
                    "--text-color": "#FFFFFF",
                  },
                })
              }
              className="px-3 py-2 text-xs rounded-lg border border-border bg-[#0a1a14] text-white hover:ring-2 hover:ring-ring/50 transition-all"
            >
              Fresh Green
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...slide,
                  styles: {
                    "--primary-color": "#6366f1",
                    "--secondary-color": "#ec4899",
                    "--bg-color": "#ffffff",
                    "--text-color": "#1e293b",
                  },
                })
              }
              className="px-3 py-2 text-xs rounded-lg border border-border bg-white text-slate-800 hover:ring-2 hover:ring-ring/50 transition-all"
            >
              Light Mode
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...slide,
                  styles: {
                    "--primary-color": "#f43f5e",
                    "--secondary-color": "#f97316",
                    "--bg-color": "#18181b",
                    "--text-color": "#FFFFFF",
                  },
                })
              }
              className="px-3 py-2 text-xs rounded-lg border border-border bg-[#18181b] text-white hover:ring-2 hover:ring-ring/50 transition-all"
            >
              Bold Red
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
