import { useEffect, useRef, useState } from "react";
import { StickyNote } from "lucide-react";
import { shortDayDate } from "../lib/dates";
import { useLanguage } from "../lib/LanguageContext";

export default function DayCard({ dayKey, label, date, value, onSave }) {
  const { lang, t } = useLanguage();
  const [local, setLocal] = useState(value ?? {});
  const timers = useRef({});
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
          <label key={meal.key} className="day-card__meal">
            <span className="day-card__meal-label">{meal.label}</span>
            <textarea
              className="day-card__meal-input"
              rows={1}
              value={local[meal.key] ?? ""}
              onChange={(e) => handleChange(meal.key, e.target.value)}
            />
          </label>
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
