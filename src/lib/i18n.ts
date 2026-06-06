import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "../../locales/en/common.json";
import es from "../../locales/es/common.json";
import fr from "../../locales/fr/common.json";
import de from "../../locales/de/common.json";
import ja from "../../locales/ja/common.json";
import pt from "../../locales/pt/common.json";

export const SUPPORTED_LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
  { code: "pt", label: "Português" },
] as const;

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { common: en },
        es: { common: es },
        fr: { common: fr },
        de: { common: de },
        ja: { common: ja },
        pt: { common: pt },
      },
      fallbackLng: "en",
      defaultNS: "common",
      supportedLngs: SUPPORTED_LANGS.map((l) => l.code),
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "focusdoro.lang",
      },
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

export default i18n;