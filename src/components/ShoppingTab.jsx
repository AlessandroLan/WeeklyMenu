import { useState } from "react";
import { useLanguage } from "../lib/LanguageContext";

export default function ShoppingTab({ items, onAdd, onToggle, onDelete, onClearChecked }) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const checkedCount = items.filter((i) => i.checked).length;

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  }

  return (
    <div className="shopping-tab">
      <div className="shopping-list">
        {items.length === 0 && <p className="shopping-list__empty">{t("shoppingEmpty")}</p>}
        <ul className="shopping-list__items">
          {items.map((item) => (
            <li key={item.id} className={`shopping-item${item.checked ? " shopping-item--checked" : ""}`}>
              <button
                className="shopping-item__check"
                role="checkbox"
                aria-checked={item.checked}
                aria-label={t(item.checked ? "shoppingCheckOff" : "shoppingCheckOn", { item: item.text })}
                onClick={() => onToggle(item.id, !item.checked)}
              >
                {item.checked ? "✓" : ""}
              </button>
              <span className="shopping-item__text">{item.text}</span>
              <button
                className="shopping-item__delete"
                aria-label={t("shoppingDeleteAria", { item: item.text })}
                onClick={() => onDelete(item.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      {checkedCount > 0 && (
        <button className="shopping-tab__clear" onClick={onClearChecked}>
          {t("shoppingClear", { count: checkedCount })}
        </button>
      )}

      <form className="shopping-add" onSubmit={handleSubmit}>
        <input
          className="shopping-add__input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("shoppingAddPlaceholder")}
        />
        <button className="shopping-add__button" type="submit" aria-label={t("shoppingAddAria")}>
          +
        </button>
      </form>
    </div>
  );
}
