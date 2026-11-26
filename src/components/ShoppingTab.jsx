import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, LayoutList, Plus, X } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { formatQuantity, itemToRawText } from "../lib/quantity";
import { AISLES, DEFAULT_ORDER, aisleFor, groupByAisle } from "../lib/aisles";
import { useFitAboveNav } from "../lib/useFitAboveNav";

// Small list of aisles to move an item to; the choice is remembered for the
// item's name.
function AislePicker({ current, onPick, onClose }) {
  const { t } = useLanguage();
  const ref = useRef(null);
  const up = useFitAboveNav(ref);
  return (
    <>
      <button
        type="button"
        className="idea-pop__backdrop"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
      />
      <ul ref={ref} className={`aisle-picker${up ? " aisle-picker--up" : ""}`} role="listbox">
        {AISLES.map((aisle) => (
          <li key={aisle}>
            <button
              type="button"
              role="option"
              aria-selected={aisle === current}
              className={`aisle-picker__option${aisle === current ? " aisle-picker__option--current" : ""}`}
              onClick={() => onPick(aisle)}
            >
              {t(`aisle_${aisle}`)}
              {aisle === current && <Check size={14} strokeWidth={2.6} />}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function ShoppingItem({ item, aisle, onToggle, onDelete, onEdit, onMoveAisle }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState(() => itemToRawText(item));
  const inputRef = useRef(null);
  const quantity = formatQuantity(item.amount, item.unit);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Seed the draft from the item at the moment editing starts, so a value
  // refreshed from the server in the meantime is picked up.
  function startEditing() {
    setDraft(itemToRawText(item));
    setEditing(true);
  }

  function commit() {
    const trimmed = draft.trim();
    setEditing(false);
    // Empty input is treated as "no change" rather than deleting the item -
    // deleting has its own explicit button.
    if (!trimmed || trimmed === itemToRawText(item)) {
      setDraft(itemToRawText(item));
      return;
    }
    onEdit(item.id, trimmed);
  }

  function cancel() {
    setDraft(itemToRawText(item));
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

      {!editing && quantity && <span className="shopping-item__qty">{quantity}</span>}

      {!editing && (
        <div className="shopping-item__aisle">
          <button
            className="shopping-item__delete"
            aria-label={t("aisleChangeAria", { item: item.text })}
            aria-expanded={picking}
            title={t("aisleChangeAria", { item: item.text })}
            onClick={() => setPicking((p) => !p)}
          >
            <LayoutList size={16} strokeWidth={2.2} />
          </button>
          {picking && (
            <AislePicker
              current={aisle}
              onClose={() => setPicking(false)}
              onPick={(next) => {
                setPicking(false);
                if (next !== aisle) onMoveAisle(item, next);
              }}
            />
          )}
        </div>
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

// Rearranging the sections. Saved for both phones on "Done".
function AisleOrderPanel({ order, onSave, onClose }) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(() => [...order, ...AISLES.filter((a) => !order.includes(a))]);

  function move(index, delta) {
    setDraft((prev) => {
      const next = [...prev];
      const [aisle] = next.splice(index, 1);
      next.splice(index + delta, 0, aisle);
      return next;
    });
  }

  return (
    <div className="dish-import">
      <div className="dish-import__header">
        <h2 className="dish-import__title">{t("aisleOrderTitle")}</h2>
      </div>
      <p className="dish-import__hint">{t("aisleOrderHint")}</p>
      <ol className="shopping-list shopping-list__items aisle-order">
        {draft.map((aisle, index) => (
          <li key={aisle} className="shopping-item aisle-order__row">
            <span className="aisle-order__pos">{index + 1}</span>
            <span className="aisle-order__name">{t(`aisle_${aisle}`)}</span>
            <button
              className="shopping-item__delete"
              disabled={index === 0}
              aria-label={t("aisleOrderUp", { aisle: t(`aisle_${aisle}`) })}
              onClick={() => move(index, -1)}
            >
              <ArrowUp size={16} strokeWidth={2.2} />
            </button>
            <button
              className="shopping-item__delete"
              disabled={index === draft.length - 1}
              aria-label={t("aisleOrderDown", { aisle: t(`aisle_${aisle}`) })}
              onClick={() => move(index, 1)}
            >
              <ArrowDown size={16} strokeWidth={2.2} />
            </button>
          </li>
        ))}
      </ol>
      <div className="dish-import__actions">
        <button className="dish-import__cancel" onClick={() => setDraft(DEFAULT_ORDER)}>
          {t("aisleOrderReset")}
        </button>
        <button
          className="dish-import__confirm"
          onClick={async () => {
            await onSave(draft);
            onClose();
          }}
        >
          {t("aisleOrderDone")}
        </button>
      </div>
    </div>
  );
}

export default function ShoppingTab({
  items,
  learnedAisles,
  aisleOrder,
  onSaveOrder,
  onMoveAisle,
  onAdd,
  onToggle,
  onDelete,
  onEdit,
  onClearChecked,
}) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [ordering, setOrdering] = useState(false);
  const checkedCount = items.filter((i) => i.checked).length;
  const order = aisleOrder ?? DEFAULT_ORDER;
  const groups = useMemo(() => groupByAisle(items, learnedAisles, order), [items, learnedAisles, order]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  }

  if (ordering) {
    return (
      <AisleOrderPanel order={order} onSave={onSaveOrder} onClose={() => setOrdering(false)} />
    );
  }

  return (
    <div className="shopping-tab">
      {items.length > 0 && (
        <div className="shopping-tab__toolbar">
          <button className="menu-tab__duplicate" onClick={() => setOrdering(true)}>
            <ArrowUpDown size={14} strokeWidth={2.2} />
            {t("aisleOrderButton")}
          </button>
        </div>
      )}

      <div className="shopping-list">
        {items.length === 0 && <p className="shopping-list__empty">{t("shoppingEmpty")}</p>}
        {groups.map(({ aisle, items: aisleItems }) => (
          <section key={aisle} className="shopping-aisle">
            <h3 className="shopping-aisle__name">{t(`aisle_${aisle}`)}</h3>
            <ul className="shopping-list__items">
              {aisleItems.map((item) => (
                <ShoppingItem
                  key={item.id}
                  item={item}
                  aisle={aisleFor(item.text, learnedAisles)}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onMoveAisle={onMoveAisle}
                />
              ))}
            </ul>
          </section>
        ))}
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
