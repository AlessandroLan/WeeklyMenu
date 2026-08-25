import { createContext, useContext, useEffect, useState } from "react";
import { STRINGS } from "./i18n";

const STORAGE_KEY = "menu-app-lang";
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(STORAGE_KEY) || "it");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  function t(key, vars) {
    let str = STRINGS[lang][key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        str = str.replace(`{${name}}`, value);
      }
    }
    return str;
  }

  function toggleLang() {
    setLang((prev) => (prev === "it" ? "en" : "it"));
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
