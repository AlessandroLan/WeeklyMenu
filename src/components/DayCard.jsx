import { useEffect, useRef, useState } from "react";
import { shortDayDate } from "../lib/dates";

const MEALS = [
  { key: "pranzo", label: "Pranzo" },
  { key: "cena", label: "Cena" },
];

export default function DayCard({ day, date, value, onSave }) {
  const [local, setLocal] = useState(value ?? {});
  const timers = useRef({});
  const isToday = new Date().toDateString() === date.toDateString();

  // Pick up remote changes (from Natalia's device) unless we're mid-edit on that field.
  useEffect(() => {
    setLocal((prev) => ({ ...prev, ...value }));
  }, [value]);

  function handleChange(mealKey, text) {
    setLocal((prev) => ({ ...prev, [mealKey]: text }));
    clearTimeout(timers.current[mealKey]);
    timers.current[mealKey] = setTimeout(() => {
      onSave(day.key, mealKey, text);
    }, 500);
  }

  return (
    <div className={`day-card${isToday ? " day-card--today" : ""}`}>
      <div className="day-card__header">
        <h2 className="day-card__name">{day.label}</h2>
        <span className="day-card__date">{shortDayDate(date)}</span>
      </div>
      <div className="day-card__meals">
        {MEALS.map((meal) => (
          <label key={meal.key} className="day-card__meal">
            <span className="day-card__meal-label">{meal.label}</span>
            <textarea
              className="day-card__meal-input"
              rows={1}
              placeholder="cosa mangiate?"
              value={local[meal.key] ?? ""}
              onChange={(e) => handleChange(meal.key, e.target.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
