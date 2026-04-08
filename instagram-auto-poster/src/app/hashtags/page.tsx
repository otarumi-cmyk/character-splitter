"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Copy,
  Pencil,
  Check,
  X,
} from "lucide-react";

type HashtagSet = {
  id: number;
  name: string;
  hashtags: string;
  createdAt: string;
  updatedAt: string;
};

export default function HashtagsPage() {
  const [sets, setSets] = useState<HashtagSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newHashtags, setNewHashtags] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editHashtags, setEditHashtags] = useState("");

  useEffect(() => {
    fetchSets();
  }, []);

  async function fetchSets() {
    try {
      const res = await fetch("/api/hashtags");
      if (res.ok) {
        const data = await res.json();
        setSets(data);
      }
    } catch {
      toast.error("ハッシュタグセットの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim() || !newHashtags.trim()) {
      toast.error("名前とハッシュタグを入力してください");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, hashtags: newHashtags }),
      });
      if (!res.ok) throw new Error("作成に失敗しました");
      const created = await res.json();
      setSets((prev) => [created, ...prev]);
      setNewName("");
      setNewHashtags("");
      toast.success("ハッシュタグセットを作成しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(id: number) {
    try {
      const res = await fetch(`/api/hashtags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, hashtags: editHashtags }),
      });
      if (!res.ok) throw new Error("更新に失敗しました");
      const updated = await res.json();
      setSets((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditingId(null);
      toast.success("更新しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("このハッシュタグセットを削除してもよろしいですか？")) return;
    try {
      const res = await fetch(`/api/hashtags/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      setSets((prev) => prev.filter((s) => s.id !== id));
      toast.success("削除しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    }
  }

  function handleCopy(hashtags: string) {
    const parsed: string[] = (() => {
      try {
        return JSON.parse(hashtags);
      } catch {
        return hashtags.split(/[\s,]+/).filter(Boolean);
      }
    })();
    const text = parsed.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
    navigator.clipboard.writeText(text);
    toast.success("クリップボードにコピーしました");
  }

  function startEdit(set: HashtagSet) {
    setEditingId(set.id);
    setEditName(set.name);
    const parsed: string[] = (() => {
      try {
        return JSON.parse(set.hashtags);
      } catch {
        return [set.hashtags];
      }
    })();
    setEditHashtags(parsed.join("\n"));
  }

  function parseHashtags(raw: string): string[] {
    return raw
      .split(/[\n,]+/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ハッシュタグ管理</h1>

      <Card>
        <CardHeader>
          <CardTitle>新しいハッシュタグセット</CardTitle>
          <CardDescription>
            よく使うハッシュタグのセットを作成して再利用できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setName">セット名</Label>
            <Input
              id="setName"
              placeholder="例: 転職系"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setHashtags">
              ハッシュタグ（改行またはカンマ区切り）
            </Label>
            <Textarea
              id="setHashtags"
              placeholder={"転職\nキャリア\n仕事術\n転職活動"}
              rows={4}
              value={newHashtags}
              onChange={(e) => setNewHashtags(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            作成
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          保存済みセット ({sets.length})
        </h2>
        {sets.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center">
            <p className="text-muted-foreground">
              ハッシュタグセットがありません
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((set) => {
              const tags: string[] = (() => {
                try {
                  return JSON.parse(set.hashtags);
                } catch {
                  return set.hashtags.split(/[\s,]+/).filter(Boolean);
                }
              })();
              const isEditing = editingId === set.id;

              return (
                <Card key={set.id}>
                  <CardHeader>
                    {isEditing ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-sm font-medium"
                      />
                    ) : (
                      <CardTitle>{set.name}</CardTitle>
                    )}
                    <CardDescription>{tags.length}個のタグ</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={editHashtags}
                        onChange={(e) => setEditHashtags(e.target.value)}
                        rows={4}
                        className="text-sm"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 10).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            #{tag.replace(/^#/, "")}
                          </Badge>
                        ))}
                        {tags.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{tags.length - 10}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="flex w-full gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(set.id)}
                          >
                            <Check className="size-3" />
                            保存
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="size-3" />
                            取消
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(set.hashtags)}
                          >
                            <Copy className="size-3" />
                            コピー
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(set)}
                          >
                            <Pencil className="size-3" />
                            編集
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(set.id)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
