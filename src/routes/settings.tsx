import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Minus, Plus, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { SUPPORTED_LANGS } from "@/lib/i18n";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Focusdoro" },
      { name: "description", content: "Customize timer, theme, language and goals." },
    ],
  }),
  component: () => (
    <AppShell title="Settings">
      <ClientOnly><SettingsScreen /></ClientOnly>
    </AppShell>
  ),
});

type Theme = "system" | "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && sysDark);
  root.classList.toggle("dark", dark);
}

function SettingsScreen() {
  const { t } = useTranslation();
  const [preset, setPreset] = useState<number>(() => Number(localStorage.getItem("focusdoro.preset") ?? "25"));
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("focusdoro.theme") as Theme) ?? "system");
  const [goal, setGoal] = useState<number>(() => Number(localStorage.getItem("focusdoro.goal") ?? "4"));
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState(i18n.resolvedLanguage ?? "en");

  useEffect(() => { localStorage.setItem("focusdoro.preset", String(preset)); }, [preset]);
  useEffect(() => { localStorage.setItem("focusdoro.goal", String(goal)); }, [goal]);
  useEffect(() => { localStorage.setItem("focusdoro.theme", theme); applyTheme(theme); }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => theme === "system" && applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const pickLang = (code: string) => {
    i18n.changeLanguage(code);
    setLang(code);
    try { localStorage.setItem("focusdoro.lang", code); } catch {}
    setLangOpen(false);
  };

  return (
    <div className="space-y-5 pb-6">
      <Section title={t("settings.timer_presets")}>
        <div className="flex gap-2">
          {[15, 25, 50].map((m) => (
            <button
              key={m}
              onClick={() => setPreset(m)}
              className={`flex-1 rounded-2xl py-3 text-sm font-semibold transition ${
                preset === m ? "bg-brand text-brand-foreground" : "bg-secondary text-foreground"
              }`}
            >
              {m} {t("settings.minutes")}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t("settings.appearance")}>
        <div className="flex gap-2">
          {(["system", "light", "dark"] as Theme[]).map((m) => (
            <button
              key={m}
              onClick={() => setTheme(m)}
              className={`flex-1 rounded-2xl py-3 text-sm font-semibold transition ${
                theme === m ? "bg-brand text-brand-foreground" : "bg-secondary text-foreground"
              }`}
            >
              {t(`settings.${m}`)}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t("settings.daily_goal")}>
        <div className="flex items-center justify-between rounded-2xl bg-secondary p-3">
          <button onClick={() => setGoal((g) => Math.max(1, g - 1))} className="rounded-full bg-background p-2 shadow-sm">
            <Minus className="h-4 w-4" />
          </button>
          <div className="text-lg font-bold tabular-nums">{goal} {t("timer.sessions")}</div>
          <button onClick={() => setGoal((g) => Math.min(20, g + 1))} className="rounded-full bg-background p-2 shadow-sm">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </Section>

      <Section title={t("settings.language")}>
        <button
          onClick={() => setLangOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl bg-secondary p-4"
        >
          <span className="font-medium">{SUPPORTED_LANGS.find((l) => l.code === lang)?.label ?? "English"}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </Section>

      <p className="pt-2 text-center text-xs text-muted-foreground">{t("settings.version")} 1.0.0</p>

      <AnimatePresence>
        {langOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLangOpen(false)}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl bg-card p-5"
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t("settings.choose_language")}</h3>
                <button onClick={() => setLangOpen(false)} aria-label="Close">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <ul className="mt-3 space-y-2">
                {SUPPORTED_LANGS.map((l) => {
                  const active = l.code === lang;
                  return (
                    <li key={l.code}>
                      <button
                        onClick={() => pickLang(l.code)}
                        className="flex w-full items-center justify-between rounded-2xl bg-secondary p-3 text-sm font-medium transition"
                        style={active ? { border: "2px solid #007AFF" } : { border: "2px solid transparent" }}
                      >
                        <span>{l.label}</span>
                        {active ? <Check className="h-4 w-4" style={{ color: "#007AFF" }} /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}