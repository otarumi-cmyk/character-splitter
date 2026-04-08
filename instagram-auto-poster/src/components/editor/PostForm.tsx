"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Save,
  Clock,
  Send,
  Download,
  Hash,
} from "lucide-react";
import CarouselEditor, { createSlide } from "./CarouselEditor";
import { type SlideData } from "./SlideEditor";

const CAPTION_MAX_LENGTH = 2200;

interface HashtagSetOption {
  id: number;
  name: string;
  hashtags: string[];
}

export interface PostFormData {
  title: string;
  caption: string;
  hashtags: string;
  slides: SlideData[];
  scheduledAt: string | null;
  status: "draft" | "scheduled" | "published";
}

interface PostFormProps {
  post?: PostFormData;
  hashtagSets?: HashtagSetOption[];
  onSave: (data: PostFormData) => void;
  onDownloadImages?: () => void;
}

export default function PostForm({
  post,
  hashtagSets = [],
  onSave,
  onDownloadImages,
}: PostFormProps) {
  const [title, setTitle] = useState(post?.title || "");
  const [caption, setCaption] = useState(post?.caption || "");
  const [hashtags, setHashtags] = useState(post?.hashtags || "");
  const [slides, setSlides] = useState<SlideData[]>(
    post?.slides || [createSlide("cover")]
  );
  const [scheduledAt, setScheduledAt] = useState(post?.scheduledAt || "");

  const captionCount = useMemo(() => caption.length, [caption]);

  const handleHashtagSetSelect = useCallback(
    (setId: string | null) => {
      if (!setId) return;
      const selected = hashtagSets.find((s) => s.id.toString() === setId);
      if (selected) {
        const existing = hashtags.trim();
        const newTags = selected.hashtags.join(" ");
        setHashtags(existing ? `${existing} ${newTags}` : newTags);
      }
    },
    [hashtagSets, hashtags]
  );

  const buildFormData = useCallback(
    (status: "draft" | "scheduled" | "published"): PostFormData => ({
      title,
      caption,
      hashtags,
      slides,
      scheduledAt: scheduledAt || null,
      status,
    }),
    [title, caption, hashtags, slides, scheduledAt]
  );

  const handleSaveDraft = useCallback(() => {
    onSave(buildFormData("draft"));
  }, [onSave, buildFormData]);

  const handleSchedule = useCallback(() => {
    if (!scheduledAt) {
      alert("Please select a schedule date and time.");
      return;
    }
    onSave(buildFormData("scheduled"));
  }, [onSave, buildFormData, scheduledAt]);

  const handlePublishNow = useCallback(() => {
    onSave(buildFormData("published"));
  }, [onSave, buildFormData]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="post-title" className="text-sm font-semibold">
          Post Title
        </Label>
        <Input
          id="post-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Internal title for this post..."
          className="text-base"
        />
      </div>

      <Separator />

      {/* Carousel Editor */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Slides</Label>
        <CarouselEditor slides={slides} onChange={setSlides} />
      </div>

      <Separator />

      {/* Caption */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="post-caption" className="text-sm font-semibold">
            Caption
          </Label>
          <span
            className={`text-xs ${
              captionCount > CAPTION_MAX_LENGTH
                ? "text-destructive font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {captionCount} / {CAPTION_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          id="post-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write your Instagram caption here..."
          rows={5}
          className="resize-y"
        />
      </div>

      {/* Hashtags */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="post-hashtags" className="text-sm font-semibold">
            Hashtags
          </Label>
        </div>
        <div className="flex gap-2">
          <Input
            id="post-hashtags"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#hashtag1 #hashtag2 #hashtag3"
            className="flex-1"
          />
          {hashtagSets.length > 0 && (
            <Select onValueChange={handleHashtagSetSelect}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Quick add set..." />
              </SelectTrigger>
              <SelectContent>
                {hashtagSets.map((set) => (
                  <SelectItem key={set.id} value={set.id.toString()}>
                    {set.name} ({set.hashtags.length} tags)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Separate hashtags with spaces. Max 30 hashtags recommended.
        </p>
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="post-schedule" className="text-sm font-semibold">
            Schedule (optional)
          </Label>
        </div>
        <Input
          id="post-schedule"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-64"
        />
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Save as Draft
        </Button>
        <Button
          variant="outline"
          onClick={handleSchedule}
          className="gap-2"
          disabled={!scheduledAt}
        >
          <Clock className="w-4 h-4" />
          Schedule
        </Button>
        <Button
          onClick={handlePublishNow}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          Publish Now
        </Button>
        {onDownloadImages && (
          <Button
            variant="secondary"
            onClick={onDownloadImages}
            className="gap-2 ml-auto"
          >
            <Download className="w-4 h-4" />
            Download Images
          </Button>
        )}
      </div>
    </div>
  );
}
