import { useEffect, useRef, useState } from "react";
import { Lightbulb, StickyNote } from "lucide-react";
import { shortDayDate } from "../lib/dates";
import { suggestDishes } from "../lib/dishes";
import { useLanguage } from "../lib/LanguageContext";
import IdeaList from "./IdeaList";

export default function DayCard({
  dayKey,
  label,
  date,
  value,
  dishes = [],
  getIdeas,
  nameForIdea,
  onSave,
}) {
  const { lang, t } = useLanguage();
  const [local, setLocal] = useState(value ?? {});
  const timers = useRef({});
  // Which meal field has focus, so its dish suggestions can be shown.
  const [focused, setFocused] = useState(null);
  // The meal whose ideas list is open, and how many times "more ideas" was
  // pressed (each press shows a different set).
  const [ideasFor, setIdeasFor] = useState(null);
  const [shuffle, setShuffle] = useState(0);
  const isToday = new Date().toDateString() === date.toDateString();

  const MEALS = [
    { key: "pranzo", label: t("mealLunch") },
    { key: "cena", label: t("mealDinner") },
  ];

  // Pick up remote changes (from the other person's device).
  useEffect(() => {
    setLocal((prev) => ({ ...prev, ...value }));
  }, [value]);

  function handleChange(fieldKey, text) {
    setLocal((prev) => ({ ...prev, [fieldKey]: text }));
    clearTimeout(timers.current[fieldKey]);
    timers.current[fieldKey] = setTimeout(() => {
      onSave(dayKey, fieldKey, text);
    }, 500);
  }

  const suggestions = focused ? suggestDishes(local[focused], dishes) : [];

  function pickDish(mealKey, name) {
    handleChange(mealKey, name);
    // Closes the list (and the phone keyboard) - the meal is chosen.
    document.activeElement?.blur();
  }

  function toggleIdeas(mealKey) {
    setIdeasFor((open) => (open === mealKey ? null : mealKey));
    setShuffle(0);
  }

  async function pickIdea(mealKey, item) {
    setIdeasFor(null);
    const name = await nameForIdea(item);
    clearTimeout(timers.current[mealKey]);
    setLocal((prev) => ({ ...prev, [mealKey]: name }));
    onSave(dayKey, mealKey, name);
  }

  return (
    <div className={`day-card${isToday ? " day-card--today" : ""}`}>
      <div className="day-card__header">
        <div>
          {isToday && <span className="day-card__eyebrow">{t("todayBadge")}</span>}
          <h2 className="day-card__name">{label}</h2>
        </div>
        <span className="day-card__date">{shortDayDate(date, lang)}</span>
      </div>
      <div className="day-card__meals">
        {MEALS.map((meal) => (
          <div key={meal.key} className="day-card__meal-wrap">
            <label className="day-card__meal">
              <span className="day-card__meal-label">{meal.label}</span>
              <textarea
                className="day-card__meal-input"
                rows={1}
                value={local[meal.key] ?? ""}
                onChange={(e) => {
                  handleChange(meal.key, e.target.value);
                  setFocused(meal.key);
                }}
                onFocus={() => setFocused(meal.key)}
                onBlur={() => setFocused(null)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setFocused(null);
                }}
              />
            </label>
            {getIdeas && !(local[meal.key] ?? "").trim() && focused !== meal.key && (
              <button
                type="button"
                className={`day-card__ideas${ideasFor === meal.key ? " day-card__ideas--open" : ""}`}
                onClick={() => toggleIdeas(meal.key)}
                aria-expanded={ideasFor === meal.key}
                aria-label={t("ideasButtonAria", { meal: meal.label.toLowerCase() })}
                title={t("ideasTitle")}
              >
                <Lightbulb size={14} strokeWidth={2.2} />
              </button>
            )}
            {ideasFor === meal.key && (
              <>
                <button
                  type="button"
                  className="idea-pop__backdrop"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setIdeasFor(null)}
                />
                <IdeaList
                  items={getIdeas(meal.key, shuffle)}
                  onPick={(item) => pickIdea(meal.key, item)}
                  onMore={() => setShuffle((n) => n + 1)}
                />
              </>
            )}
            {focused === meal.key && suggestions.length > 0 && (
              <ul className="dish-suggest" aria-label={t("dishSuggestionsAria")}>
                {suggestions.map((dish) => (
                  <li key={dish.id}>
                    <button
                      type="button"
                      className="dish-suggest__item"
                      // mousedown would blur the field before the click lands.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickDish(meal.key, dish.name)}
                    >
                      {dish.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <label className="day-card__note">
        <StickyNote size={14} strokeWidth={2.2} className="day-card__note-icon" aria-hidden="true" />
        <input
          type="text"
          className="day-card__note-input"
          value={local.note ?? ""}
          onChange={(e) => handleChange("note", e.target.value)}
          aria-label={t("dayNoteLabel")}
        />
      </label>
    </div>
  );
}
