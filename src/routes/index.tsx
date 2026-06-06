import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LionMascot } from "@/components/LionMascot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Focusdoro — focus, the playful way" },
      { name: "description", content: "A delightful Pomodoro PWA with tasks, streaks and a lion mascot." },
      { property: "og:title", content: "Focusdoro" },
      { property: "og:description", content: "A delightful Pomodoro PWA with tasks, streaks and a lion mascot." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("focusdoro.onboarded") === "true") {
      nav({ to: "/timer", replace: true });
    }
  }, [nav]);

  const finish = () => {
    try { localStorage.setItem("focusdoro.onboarded", "true"); } catch {}
    nav({ to: "/timer", replace: true });
  };

  const slides = [
    { title: t("onboarding.s1_title"), sub: t("onboarding.s1_sub"), bg: "from-amber-200 via-orange-100 to-rose-100", mood: "happy" as const },
    { title: t("onboarding.s2_title"), sub: t("onboarding.s2_sub"), bg: "from-sky-200 via-indigo-100 to-violet-100", mood: "focus" as const },
    { title: t("onboarding.s3_title"), sub: t("onboarding.s3_sub"), bg: "from-emerald-200 via-teal-100 to-cyan-100", mood: "rest" as const },
  ];
  const s = slides[step];

  return (
    <div className={`relative min-h-screen overflow-hidden bg-gradient-to-br ${s.bg} transition-colors duration-700`}>
      <button
        onClick={finish}
        className="absolute right-5 top-5 z-10 rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-foreground backdrop-blur"
      >
        {t("onboarding.skip")}
      </button>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ x: dir * 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -dir * 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className="flex flex-col items-center text-center"
          >
            <LionMascot size={220} mood={s.mood} />
            <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-foreground">{s.title}</h1>
            <p className="mt-3 max-w-xs text-base text-foreground/70">{s.sub}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-brand" : "w-2 bg-foreground/20"}`}
            />
          ))}
        </div>

        <button
          onClick={() => {
            if (step < slides.length - 1) { setDir(1); setStep(step + 1); }
            else finish();
          }}
          className="mt-8 w-full max-w-xs rounded-2xl bg-brand py-4 text-base font-semibold text-brand-foreground shadow-lg shadow-brand/30 active:scale-[0.98] transition-transform"
        >
          {step === slides.length - 1 ? t("onboarding.start") : t("onboarding.next")}
        </button>
      </div>
    </div>
  );
}
