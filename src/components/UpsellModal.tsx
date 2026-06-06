import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export function UpsellModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-3xl bg-card p-6 text-card-foreground shadow-2xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="rounded-2xl bg-brand/10 p-3 text-brand">
                <Sparkles className="h-6 w-6" />
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <h2 className="mt-4 text-xl font-bold">{t("tasks.limit_title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("tasks.limit_body")}</p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-2xl bg-brand py-3 text-sm font-semibold text-brand-foreground transition-transform active:scale-[0.98]"
            >
              {t("tasks.upgrade")}
            </button>
            <button onClick={onClose} className="mt-2 w-full rounded-2xl py-3 text-sm text-muted-foreground">
              {t("tasks.maybe")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}