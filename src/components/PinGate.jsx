import { useState } from "react";

const STORAGE_KEY = "menu-app-unlocked";

export function isUnlocked() {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export default function PinGate({ onUnlock }) {
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
      <form className="pin-card" onSubmit={handleSubmit}>
        <span className="pin-card__tab" aria-hidden="true" />
        <h1 className="pin-card__title">Menu della settimana</h1>
        <p className="pin-card__hint">Inserisci il PIN condiviso per entrare</p>
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
        {error && <p className="pin-card__error">PIN sbagliato, riprova.</p>}
        <button className="pin-card__button" type="submit">
          Entra
        </button>
      </form>
    </div>
  );
}
