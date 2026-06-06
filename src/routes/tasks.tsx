import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { TaskBottomSheet } from "@/components/TaskBottomSheet";
import { UpsellModal } from "@/components/UpsellModal";
import { getDB, type TaskRow } from "@/lib/db";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Focusdoro" },
      { name: "description", content: "Plan and complete your focus tasks." },
    ],
  }),
  component: () => (
    <AppShell title="Tasks">
      <ClientOnly><TasksScreen /></ClientOnly>
    </AppShell>
  ),
});

const FREE_LIMIT = 5;

function TasksScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [sheet, setSheet] = useState(false);
  const [upsell, setUpsell] = useState(false);

  const tasks = useLiveQuery(
    () => getDB().tasks.orderBy("createdAt").reverse().toArray(),
    [],
    [] as TaskRow[],
  );

  const filtered = tasks.filter((t) => (tab === "active" ? t.completed === 0 : t.completed === 1));
  const activeCount = tasks.filter((t) => t.completed === 0).length;

  const toggle = async (row: TaskRow) => {
    if (row.id == null) return;
    await getDB().tasks.update(row.id, { completed: row.completed ? 0 : 1 });
  };

  const onAdd = () => {
    if (activeCount >= FREE_LIMIT) { setUpsell(true); return; }
    setSheet(true);
  };

  const subProgress = (row: TaskRow) => {
    if (!row.subtasks?.length) return null;
    const done = row.subtasks.filter((s) => s.done).length;
    return { done, total: row.subtasks.length, pct: Math.round((done / row.subtasks.length) * 100) };
  };

  const priColor = { high: "#EF4444", medium: "#F59E0B", low: "#64748B" } as const;

  return (
    <div className="pb-6">
      <div className="neu-sm flex rounded-full p-1">
        {(["active", "completed"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === k ? "bg-brand text-brand-foreground" : "text-muted-foreground"
            }`}
          >
            {t(`tasks.${k}`)}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {filtered.length === 0 && (
          <li className="rounded-2xl bg-secondary py-10 text-center text-sm text-muted-foreground">
            {t("tasks.empty")}
          </li>
        )}
        {filtered.map((row) => {
          const sp = subProgress(row);
          return (
            <motion.li
              key={row.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-card p-4 shadow-sm"
              style={{ borderLeft: `4px solid ${row.categoryColor}` }}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggle(row)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    row.completed ? "border-brand bg-brand text-brand-foreground" : "border-muted-foreground/40"
                  }`}
                  aria-label="Toggle complete"
                >
                  {row.completed ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{row.emoji}</span>
                    <span
                      className={`font-semibold ${row.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
                    >
                      {row.title}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                      style={{ background: `${priColor[row.priority]}22`, color: priColor[row.priority] }}
                    >
                      {t(`tasks.${row.priority}`)}
                    </span>
                    {row.recurring ? <span>↻</span> : null}
                  </div>
                  {sp && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${sp.pct}%` }} />
                      </div>
                      <span className="mt-1 inline-block text-[10px] text-muted-foreground">
                        {sp.done}/{sp.total}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>

      <button
        onClick={onAdd}
        className="fixed bottom-24 right-1/2 z-30 flex h-14 w-14 translate-x-[180px] items-center justify-center rounded-full bg-brand text-brand-foreground shadow-xl shadow-brand/40 active:scale-95 transition"
        aria-label={t("tasks.new")}
      >
        <Plus className="h-6 w-6" />
      </button>

      <TaskBottomSheet open={sheet} onClose={() => setSheet(false)} />
      <UpsellModal open={upsell} onClose={() => setUpsell(false)} />
    </div>
  );
}