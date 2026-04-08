"use client";

import { Badge } from "@/components/ui/badge";

type PostStatus = "draft" | "scheduled" | "published" | "error";

const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-muted text-muted-foreground border-border",
  },
  scheduled: {
    label: "Scheduled",
    className:
      "bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800",
  },
  published: {
    label: "Published",
    className:
      "bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-800",
  },
  error: {
    label: "Error",
    className:
      "bg-red-500/10 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800",
  },
};

interface StatusBadgeProps {
  status: PostStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <Badge
      variant="outline"
      className={config.className}
    >
      {config.label}
    </Badge>
  );
}
