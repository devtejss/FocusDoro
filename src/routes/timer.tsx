import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useReducer, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Play, Pause, SkipForward, Square } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { getDB, type SessionType } from "@/lib/db";
import { mmss } from "@/lib/format";
import { useLiveQuery } from "dexie-react-hooks";

export const Route = createFileRoute("/timer")({
  head: () => ({
    meta: [
      { title: "Timer — Focusdoro" },
      { name: "description", content: "Run focused Pomodoro sessions with auto-break transitions." },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientOnly fallback={<div className="pt-20 text-center text-muted-foreground">Loading…</div>}>
        <TimerScreen />
      </ClientOnly>
    </AppShell>
  ),
});

type Status = "idle" | "running" | "paused";
interface TState {
  type: SessionType;
  status: Status;
  endsAt: number | null;
  remainingSec: number;
  cyclesDone: number; // focus sessions completed
  presetMin: number;
}
type TAction =
  | { kind: "start" }
  | { kind: "pause" }
  | { kind: "resume" }
  | { kind: "tick"; now: number }
  | { kind: "skip" }
  | { kind: "complete" }
  | { kind: "stop" }
  | { kind: "setType"; t: SessionType; presetMin?: number }
  | { kind: "setPreset"; m: number };

const STATE_KEY = "focusdoro.timer.v1";

function durationFor(t: SessionType, presetMin: number) {
  if (t === "focus") return presetMin * 60;
  if (t === "short") return 5 * 60;
  return 15 * 60;
}

function init(): TState {
  const preset = (() => {
    if (typeof window === "undefined") return 25;
    const v = Number(localStorage.getItem("focusdoro.preset") ?? "25");
    return [15, 25, 50].includes(v) ? v : 25;
  })();
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as TState;
        if (s.status === "running" && s.endsAt) {
          const rem = Math.max(0, Math.round((s.endsAt - Date.now()) / 1000));
          return { ...s, remainingSec: rem };
        }
        return s;
      }
    } catch {}
  }
  return { type: "focus", status: "idle", endsAt: null, remainingSec: preset * 60, cyclesDone: 0, presetMin: preset };
}

function nextType(s: TState): { t: SessionType; cycles: number } {
  if (s.type === "focus") {
    const cycles = s.cyclesDone + 1;
    return { t: cycles % 4 === 0 ? "long" : "short", cycles };
  }
  return { t: "focus", cycles: s.cyclesDone };
}

function reducer(s: TState, a: TAction): TState {
  switch (a.kind) {
    case "setPreset": {
      const presetMin = a.m;
      const remainingSec = s.type === "focus" && s.status === "idle" ? presetMin * 60 : s.remainingSec;
      return { ...s, presetMin, remainingSec };
    }
    case "setType": {
      const presetMin = a.presetMin ?? s.presetMin;
      return { ...s, type: a.t, status: "idle", endsAt: null, remainingSec: durationFor(a.t, presetMin), presetMin };
    }
    case "start": {
      const endsAt = Date.now() + s.remainingSec * 1000;
      return { ...s, status: "running", endsAt };
    }
    case "pause": {
      const rem = s.endsAt ? Math.max(0, Math.round((s.endsAt - Date.now()) / 1000)) : s.remainingSec;
      return { ...s, status: "paused", endsAt: null, remainingSec: rem };
    }
    case "resume": {
      const endsAt = Date.now() + s.remainingSec * 1000;
      return { ...s, status: "running", endsAt };
    }
    case "tick": {
      if (s.status !== "running" || !s.endsAt) return s;
      const rem = Math.max(0, Math.round((s.endsAt - a.now) / 1000));
      return { ...s, remainingSec: rem };
    }
    case "skip": {
      const { t, cycles } = nextType(s);
      return { ...s, type: t, cyclesDone: cycles, status: "idle", endsAt: null, remainingSec: durationFor(t, s.presetMin) };
    }
    case "complete": {
      const { t, cycles } = nextType(s);
      return { ...s, type: t, cyclesDone: cycles, status: "idle", endsAt: null, remainingSec: durationFor(t, s.presetMin) };
    }
    case "stop":
      return { ...s, status: "idle", endsAt: null, remainingSec: durationFor(s.type, s.presetMin) };
  }
}

function TimerScreen() {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const completedRef = useRef(false);

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  // Tick + visibility resync
  useEffect(() => {
    if (state.status !== "running") return;
    completedRef.current = false;
    const id = window.setInterval(() => dispatch({ kind: "tick", now: Date.now() }), 250);
    const onVis = () => dispatch({ kind: "tick", now: Date.now() });
    document.addEventListener("visibilitychange", onVis);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [state.status]);

  // Completion handler
  useEffect(() => {
    if (state.status === "running" && state.remainingSec <= 0 && !completedRef.current) {
      completedRef.current = true;
      const finishedType = state.type;
      const dur = durationFor(state.type, state.presetMin);
      getDB().sessions.add({
        type: finishedType, startedAt: Date.now() - dur * 1000, durationSec: dur, completed: 1,
      }).catch(() => {});
      window.setTimeout(() => dispatch({ kind: "complete" }), 400);
    }
  }, [state]);

  const total = durationFor(state.type, state.presetMin);
  const progress = 1 - state.remainingSec / total;

  // Live today count
  const todayCount = useLiveQuery(async () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return getDB().sessions.where("startedAt").above(start.getTime()).and((r) => r.type === "focus" && r.completed === 1).count();
  }, [], 0);

  const ringSize = 280;
  const stroke = 14;
  const r = (ringSize - stroke) / 2;
  const c = 2 * Math.PI * r;

  const typeColor = state.type === "focus" ? "var(--focus)" : state.type === "short" ? "#10B981" : "#3B82F6";

  return (
    <div className="flex flex-col items-center pt-6">
      {/* type switcher */}
      <div className="neu-sm flex gap-1 rounded-full p-1">
        {(["focus", "short", "long"] as const).map((tt) => (
          <button
            key={tt}
            onClick={() => dispatch({ kind: "setType", t: tt })}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              state.type === tt ? "bg-brand text-brand-foreground shadow" : "text-muted-foreground"
            }`}
          >
            {t(`timer.${tt}`)}
          </button>
        ))}
      </div>

      {/* Ring */}
      <div className="relative mt-8" style={{ width: ringSize, height: ringSize }}>
        <svg width={ringSize} height={ringSize} className="-rotate-90">
          <circle cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
          <motion.circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            fill="none"
            stroke={typeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
            transition={{ type: "tween", duration: 0.4 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[64px] font-bold tabular-nums tracking-tight">{mmss(state.remainingSec)}</span>
          <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{t(`timer.${state.type}`)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-10 flex items-center gap-5">
        <button
          onClick={() => dispatch({ kind: "skip" })}
          className="neu flex h-14 w-14 items-center justify-center rounded-full text-foreground"
          aria-label={t("timer.skip")}
        >
          <SkipForward className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            if (state.status === "running") dispatch({ kind: "pause" });
            else if (state.status === "paused") dispatch({ kind: "resume" });
            else dispatch({ kind: "start" });
          }}
          className="flex h-20 w-20 items-center justify-center rounded-full text-brand-foreground shadow-xl active:scale-95 transition"
          style={{ background: "var(--brand)" }}
          aria-label={t("timer.start")}
        >
          {state.status === "running" ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
        </button>
        <button
          onClick={() => dispatch({ kind: "stop" })}
          className="neu flex h-14 w-14 items-center justify-center rounded-full text-foreground"
          aria-label={t("timer.stop")}
        >
          <Square className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        {t("timer.today")}: <span className="font-semibold text-foreground">{todayCount}</span> {t("timer.sessions")}
      </div>
    </div>
  );
}