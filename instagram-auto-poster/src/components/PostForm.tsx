"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, Send, Download, Plus, Trash2, GripVertical } from "lucide-react";

type Slide = {
  slideOrder: number;
  templateType: string;
  content: Record<string, string>;
};

type PostFormProps = {
  initialData?: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onPublish: (data: Record<string, unknown>) => Promise<void>;
  onDownload: (data: Record<string, unknown>) => Promise<void>;
  saving?: boolean;
};

export function PostForm({
  initialData,
  onSave,
  onPublish,
  onDownload,
  saving,
}: PostFormProps) {
  const [title, setTitle] = useState(
    (initialData?.title as string) || ""
  );
  const [caption, setCaption] = useState(
    (initialData?.caption as string) || ""
  );
  const [hashtags, setHashtags] = useState(
    (initialData?.hashtags as string) || ""
  );
  const [slides, setSlides] = useState<Slide[]>(() => {
    if (initialData?.slides && Array.isArray(initialData.slides)) {
      return (initialData.slides as Array<Record<string, unknown>>).map((s) => ({
        slideOrder: s.slideOrder as number,
        templateType: (s.templateType as string) || "cover",
        content: (() => {
          try {
            return typeof s.content === "string"
              ? JSON.parse(s.content)
              : (s.content as Record<string, string>) || {};
          } catch {
            return {};
          }
        })(),
      }));
    }
    return [
      { slideOrder: 0, templateType: "cover", content: {} },
      { slideOrder: 1, templateType: "content-list", content: {} },
      { slideOrder: 2, templateType: "cta", content: {} },
    ];
  });

  function getFormData(): Record<string, unknown> {
    return {
      title,
      caption,
      hashtags,
      slides: slides.map((s) => ({
        slideOrder: s.slideOrder,
        templateType: s.templateType,
        content: JSON.stringify(s.content),
      })),
    };
  }

  function addSlide() {
    setSlides((prev) => [
      ...prev,
      {
        slideOrder: prev.length,
        templateType: "content-list",
        content: {},
      },
    ]);
  }

  function removeSlide(index: number) {
    setSlides((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, slideOrder: i }))
    );
  }

  function updateSlide(index: number, field: string, value: string) {
    setSlides((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function updateSlideContent(index: number, key: string, value: string) {
    setSlides((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, content: { ...s.content, [key]: value } }
          : s
      )
    );
  }

  const templateFields: Record<string, string[]> = {
    cover: ["title", "subtitle", "brandName"],
    "content-list": [
      "headerTitle",
      "item1Title",
      "item1Desc",
      "item2Title",
      "item2Desc",
      "item3Title",
      "item3Desc",
      "item4Title",
      "item4Desc",
      "item5Title",
      "item5Desc",
    ],
    cta: ["ctaText", "profileText", "brandName"],
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>投稿情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              placeholder="投稿のタイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caption">キャプション</Label>
            <Textarea
              id="caption"
              placeholder="投稿のキャプション..."
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hashtags">ハッシュタグ</Label>
            <Textarea
              id="hashtags"
              placeholder="#転職 #キャリア #仕事術"
              rows={2}
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            スライド ({slides.length}枚)
          </h2>
          <Button variant="outline" size="sm" onClick={addSlide}>
            <Plus className="size-4" />
            スライドを追加
          </Button>
        </div>

        {slides.map((slide, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm">
                    スライド {index + 1}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={slide.templateType}
                    onValueChange={(val: string | null) => {
                      if (val) updateSlide(index, "templateType", val);
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">カバー</SelectItem>
                      <SelectItem value="content-list">
                        コンテンツリスト
                      </SelectItem>
                      <SelectItem value="cta">CTA</SelectItem>
                    </SelectContent>
                  </Select>
                  {slides.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeSlide(index)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {(templateFields[slide.templateType] || []).map((field) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs">{field}</Label>
                    <Input
                      value={slide.content[field] || ""}
                      onChange={(e) =>
                        updateSlideContent(index, field, e.target.value)
                      }
                      placeholder={field}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => onSave(getFormData())} disabled={saving}>
          <Save className="size-4" />
          保存
        </Button>
        <Button
          variant="secondary"
          onClick={() => onDownload(getFormData())}
        >
          <Download className="size-4" />
          画像ダウンロード
        </Button>
        <Button
          variant="outline"
          onClick={() => onPublish(getFormData())}
          disabled={saving}
        >
          <Send className="size-4" />
          公開
        </Button>
      </div>
    </div>
  );
}
