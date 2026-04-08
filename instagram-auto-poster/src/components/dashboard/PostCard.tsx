"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Edit, Trash2, Send, Image } from "lucide-react";
import StatusBadge from "./StatusBadge";
import SlidePreview from "@/components/editor/SlidePreview";

interface PostSlideData {
  templateType: string;
  content: Record<string, string>;
  styles?: Record<string, string>;
}

interface PostData {
  id: number;
  title: string;
  status: "draft" | "scheduled" | "published" | "error";
  caption: string;
  hashtags: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  slides: PostSlideData[];
}

interface PostCardProps {
  post: PostData;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onPublish?: (id: number) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PostCard({
  post,
  onEdit,
  onDelete,
  onPublish,
}: PostCardProps) {
  const firstSlide = post.slides[0];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative aspect-square bg-muted flex items-center justify-center">
          {firstSlide ? (
            <SlidePreview
              templateType={firstSlide.templateType}
              content={firstSlide.content}
              styles={firstSlide.styles}
              size={280}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Image className="w-10 h-10" />
              <span className="text-xs">No slides</span>
            </div>
          )}

          {/* Slide count badge */}
          {post.slides.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold rounded-md px-2 py-0.5">
              {post.slides.length} slides
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-1 flex-1">
            {post.title || "Untitled Post"}
          </h3>
          <StatusBadge status={post.status} />
        </div>

        {post.caption && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {post.caption}
          </p>
        )}

        <div className="text-xs text-muted-foreground">
          {post.status === "scheduled" && post.scheduledAt && (
            <span>Scheduled: {formatDate(post.scheduledAt)}</span>
          )}
          {post.status === "published" && post.publishedAt && (
            <span>Published: {formatDate(post.publishedAt)}</span>
          )}
          {(post.status === "draft" || post.status === "error") && (
            <span>Created: {formatDate(post.createdAt)}</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 flex gap-2">
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(post.id)}
            className="flex-1 gap-1.5 text-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </Button>
        )}
        {onPublish && post.status !== "published" && (
          <Button
            size="sm"
            onClick={() => onPublish(post.id)}
            className="flex-1 gap-1.5 text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            Publish
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(post.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
