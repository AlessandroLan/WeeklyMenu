import { weekRangeLabel, isSameWeek } from "../lib/dates";
import { useLanguage } from "../lib/LanguageContext";

export default function WeekNav({ monday, onPrev, onNext, onToday }) {
  const { lang, t } = useLanguage();
  const isCurrent = isSameWeek(monday, new Date());

  return (
    <div className="week-nav">
      <button className="week-nav__arrow" onClick={onPrev} aria-label={t("prevWeekAria")}>
        ‹
      </button>
      <button
        className="week-nav__label"
        onClick={onToday}
        disabled={isCurrent}
        title={isCurrent ? undefined : t("todayReturn")}
      >
        <span className="week-nav__range">{weekRangeLabel(monday, lang)}</span>
        {!isCurrent && <span className="week-nav__today">{t("todayReturn")}</span>}
      </button>
      <button className="week-nav__arrow" onClick={onNext} aria-label={t("nextWeekAria")}>
        ›
      </button>
    </div>
  );
}
