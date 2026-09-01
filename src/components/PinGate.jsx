import { useState } from "react";
import { Languages, Lock } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

const STORAGE_KEY = "menu-app-unlocked";

export function isUnlocked() {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export default function PinGate({ onUnlock }) {
  const { lang, toggleLang, t } = useLanguage();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const expectedPin = import.meta.env.VITE_APP_PIN;

  function handleSubmit(e) {
    e.preventDefault();
    if (!expectedPin || pin === expectedPin) {
      localStorage.setItem(STORAGE_KEY, "true");
      onUnlock();
    } else {
      setError(true);
    }
  }

  return (
    <div className="pin-gate">
      <button
        className="pin-gate__lang"
        type="button"
        onClick={toggleLang}
        aria-label={t("toggleLanguageAria")}
      >
        <Languages size={14} strokeWidth={2.2} />
        {lang === "it" ? "EN" : "IT"}
      </button>

      <form className="pin-card" onSubmit={handleSubmit}>
        <div className="pin-card__icon">
          <Lock size={22} strokeWidth={2.2} />
        </div>
        <h1 className="pin-card__title">{t("pinTitle")}</h1>
        <p className="pin-card__hint">{t("pinHint")}</p>
        <input
          className={`pin-card__input${error ? " pin-card__input--error" : ""}`}
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          placeholder="••••"
        />
        {error && <p className="pin-card__error">{t("pinError")}</p>}
        <button className="pin-card__button" type="submit">
          {t("pinButton")}
        </button>
      </form>
    </div>
  );
}
