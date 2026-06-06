import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { AppShell } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { getDB } from "@/lib/db";
import { formatDuration } from "@/lib/format";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Focusdoro" },
      { name: "description", content: "See your daily, weekly and monthly focus reports." },
    ],
  }),
  component: () => (
    <AppShell title="Analytics">
      <ClientOnly><AnalyticsScreen /></ClientOnly>
    </AppShell>
  ),
});

type Range = "daily" | "weekly" | "monthly";

function AnalyticsScreen() {
  const { t } = useTranslation();
  const [range, setRange] = useState<Range>("daily");

  const sessions = useLiveQuery(async () => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    if (range === "weekly") since.setDate(since.getDate() - 6);
    if (range === "monthly") since.setDate(since.getDate() - 29);
    return getDB().sessions.where("startedAt").above(since.getTime()).toArray();
  }, [range], []);

  const { chart, stats } = useMemo(() => {
    if (range === "daily") {
      const buckets = Array.from({ length: 24 }, (_, h) => ({ label: `${h}`, focus: 0 }));
      for (const s of sessions) {
        if (s.type !== "focus" || !s.completed) continue;
        buckets[new Date(s.startedAt).getHours()].focus += 1;
      }
      return computeStats(sessions, buckets);
    }
    const days = range === "weekly" ? 7 : 30;
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (days - 1 - i));
      return { label: `${d.getMonth() + 1}/${d.getDate()}`, focus: 0, ts: d.getTime() };
    });
    for (const s of sessions) {
      if (s.type !== "focus" || !s.completed) continue;
      const d = new Date(s.startedAt); d.setHours(0, 0, 0, 0);
      const b = buckets.find((x) => x.ts === d.getTime());
      if (b) b.focus += 1;
    }
    return computeStats(sessions, buckets);
  }, [sessions, range]);

  return (
    <div className="pb-6">
      <div className="neu-sm flex rounded-full p-1">
        {(["daily", "weekly", "monthly"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setRange(k)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              range === k ? "bg-brand text-brand-foreground" : "text-muted-foreground"
            }`}
          >
            {t(`analytics.${k}`)}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-card p-4 shadow-sm">
        <div className="h-56 w-full">
          <ResponsiveContainer>
            <BarChart data={chart}>
              <XAxis dataKey="label" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Bar dataKey="focus" fill="var(--brand)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label={t("analytics.total_focus")} value={formatDuration(stats.focusSec)} />
        <Stat label={t("analytics.total_break")} value={formatDuration(stats.breakSec)} />
        <Stat label={t("analytics.avg_session")} value={formatDuration(stats.avgSec)} />
        <Stat label={t("analytics.session_count")} value={String(stats.count)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function computeStats(sessions: { type: string; durationSec: number; completed: number | boolean }[], chart: unknown[]) {
  let focusSec = 0, breakSec = 0, count = 0;
  for (const s of sessions) {
    if (!s.completed) continue;
    if (s.type === "focus") { focusSec += s.durationSec; count += 1; }
    else breakSec += s.durationSec;
  }
  const avgSec = count > 0 ? Math.round(focusSec / count) : 0;
  return { chart, stats: { focusSec, breakSec, count, avgSec } };
}