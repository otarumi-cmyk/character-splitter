import Link from "next/link";
import { prisma } from "@/lib/db";
import { PostList } from "@/components/PostList";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const where = status && status !== "all" ? { status } : {};
  const posts = await prisma.post.findMany({
    where,
    include: { slides: { orderBy: { slideOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  const counts = {
    all: await prisma.post.count(),
    draft: await prisma.post.count({ where: { status: "draft" } }),
    scheduled: await prisma.post.count({ where: { status: "scheduled" } }),
    published: await prisma.post.count({ where: { status: "published" } }),
  };

  const currentFilter = status || "all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">投稿一覧</h1>
        <Link
          href="/posts/new"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          + 新規投稿
        </Link>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(
          [
            { key: "all", label: "すべて" },
            { key: "draft", label: "下書き" },
            { key: "scheduled", label: "予約済み" },
            { key: "published", label: "公開済み" },
          ] as const
        ).map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/" : `/?status=${tab.key}`}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              currentFilter === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="text-xs text-muted-foreground">
              ({counts[tab.key]})
            </span>
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            投稿がありません
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            「新規投稿」ボタンから最初の投稿を作成しましょう
          </p>
          <Link
            href="/posts/new"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            + 新規投稿を作成
          </Link>
        </div>
      ) : (
        <PostList posts={posts} />
      )}
    </div>
  );
}
