import { DAYS, dateForDayIndex } from "../lib/dates";
import DayCard from "./DayCard";

export default function MenuTab({ monday, menu, onSave }) {
  return (
    <div className="menu-tab">
      {DAYS.map((day, index) => (
        <DayCard
          key={day.key}
          day={day}
          date={dateForDayIndex(monday, index)}
          value={menu?.[day.key]}
          onSave={onSave}
        />
      ))}
    </div>
  );
}
