import { useState } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { IdeaSubtitle, RecipeLink } from "./IdeaList";
import { ideaName } from "../lib/ideas";

// The opened "Ideas for today" list (the toggle chip lives in MenuTab): one
// dish from your own library and one new recipe from each recipe site, each
// placeable in today's empty slots.
export default function TodayIdeas({ id, items, emptyMeals, onPlace, onMore }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  async function place(item, mealKey) {
    setBusy(true);
    try {
      await onPlace(item, mealKey);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id={id} className="today-ideas" aria-label={t("todayIdeaTitle")}>
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
      <button type="button" className="idea-pop__more" onClick={onMore}>
        {t("ideasMore")}
      </button>
    </section>
  );
}
