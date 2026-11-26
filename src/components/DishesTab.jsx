import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ExternalLink, History, Plus, Search, X } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { shortDayDate } from "../lib/dates";
import { importCandidates, mealsFromWeeks, normalizeName } from "../lib/dishes";

function DishRow({ dish, stats, onRename, onDelete }) {
  const { lang, t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(dish.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEditing() {
    setDraft(dish.name);
    setEditing(true);
  }

  function commit() {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed || trimmed === dish.name) return;
    onRename(dish.id, trimmed);
  }

  return (
    <li className="dish-row">
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
              setEditing(false);
            }
          }}
          aria-label={t("dishesEditAria", { name: dish.name })}
        />
      ) : (
        <div className="dish-row__body">
          <button
            className="shopping-item__text"
            onClick={startEditing}
            aria-label={t("dishesEditAria", { name: dish.name })}
          >
            {dish.name}
          </button>
          <span className="dish-row__meta">
            {stats
              ? t("dishStats", { count: stats.count, date: shortDayDate(stats.lastDate, lang) })
              : t("dishNever")}
          </span>
        </div>
      )}
      {!editing && dish.source_url && (
        <a
          className="shopping-item__delete dish-row__link"
          href={dish.source_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("dishOpenRecipe")}
          title={t("dishOpenRecipe")}
        >
          <ExternalLink size={16} strokeWidth={2.2} />
        </a>
      )}
      <button
        className="shopping-item__delete"
        aria-label={t("dishesDeleteAria", { name: dish.name })}
        onClick={() => {
          if (window.confirm(t("dishesDeleteConfirm", { name: dish.name }))) onDelete(dish.id);
        }}
      >
        <X size={17} strokeWidth={2.2} />
      </button>
    </li>
  );
}

// One-off screen that turns past menus into library dishes. Nothing is saved
// until "Import" is pressed, so it's safe to open and back out of.
function ImportPanel({ dishes, loadAllWeeks, onImport, onClose }) {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState(null);
  const [saving, setSaving] = useState(false);
  // The list is built once, from the library as it was when the panel opened,
  // so later re-renders don't reshuffle rows while they're being edited.
  const openedWith = useRef({ dishes, loadAllWeeks });

  useEffect(() => {
    let cancelled = false;
    const { dishes: existing, loadAllWeeks: load } = openedWith.current;
    load().then((weeks) => {
      if (cancelled) return;
      const candidates = importCandidates(mealsFromWeeks(weeks), existing);
      setRows(candidates.map((c) => ({ ...c, selected: true })));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = rows?.filter((r) => r.selected && r.name.trim()) ?? [];

  function update(index, patch) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function handleImport() {
    setSaving(true);
    await onImport(selected.map((r) => r.name.trim()));
    setSaving(false);
    onClose();
  }

  return (
    <div className="dish-import">
      <div className="dish-import__header">
        <h2 className="dish-import__title">{t("dishesImportTitle")}</h2>
        <button className="shopping-item__delete" onClick={onClose} aria-label={t("dishesImportCancel")}>
          <X size={18} strokeWidth={2.2} />
        </button>
      </div>

      {rows === null ? (
        <p className="shopping-list__empty">{t("dishesImportLoading")}</p>
      ) : rows.length === 0 ? (
        <p className="shopping-list__empty">{t("dishesImportNone")}</p>
      ) : (
        <>
          <p className="dish-import__hint">{t("dishesImportHint")}</p>
          <div className="dish-import__bulk">
            <button onClick={() => setRows((prev) => prev.map((r) => ({ ...r, selected: true })))}>
              {t("dishesImportAll")}
            </button>
            <button onClick={() => setRows((prev) => prev.map((r) => ({ ...r, selected: false })))}>
              {t("dishesImportNoneSel")}
            </button>
          </div>
          <ul className="shopping-list shopping-list__items">
            {rows.map((row, index) => (
              <li
                key={index}
                className={`shopping-item dish-import__row${row.selected ? "" : " dish-import__row--off"}`}
              >
                <button
                  className="shopping-item__check"
                  role="checkbox"
                  aria-checked={row.selected}
                  aria-label={row.name}
                  onClick={() => update(index, { selected: !row.selected })}
                >
                  {row.selected && <Check size={15} strokeWidth={3} />}
                </button>
                <div className="dish-import__body">
                  <input
                    className="dish-import__name"
                    type="text"
                    value={row.name}
                    onChange={(e) => update(index, { name: e.target.value })}
                    disabled={!row.selected}
                  />
                  <span className="dish-import__meta">
                    {t("dishesImportTimes", { count: row.count, date: shortDayDate(row.lastDate, lang) })}
                    {row.variants.length > 0 &&
                      ` · ${t("dishesImportAlso", { names: row.variants.join(", ") })}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="dish-import__actions">
            <button className="dish-import__cancel" onClick={onClose}>
              {t("dishesImportCancel")}
            </button>
            <button
              className="dish-import__confirm"
              onClick={handleImport}
              disabled={saving || selected.length === 0}
            >
              {t("dishesImportConfirm", { count: selected.length })}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const byName = (a, b) => a.name.localeCompare(b.name);

export default function DishesTab({ dishes, dishStats, onAdd, onRename, onDelete, onImport, loadAllWeeks }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("alpha");
  const [newName, setNewName] = useState("");
  const [importing, setImporting] = useState(false);

  const visible = useMemo(() => {
    const q = normalizeName(query);
    const list = q ? dishes.filter((d) => normalizeName(d.name).includes(q)) : dishes;
    const count = (d) => dishStats.get(d.id)?.count ?? 0;
    // Never-made dishes count as "longest ago" when rediscovering.
    const last = (d) => dishStats.get(d.id)?.lastDate?.getTime() ?? 0;
    const compare =
      sort === "most"
        ? (a, b) => count(b) - count(a) || byName(a, b)
        : sort === "oldest"
          ? (a, b) => last(a) - last(b) || byName(a, b)
          : byName;
    return [...list].sort(compare);
  }, [dishes, dishStats, query, sort]);

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (await onAdd(trimmed)) setNewName("");
  }

  if (importing) {
    return (
      <ImportPanel
        dishes={dishes}
        loadAllWeeks={loadAllWeeks}
        onImport={onImport}
        onClose={() => setImporting(false)}
      />
    );
  }

  return (
    <div className="shopping-tab dishes-tab">
      {dishes.length > 0 && (
        <label className="dishes-tab__search">
          <Search size={16} strokeWidth={2.2} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dishesSearchPlaceholder")}
          />
        </label>
      )}

      {dishes.length > 1 && (
        <div className="dishes-tab__sort" role="group">
          {[
            ["alpha", t("dishesSortAlpha")],
            ["most", t("dishesSortMost")],
            ["oldest", t("dishesSortOldest")],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`dishes-tab__chip${sort === key ? " dishes-tab__chip--active" : ""}`}
              aria-pressed={sort === key}
              onClick={() => setSort(key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="shopping-list">
        {dishes.length === 0 ? (
          <p className="shopping-list__empty">{t("dishesEmpty")}</p>
        ) : visible.length === 0 ? (
          <p className="shopping-list__empty">{t("dishesNoMatch")}</p>
        ) : (
          <ul className="shopping-list__items">
            {visible.map((dish) => (
              <DishRow
                key={dish.id}
                dish={dish}
                stats={dishStats.get(dish.id)}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="dishes-tab__footer">
        {dishes.length > 0 && <span>{t("dishesCount", { count: dishes.length })}</span>}
        <button className="menu-tab__duplicate" onClick={() => setImporting(true)}>
          <History size={14} strokeWidth={2.2} />
          {t("dishesImportButton")}
        </button>
      </div>

      <form className="shopping-add" onSubmit={handleAdd}>
        <input
          className="shopping-add__input"
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t("dishesAddPlaceholder")}
        />
        <button className="shopping-add__button" type="submit" aria-label={t("dishesAddAria")}>
          <Plus size={22} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
}
