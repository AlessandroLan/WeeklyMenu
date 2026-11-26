import { useState } from "react";
import { ChevronDown, Copy, Lightbulb } from "lucide-react";
import { DAY_KEYS, dateForDayIndex, weekId } from "../lib/dates";
import { DAY_LABELS } from "../lib/i18n";
import { useLanguage } from "../lib/LanguageContext";
import { pickDishIdeas, pickRecipeIdeas, plannedMeals, seededRandom } from "../lib/ideas";
import DayCard from "./DayCard";
import TodayIdeas from "./TodayIdeas";

// Whether "Ideas for today" was left open on this phone (closed by default).
const TODAY_OPEN_KEY = "menu-app-today-ideas-open";

export default function MenuTab({
  monday,
  menu,
  dishes,
  dishStats,
  recipeIdeas,
  isCurrentWeek,
  onSave,
  onAdoptIdea,
  onDuplicate,
  showToast,
}) {
  const { lang, t } = useLanguage();
  const planned = plannedMeals(menu);
  const [todayOpen, setTodayOpen] = useState(() => localStorage.getItem(TODAY_OPEN_KEY) === "true");
  const [todayShuffle, setTodayShuffle] = useState(0);
  const week = weekId(monday);

  // Ideas are seeded by week + slot + how many times "more ideas" was pressed,
  // so they stay put between renders and only change when asked.
  function getIdeas(seed, { dishCount }) {
    const random = seededRandom(`${week}:${seed}`);
    return [
      ...pickDishIdeas({ dishes, stats: dishStats, planned, count: dishCount, random }),
      ...pickRecipeIdeas({ ideas: recipeIdeas, dishes, planned, perSource: 1, random }),
    ];
  }

  // The dish name to write in the menu for a picked idea. A recipe-site idea is
  // added to the dish library first.
  async function nameForIdea(item) {
    return item.type === "recipe" ? onAdoptIdea(item.idea) : item.dish.name;
  }

  const meals = [
    { key: "pranzo", label: t("todayIdeaLunch"), name: t("mealLunch") },
    { key: "cena", label: t("todayIdeaDinner"), name: t("mealDinner") },
  ];
  const todayKey = DAY_KEYS[(new Date().getDay() + 6) % 7];
  const todayEmpty = isCurrentWeek ? meals.filter((m) => !(menu?.[todayKey]?.[m.key] ?? "").trim()) : [];

  const todayItems =
    todayEmpty.length > 0 ? getIdeas(`today:${todayShuffle}`, { dishCount: 1 }) : [];

  function toggleToday() {
    setTodayOpen((open) => {
      localStorage.setItem(TODAY_OPEN_KEY, String(!open));
      return !open;
    });
  }

  async function placeToday(item, mealKey) {
    const name = await nameForIdea(item);
    await onSave(todayKey, mealKey, name);
    const meal = meals.find((m) => m.key === mealKey);
    showToast(t("todayIdeaPlaced", { name, meal: meal.name.toLowerCase() }));
  }

  return (
    <div className="menu-tab">
      <div className="menu-tab__toolbar">
        <button className="menu-tab__duplicate" onClick={onDuplicate}>
          <Copy size={14} strokeWidth={2.2} />
          {t("duplicateWeekButton")}
        </button>
        {todayItems.length > 0 && (
          <button
            className={`menu-tab__duplicate menu-tab__ideas${todayOpen ? " menu-tab__ideas--open" : ""}`}
            onClick={toggleToday}
            aria-expanded={todayOpen}
            aria-controls="today-ideas"
          >
            <Lightbulb size={14} strokeWidth={2.2} />
            {t("todayIdeaTitle")}
            <ChevronDown size={14} strokeWidth={2.4} className="menu-tab__chevron" />
          </button>
        )}
      </div>
      {todayOpen && todayItems.length > 0 && (
        <TodayIdeas
          id="today-ideas"
          items={todayItems}
          emptyMeals={todayEmpty}
          onPlace={placeToday}
          onMore={() => setTodayShuffle((n) => n + 1)}
        />
      )}
      {DAY_KEYS.map((dayKey, index) => (
        <DayCard
          key={dayKey}
          dayKey={dayKey}
          label={DAY_LABELS[lang][dayKey]}
          date={dateForDayIndex(monday, index)}
          value={menu?.[dayKey]}
          dishes={dishes}
          getIdeas={(mealKey, shuffle) =>
            getIdeas(`${dayKey}:${mealKey}:${shuffle}`, { dishCount: 3 })
          }
          nameForIdea={nameForIdea}
          onSave={onSave}
        />
      ))}
    </div>
  );
}
