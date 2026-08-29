import { Copy } from "lucide-react";
import { DAY_KEYS, dateForDayIndex } from "../lib/dates";
import { DAY_LABELS } from "../lib/i18n";
import { useLanguage } from "../lib/LanguageContext";
import DayCard from "./DayCard";

export default function MenuTab({ monday, menu, onSave, onDuplicate }) {
  const { lang, t } = useLanguage();

  return (
    <div className="menu-tab">
      <button className="menu-tab__duplicate" onClick={onDuplicate}>
        <Copy size={14} strokeWidth={2.2} />
        {t("duplicateWeekButton")}
      </button>
      {DAY_KEYS.map((dayKey, index) => (
        <DayCard
          key={dayKey}
          dayKey={dayKey}
          label={DAY_LABELS[lang][dayKey]}
          date={dateForDayIndex(monday, index)}
          value={menu?.[dayKey]}
          onSave={onSave}
        />
      ))}
    </div>
  );
}
