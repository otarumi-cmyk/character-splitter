"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type Settings = {
  openaiApiKey: string;
  accessToken: string;
  accountId: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    openaiApiKey: "",
    accessToken: "",
    accountId: "",
    brandName: "",
    primaryColor: "#6366f1",
    secondaryColor: "#ec4899",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  function handleChange(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("保存に失敗しました");
      toast.success("設定を保存しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setConnectionStatus("idle");
    try {
      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: settings.accessToken,
          accountId: settings.accountId,
        }),
      });
      if (res.ok) {
        setConnectionStatus("success");
        toast.success("接続に成功しました");
      } else {
        setConnectionStatus("error");
        toast.error("接続に失敗しました");
      }
    } catch {
      setConnectionStatus("error");
      toast.error("接続テストに失敗しました");
    } finally {
      setTesting(false);
    }
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
      <h1 className="text-2xl font-bold">設定</h1>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI API設定</CardTitle>
          <CardDescription>
            AI自動生成機能に使用するAPIキーを設定します（gpt-4o-mini使用）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openaiApiKey">OpenAI APIキー</Label>
            <Input
              id="openaiApiKey"
              type="password"
              placeholder="sk-..."
              value={settings.openaiApiKey}
              onChange={(e) => handleChange("openaiApiKey", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              OpenAIのダッシュボードからAPIキーを取得してください
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instagram API設定</CardTitle>
          <CardDescription>
            Instagram Graph APIの認証情報を設定します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessToken">アクセストークン</Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="EAAxxxxxxxx..."
              value={settings.accessToken}
              onChange={(e) => handleChange("accessToken", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountId">InstagramアカウントID</Label>
            <Input
              id="accountId"
              placeholder="17841400000000000"
              value={settings.accountId}
              onChange={(e) => handleChange("accountId", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={
                testing || !settings.accessToken || !settings.accountId
              }
            >
              {testing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : connectionStatus === "success" ? (
                <CheckCircle className="size-4 text-green-500" />
              ) : connectionStatus === "error" ? (
                <XCircle className="size-4 text-red-500" />
              ) : null}
              接続テスト
            </Button>
            {connectionStatus === "success" && (
              <span className="text-sm text-green-600">接続成功</span>
            )}
            {connectionStatus === "error" && (
              <span className="text-sm text-red-600">接続失敗</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ブランド設定</CardTitle>
          <CardDescription>
            投稿に使用するデフォルトのブランド情報
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brandName">ブランド名 / アカウント名</Label>
            <Input
              id="brandName"
              placeholder="@your_account"
              value={settings.brandName}
              onChange={(e) => handleChange("brandName", e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">プライマリカラー</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="primaryColor"
                  value={settings.primaryColor}
                  onChange={(e) =>
                    handleChange("primaryColor", e.target.value)
                  }
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) =>
                    handleChange("primaryColor", e.target.value)
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">セカンダリカラー</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="secondaryColor"
                  value={settings.secondaryColor}
                  onChange={(e) =>
                    handleChange("secondaryColor", e.target.value)
                  }
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <Input
                  value={settings.secondaryColor}
                  onChange={(e) =>
                    handleChange("secondaryColor", e.target.value)
                  }
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          設定を保存
        </Button>
      </div>
    </div>
  );
}
