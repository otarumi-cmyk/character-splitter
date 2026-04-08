"use client";

import { useState } from "react";
import {
  templateDefaults,
  defaultStyles,
  type TemplateType,
} from "@/lib/template-defaults";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Palette, Type, Image as ImageIcon } from "lucide-react";

const templateInfo: Record<
  TemplateType,
  { label: string; description: string; icon: typeof Palette }
> = {
  cover: {
    label: "カバー",
    description: "投稿の表紙スライド。タイトルとサブタイトルを表示",
    icon: ImageIcon,
  },
  "content-list": {
    label: "コンテンツリスト",
    description: "5つのポイントをリスト形式で表示するスライド",
    icon: Type,
  },
  cta: {
    label: "CTA",
    description: "フォロー促進などのアクション喚起スライド",
    icon: Palette,
  },
};

export default function TemplatesPage() {
  const [styles, setStyles] = useState<Record<string, string>>(defaultStyles);
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>("cover");

  function handleStyleChange(key: string, value: string) {
    setStyles((prev) => ({ ...prev, [key]: value }));
  }

  function handleSaveStyles() {
    toast.success("スタイル設定を保存しました");
  }

  function handleResetStyles() {
    setStyles(defaultStyles);
    toast.info("スタイルをデフォルトに戻しました");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">テンプレート管理</h1>
      </div>

      <Tabs
        defaultValue="cover"
        onValueChange={(val) => setActiveTemplate(val as TemplateType)}
      >
        <TabsList>
          {(Object.keys(templateInfo) as TemplateType[]).map((type) => {
            const info = templateInfo[type];
            return (
              <TabsTrigger key={type} value={type}>
                <info.icon className="size-4" />
                {info.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(templateInfo) as TemplateType[]).map((type) => {
          const info = templateInfo[type];
          const fields = templateDefaults[type];

          return (
            <TabsContent key={type} value={type}>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{info.label}テンプレート</CardTitle>
                    <CardDescription>{info.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">
                        デフォルトコンテンツ
                      </h3>
                      {Object.entries(fields).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <Label htmlFor={`${type}-${key}`} className="text-xs">
                            {key}
                          </Label>
                          <Input
                            id={`${type}-${key}`}
                            defaultValue={value}
                            readOnly
                            className="bg-muted text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>プレビュー</CardTitle>
                    <CardDescription>
                      テンプレートのプレビュー表示
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="flex aspect-square items-center justify-center rounded-lg border bg-gradient-to-br text-center"
                      style={{
                        background: `linear-gradient(135deg, ${styles["--primary-color"]}, ${styles["--secondary-color"]})`,
                        color: "#fff",
                      }}
                    >
                      <div className="space-y-2 p-6">
                        {type === "cover" && (() => {
                          const f = fields as typeof templateDefaults.cover;
                          return (
                            <>
                              <p className="text-2xl font-bold whitespace-pre-line">
                                {f.title}
                              </p>
                              <p className="text-sm opacity-80">
                                {f.subtitle}
                              </p>
                            </>
                          );
                        })()}
                        {type === "content-list" && (() => {
                          const f = fields as typeof templateDefaults["content-list"];
                          return (
                            <>
                              <p className="text-lg font-bold">
                                {f.headerTitle}
                              </p>
                              <ul className="space-y-1 text-left text-xs">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <li key={n}>
                                    {n}.{" "}
                                    {f[`item${n}Title` as keyof typeof f]}
                                  </li>
                                ))}
                              </ul>
                            </>
                          );
                        })()}
                        {type === "cta" && (() => {
                          const f = fields as typeof templateDefaults.cta;
                          return (
                            <>
                              <p className="text-xl font-bold whitespace-pre-line">
                                {f.ctaText}
                              </p>
                              <p className="text-sm opacity-80">
                                {f.profileText}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>デフォルトスタイル設定</CardTitle>
          <CardDescription>
            すべてのテンプレートに適用されるデフォルトのカラー設定
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(styles).map(([key, value]) => {
              const label = key.replace("--", "").replace(/-/g, " ");
              return (
                <div key={key} className="space-y-1">
                  <Label htmlFor={key} className="text-xs capitalize">
                    {label}
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id={key}
                      value={value}
                      onChange={(e) => handleStyleChange(key, e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border"
                    />
                    <Input
                      value={value}
                      onChange={(e) => handleStyleChange(key, e.target.value)}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleSaveStyles}>保存</Button>
            <Button variant="outline" onClick={handleResetStyles}>
              リセット
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
