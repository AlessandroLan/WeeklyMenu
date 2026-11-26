import { useState } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { IdeaSubtitle, RecipeLink } from "./IdeaList";
import { ideaName } from "../lib/ideas";

// "Ideas for today" card at the top of the current week: one dish from your
// own library and one new recipe from each recipe site, each placeable in
// today's empty slots.
export default function TodayIdeas({ emptyMeals, getIdeas, onPlace }) {
  const { t } = useLanguage();
  const [shuffle, setShuffle] = useState(0);
  const [busy, setBusy] = useState(false);
  const items = getIdeas(shuffle);

  if (emptyMeals.length === 0 || items.length === 0) return null;

  async function place(item, mealKey) {
    setBusy(true);
    try {
      await onPlace(item, mealKey);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="today-ideas" aria-label={t("todayIdeaTitle")}>
      <div className="today-ideas__header">
        <h2 className="today-ideas__title">
          <Lightbulb size={15} strokeWidth={2.2} aria-hidden="true" />
          {t("todayIdeaTitle")}
        </h2>
        <button
          className="app__icon-button"
          onClick={() => setShuffle((n) => n + 1)}
          aria-label={t("ideasMore")}
          title={t("ideasMore")}
        >
          <RefreshCw size={14} strokeWidth={2.2} />
        </button>
      </div>
      <ul className="today-ideas__list">
        {items.map((item) => (
          <li key={item.type === "recipe" ? item.idea.id : item.dish.id} className="today-ideas__item">
            <div className="today-ideas__text">
              <span className="idea__name">
                {ideaName(item)}
                <RecipeLink url={item.type === "recipe" ? item.idea.url : item.dish.source_url} />
              </span>
              <span className={`idea__sub${item.type === "recipe" ? " idea__sub--new" : ""}`}>
                <IdeaSubtitle item={item} />
              </span>
            </div>
            <div className="today-ideas__actions">
              {emptyMeals.map((meal) => (
                <button
                  key={meal.key}
                  className="today-ideas__place"
                  disabled={busy}
                  onClick={() => place(item, meal.key)}
                >
                  {meal.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
