import { weekRangeLabel, isSameWeek } from "../lib/dates";

export default function WeekNav({ monday, onPrev, onNext, onToday }) {
  const isCurrent = isSameWeek(monday, new Date());

  return (
    <div className="week-nav">
      <button className="week-nav__arrow" onClick={onPrev} aria-label="Settimana precedente">
        ‹
      </button>
      <button
        className="week-nav__label"
        onClick={onToday}
        disabled={isCurrent}
        title={isCurrent ? "Sei sulla settimana corrente" : "Torna alla settimana corrente"}
      >
        <span className="week-nav__range">{weekRangeLabel(monday)}</span>
        {!isCurrent && <span className="week-nav__today">torna a oggi</span>}
      </button>
      <button className="week-nav__arrow" onClick={onNext} aria-label="Settimana successiva">
        ›
      </button>
    </div>
  );
}
