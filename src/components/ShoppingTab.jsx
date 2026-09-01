import { useEffect, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

function ShoppingItem({ item, onToggle, onDelete, onEdit }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Seed the draft from the item at the moment editing starts, so a value
  // refreshed from the server in the meantime is picked up.
  function startEditing() {
    setDraft(item.text);
    setEditing(true);
  }

  function commit() {
    const trimmed = draft.trim();
    setEditing(false);
    // Empty input is treated as "no change" rather than deleting the item -
    // deleting has its own explicit button.
    if (!trimmed || trimmed === item.text) {
      setDraft(item.text);
      return;
    }
    onEdit(item.id, trimmed);
  }

  function cancel() {
    setDraft(item.text);
    setEditing(false);
  }

  return (
    <li className={`shopping-item${item.checked ? " shopping-item--checked" : ""}`}>
      <button
        className="shopping-item__check"
        role="checkbox"
        aria-checked={item.checked}
        aria-label={t(item.checked ? "shoppingCheckOff" : "shoppingCheckOn", { item: item.text })}
        onClick={() => onToggle(item.id, !item.checked)}
      >
        {item.checked && <Check size={15} strokeWidth={3} />}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          className="shopping-item__input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          aria-label={t("shoppingEditAria", { item: item.text })}
        />
      ) : (
        <button
          className="shopping-item__text"
          onClick={startEditing}
          aria-label={t("shoppingEditAria", { item: item.text })}
        >
          {item.text}
        </button>
      )}

      <button
        className="shopping-item__delete"
        aria-label={t("shoppingDeleteAria", { item: item.text })}
        onClick={() => onDelete(item.id)}
      >
        <X size={17} strokeWidth={2.2} />
      </button>
    </li>
  );
}

export default function ShoppingTab({ items, onAdd, onToggle, onDelete, onEdit, onClearChecked }) {
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
            <ShoppingItem
              key={item.id}
              item={item}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
            />
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
          <Plus size={22} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
}
