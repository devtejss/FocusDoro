import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { AppShell } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { getDB } from "@/lib/db";
import { dayKey } from "@/lib/format";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Stats — Focusdoro" },
      { name: "description", content: "Track streaks, completions and your 12-week heatmap." },
    ],
  }),
  component: () => (
    <AppShell title="Stats">
      <ClientOnly><StatsScreen /></ClientOnly>
    </AppShell>
  ),
});

function StatsScreen() {
  const { t } = useTranslation();
  const [openDay, setOpenDay] = useState<string | null>(null);

  const sessions = useLiveQuery(
    () => getDB().sessions.where("type").equals("focus").and((r) => r.completed === 1).toArray(),
    [],
    [],
  );

  const { perDay, weeks, monthly, totals, currentStreak, longestStreak } = useMemo(() => {
    const perDay = new Map<string, number>();
    for (const s of sessions) {
      const k = dayKey(s.startedAt);
      perDay.set(k, (perDay.get(k) ?? 0) + 1);
    }
    // last 12 weeks (84 days)
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today); start.setDate(start.getDate() - 83);
    // Align start to Sunday
    start.setDate(start.getDate() - start.getDay());
    const cells: { date: Date; key: string; count: number }[] = [];
    for (let i = 0; i < 12 * 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const k = dayKey(d.getTime());
      cells.push({ date: d, key: k, count: perDay.get(k) ?? 0 });
    }
    // organize by weeks (columns)
    const weeks: typeof cells[] = [];
    for (let w = 0; w < 12; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));

    // monthly bars (this month days)
    const m = today.getMonth(), y = today.getFullYear();
    const dim = new Date(y, m + 1, 0).getDate();
    const monthly = Array.from({ length: dim }, (_, i) => {
      const d = new Date(y, m, i + 1);
      return { label: `${i + 1}`, focus: perDay.get(dayKey(d.getTime())) ?? 0 };
    });

    // streaks
    const sortedDays = [...perDay.keys()].sort();
    let longest = 0, run = 0, prev: string | null = null;
    for (const k of sortedDays) {
      if (prev) {
        const a = new Date(prev), b = new Date(k);
        const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
        run = diff === 1 ? run + 1 : 1;
      } else run = 1;
      longest = Math.max(longest, run);
      prev = k;
    }
    // current streak from today backwards
    let cur = 0; const cursor = new Date(today);
    while (perDay.has(dayKey(cursor.getTime()))) { cur++; cursor.setDate(cursor.getDate() - 1); }
    return {
      perDay, weeks, monthly,
      totals: sessions.length,
      currentStreak: cur,
      longestStreak: longest,
    };
  }, [sessions]);

  const max = Math.max(1, ...Array.from(perDay.values()));
  const cellColor = (count: number) => {
    if (!count) return "transparent";
    const a = Math.min(1, 0.18 + (count / max) * 0.82);
    return `rgba(239, 68, 68, ${a})`;
  };

  const daySessions = useLiveQuery(async () => {
    if (!openDay) return [];
    const d = new Date(openDay); d.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setDate(end.getDate() + 1);
    return getDB().sessions.where("startedAt").between(d.getTime(), end.getTime()).toArray();
  }, [openDay], []);

  return (
    <div className="pb-6">
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground">{t("stats.activity")}</h2>
        <div className="mt-3 flex gap-1.5">
          {weeks.map((wk, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {wk.map((cell) => (
                <button
                  key={cell.key}
                  onClick={() => cell.count > 0 && setOpenDay(cell.key)}
                  className="h-4 w-4 rounded-[4px] border border-border/40"
                  style={{ background: cellColor(cell.count) }}
                  title={`${cell.key}: ${cell.count}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label={t("stats.completions")} value={String(totals)} />
        <Stat label={t("stats.current_streak")} value={`${currentStreak}`} suffix={t("stats.days")} />
        <Stat label={t("stats.longest_streak")} value={`${longestStreak}`} suffix={t("stats.days")} />
      </div>

      <div className="mt-4 rounded-2xl bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground">{t("stats.monthly")}</h2>
        <div className="mt-3 h-44 w-full">
          <ResponsiveContainer>
            <BarChart data={monthly}>
              <XAxis dataKey="label" stroke="var(--muted-foreground)" tick={{ fontSize: 9 }} interval={2} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="focus" fill="var(--focus)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AnimatePresence>
        {openDay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpenDay(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-t-3xl bg-card p-5"
              initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/30" />
              <h3 className="mt-3 text-base font-semibold">{t("stats.day_sessions", { date: openDay })}</h3>
              {daySessions.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">{t("stats.no_sessions")}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {daySessions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-sm">
                      <span>{new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="font-medium">{Math.round(s.durationSec / 60)} min · {s.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-sm">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold tabular-nums">
        {value}
        {suffix ? <span className="ml-1 text-xs font-normal text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}