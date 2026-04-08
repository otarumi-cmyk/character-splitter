"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";

type Post = {
  id: number;
  title: string;
  caption: string;
  hashtags: string;
  status: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  slides: { id: number; slideOrder: number; templateType: string }[];
};

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "下書き", variant: "secondary" },
  scheduled: { label: "予約済み", variant: "outline" },
  published: { label: "公開済み", variant: "default" },
  error: { label: "エラー", variant: "destructive" },
};

export function PostList({ posts }: { posts: Post[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => {
        const config = statusConfig[post.status] || statusConfig.draft;
        return (
          <Link key={post.id} href={`/posts/${post.id}`}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="line-clamp-1">{post.title}</CardTitle>
                <CardDescription>
                  スライド: {post.slides.length}枚
                </CardDescription>
                <CardAction>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                {post.caption && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {post.caption}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  更新:{" "}
                  {format(new Date(post.updatedAt), "yyyy/MM/dd HH:mm", {
                    locale: ja,
                  })}
                </p>
                {post.scheduledAt && (
                  <p className="text-xs text-muted-foreground">
                    予約:{" "}
                    {format(new Date(post.scheduledAt), "yyyy/MM/dd HH:mm", {
                      locale: ja,
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
