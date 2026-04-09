"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import CanvasEditor, {
  type SlideCanvasData,
} from "@/components/editor/CanvasEditor";

interface ScenarioInfo {
  id: number;
  name: string;
  slideType: string;
}

const TYPE_COLORS: Record<string, string> = {
  cover: "bg-purple-500",
  list: "bg-blue-500",
  comparison: "bg-orange-500",
  checklist: "bg-green-500",
  cta: "bg-pink-500",
  "point-card": "bg-teal-500",
  "company-card": "bg-indigo-500",
  deadline: "bg-red-500",
  "tab-checklist": "bg-cyan-500",
  qa: "bg-amber-500",
  ranking: "bg-emerald-500",
};

export default function TestAbabaPage() {
  const [data, setData] = useState<SlideCanvasData | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [currentScenario, setCurrentScenario] = useState<ScenarioInfo | null>(null);
  const [scenarioId, setScenarioId] = useState(1);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFromSaved, setIsFromSaved] = useState(false);
  const router = useRouter();

  // 起動時に古い壊れたデータだけクリア（v2は残す）
  useEffect(() => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("test-ababa-coords-")) localStorage.removeItem(k);
    }
  }, []);

  const savedKey = (id: number) => `test-ababa-v2-${id}`;

  const loadScenario = useCallback(async (id: number) => {
    setLoading(true);
    try {
      // APIからシナリオ一覧を常に取得
      const res = await fetch("/api/ai-generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: id }),
      });
      const result = await res.json();
      if (result.scenarios) setScenarios(result.scenarios);
      if (result.scenario) setCurrentScenario(result.scenario);

      // 手動保存があればそちらを使う
      const saved = localStorage.getItem(savedKey(id));
      if (saved) {
        try {
          setData(JSON.parse(saved) as SlideCanvasData);
          setIsFromSaved(true);
          return;
        } catch { /* 無効データは無視 */ }
      }

      setData({
        elements: result.elements.map((el: Record<string, unknown>, i: number) => ({
          ...el,
          id: (el.id as string) || crypto.randomUUID(),
          rotation: (el.rotation as number) || 0,
          zIndex: (el.zIndex as number) || i + 1,
          opacity: (el.opacity as number) ?? 1,
        })),
        background: {
          type: result.background.type as "solid" | "gradient",
          color: result.background.color,
          gradient: result.background.gradient,
        },
      });
      setIsFromSaved(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScenario(scenarioId);
  }, [scenarioId, loadScenario]);

  return (
    <div className="flex h-screen">
      {/* 左サイドバー: シナリオ一覧 */}
      <div className="w-72 bg-gray-50 border-r overflow-y-auto flex-shrink-0">
        <div className="p-3 border-b bg-white sticky top-0 z-10">
          <h2 className="font-bold text-sm text-gray-700">20 テストシナリオ</h2>
          <p className="text-xs text-gray-400 mt-1">クリックで切り替え</p>
        </div>
        <div className="p-2 space-y-1">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => setScenarioId(s.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                scenarioId === s.id
                  ? "bg-teal-50 border-2 border-teal-400 shadow-sm"
                  : "bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-mono w-5">
                  {String(s.id).padStart(2, "0")}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-white text-[10px] font-bold ${
                    TYPE_COLORS[s.slideType] || "bg-gray-400"
                  }`}
                >
                  {s.slideType}
                </span>
              </div>
              <p className={`mt-1 pl-7 font-medium ${scenarioId === s.id ? "text-teal-700" : "text-gray-700"}`}>
                {s.name.split(" — ")[1] || s.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* メインエリア: プレビュー */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-lg font-bold text-gray-800">
            #{currentScenario?.id || scenarioId}
          </h1>
          {currentScenario && (
            <>
              <span
                className={`px-2 py-1 rounded text-white text-xs font-bold ${
                  TYPE_COLORS[currentScenario.slideType] || "bg-gray-400"
                }`}
              >
                {currentScenario.slideType}
              </span>
              <span className="text-gray-600 text-sm">{currentScenario.name}</span>
            </>
          )}
          {loading && <span className="text-xs text-gray-400 animate-pulse">読み込み中...</span>}
        </div>

        {/* ナビ */}
        <div className="flex gap-2 mb-4 items-center">
          <button
            onClick={() => setScenarioId(Math.max(1, scenarioId - 1))}
            disabled={scenarioId <= 1}
            className="px-3 py-1.5 rounded bg-white border text-sm disabled:opacity-30 hover:bg-gray-50"
          >
            ← 前へ
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-500">
            {scenarioId} / {scenarios.length || 20}
          </span>
          <button
            onClick={() => setScenarioId(Math.min(scenarios.length || 20, scenarioId + 1))}
            disabled={scenarioId >= (scenarios.length || 20)}
            className="px-3 py-1.5 rounded bg-white border text-sm disabled:opacity-30 hover:bg-gray-50"
          >
            次へ →
          </button>
          <div className="ml-4 flex gap-2">
            <button
              onClick={() => router.push(`/posts/new?fromTest=${scenarioId}`)}
              className="px-3 py-1.5 rounded bg-blue-500 text-white text-sm font-bold hover:bg-blue-600"
            >
              エディタで開く
            </button>
            <button
              onClick={async () => {
                if (!data || !currentScenario) return;
                const name = prompt("テンプレート名を入力", currentScenario.name.split(" — ")[1] || currentScenario.name);
                if (!name) return;
                const res = await fetch("/api/canvas-templates", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name,
                    category: currentScenario.slideType,
                    slideType: currentScenario.slideType,
                    canvasData: JSON.stringify(data),
                  }),
                });
                if (res.ok) alert("テンプレートとして保存しました！");
                else alert("保存に失敗しました");
              }}
              className="px-3 py-1.5 rounded bg-teal-500 text-white text-sm font-bold hover:bg-teal-600"
            >
              テンプレ保存
            </button>
            <button
              onClick={async () => {
                if (!confirm("全21テンプレートをDBに一括登録しますか？")) return;
                const res = await fetch("/api/seed-templates", { method: "POST" });
                if (res.ok) {
                  const d = await res.json();
                  alert(`${d.count}件のテンプレートを登録しました！\n台本入力で自動生成が可能になりました。`);
                } else {
                  const d = await res.json().catch(() => ({}));
                  alert("一括保存に失敗: " + (d.error || "不明なエラー"));
                }
              }}
              className="px-3 py-1.5 rounded bg-orange-500 text-white text-sm font-bold hover:bg-orange-600"
            >
              全テンプレ一括DB登録
            </button>
          </div>
          {/* 座標操作ボタン */}
          <div className="ml-4 flex gap-2 items-center">
            <button
              onClick={() => {
                if (!data) return;
                localStorage.setItem(savedKey(scenarioId), JSON.stringify(data));
                setIsFromSaved(true);
                alert(`#${scenarioId} の座標を保存しました！`);
              }}
              className="px-3 py-1.5 rounded bg-green-600 text-white text-sm font-bold hover:bg-green-700"
            >
              💾 座標保存
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(savedKey(scenarioId));
                setIsFromSaved(false);
                loadScenario(scenarioId);
              }}
              className="px-3 py-1.5 rounded bg-gray-500 text-white text-sm font-bold hover:bg-gray-600"
            >
              リセット
            </button>
            <button
              onClick={() => {
                if (!data) return;
                const coords = data.elements.map(el => ({
                  id: el.id,
                  x: el.x, y: el.y, width: el.width, height: el.height,
                  text: el.type === "text" ? (el as unknown as Record<string, unknown>).text : undefined,
                }));
                navigator.clipboard.writeText(JSON.stringify(coords, null, 2));
                alert("座標をクリップボードにコピーしました！");
              }}
              className="px-3 py-1.5 rounded bg-violet-500 text-white text-sm font-bold hover:bg-violet-600"
            >
              座標コピー
            </button>
            {isFromSaved && (
              <span className="text-xs text-green-700 font-bold bg-green-100 px-2 py-1 rounded">📌 保存済み座標</span>
            )}
          </div>
        </div>

        {/* Canvas */}
        {data ? (
          <div className="flex gap-6">
            <div style={{ width: 540, height: 675 }} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <CanvasEditor
                data={data}
                onChange={setData}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
              />
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-bold text-gray-700">要素数: {data.elements.length}</p>
              <p>BG: {data.background.color}</p>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 py-20 text-center">Loading...</div>
        )}
      </div>
    </div>
  );
}
