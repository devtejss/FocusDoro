import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDB, type Priority, type TaskRow } from "@/lib/db";

const EMOJIS = ["🎯", "💻", "📚", "✍️", "🎨", "🧠", "📞", "📧", "🧘", "🏃", "🍳", "🛒", "🎵", "🎬", "🧪", "🧹", "💡", "📝", "🛠️", "📊", "🧾", "🌱", "🐾", "🪴", "☀️", "🌙", "⭐", "🔥", "💪", "🚀", "🎁", "❤️", "✅", "📦", "📌", "⏰", "🎉", "🏆", "🎓", "🍵", "🍰", "🥗", "📷", "✈️", "🏖️", "🎲", "🎮", "🧩"];
const COLORS = ["#EF4444", "#F59E0B", "#FBBF24", "#10B981", "#06B6D4", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#64748B"];
const TEMPLATES: { key: string; emoji: string; color: string }[] = [
  { key: "tpl_meeting", emoji: "📞", color: "#3B82F6" },
  { key: "tpl_email", emoji: "📧", color: "#06B6D4" },
  { key: "tpl_coding", emoji: "💻", color: "#10B981" },
  { key: "tpl_design", emoji: "🎨", color: "#EC4899" },
];

const SNAP_MID = 0.45; // top offset in viewport fractions => sheet height 55%
const SNAP_FULL = 0.08;

export function TaskBottomSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: () => void }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [color, setColor] = useState(COLORS[5]);
  const [priority, setPriority] = useState<Priority>("medium");
  const [recurring, setRecurring] = useState(false);
  const [recurDays, setRecurDays] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const controls = useAnimationControls();
  const [vh, setVh] = useState(800);

  useEffect(() => {
    setVh(window.innerHeight);
    const onR = () => setVh(window.innerHeight);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      controls.start({ y: vh * SNAP_MID });
    }
  }, [open, controls, vh]);

  const priColor = useMemo(
    () => ({ high: "#EF4444", medium: "#F59E0B", low: "#64748B" }) as const,
    [],
  );

  const reset = () => {
    setTitle(""); setEmoji("🎯"); setColor(COLORS[5]); setPriority("medium"); setRecurring(false); setRecurDays([]);
  };

  const save = async () => {
    if (!title.trim()) return;
    const row: TaskRow = {
      title: title.trim(),
      category: "general",
      categoryColor: color,
      tags: [],
      subtasks: [],
      priority,
      emoji,
      recurring,
      recurDays,
      completed: 0,
      createdAt: Date.now(),
    };
    await getDB().tasks.add(row);
    reset();
    onSaved?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl bg-card text-card-foreground shadow-2xl"
            style={{ height: vh }}
            drag="y"
            dragConstraints={{ top: vh * SNAP_FULL, bottom: vh }}
            dragElastic={0.05}
            initial={{ y: vh }}
            animate={controls}
            exit={{ y: vh }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            onDragEnd={(_, info) => {
              const y = info.point.y;
              if (y > vh * 0.75) onClose();
              else if (y > vh * 0.3) controls.start({ y: vh * SNAP_MID });
              else controls.start({ y: vh * SNAP_FULL });
            }}
          >
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            <div className="h-[calc(100%-1rem)] overflow-y-auto px-5 pb-10 pt-3">
              <h2 className="text-lg font-semibold">{t("tasks.create_title")}</h2>

              {/* Title */}
              <input
                ref={inputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("tasks.title_ph")}
                className="mt-4 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-brand"
              />

              {/* Quick fill */}
              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("tasks.quick")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.key}
                    onClick={() => { setTitle(t(`tasks.${tpl.key}`)); setEmoji(tpl.emoji); setColor(tpl.color); }}
                    className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm"
                  >
                    <span>{tpl.emoji}</span>
                    <span>{t(`tasks.${tpl.key}`)}</span>
                  </button>
                ))}
              </div>

              {/* Priority */}
              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("tasks.priority")}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["high", "medium", "low"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                      priority === p ? "text-white" : "bg-secondary text-foreground"
                    }`}
                    style={priority === p ? { background: priColor[p] } : undefined}
                  >
                    {t(`tasks.${p}`)}
                  </button>
                ))}
              </div>

              {/* Emoji */}
              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("tasks.emoji")}</p>
              <div className="mt-2 grid grid-cols-8 gap-2">
                {EMOJIS.slice(0, 48).map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`aspect-square rounded-xl text-xl ${emoji === e ? "ring-2 ring-brand" : "bg-secondary"}`}
                  >
                    {e}
                  </button>
                ))}
              </div>

              {/* Color */}
              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("tasks.color")}</p>
              <div className="mt-2 flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>

              {/* Recurring */}
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-secondary p-3">
                <span className="text-sm font-medium">{t("tasks.recurring")}</span>
                <button
                  onClick={() => setRecurring((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition ${recurring ? "bg-brand" : "bg-muted-foreground/30"}`}
                  aria-pressed={recurring}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      recurring ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              {recurring && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 grid grid-cols-7 gap-2"
                >
                  {(["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const).map((d, i) => {
                    const on = recurDays.includes(i);
                    return (
                      <button
                        key={d}
                        onClick={() => setRecurDays((arr) => (on ? arr.filter((x) => x !== i) : [...arr, i]))}
                        className={`rounded-xl py-2 text-xs font-semibold ${
                          on ? "bg-brand text-brand-foreground" : "bg-secondary text-foreground"
                        }`}
                      >
                        {t(`weekday.${d}`)}
                      </button>
                    );
                  })}
                </motion.div>
              )}

              <button
                onClick={save}
                disabled={!title.trim()}
                className="mt-6 w-full rounded-2xl bg-brand py-3 text-sm font-semibold text-brand-foreground disabled:opacity-50"
              >
                {t("tasks.save")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}