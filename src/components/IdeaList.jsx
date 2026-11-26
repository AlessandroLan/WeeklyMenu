import { useRef } from "react";
import { ExternalLink } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { shortDayDate } from "../lib/dates";
import { SOURCE_LABELS, ideaName } from "../lib/ideas";
import { useFitAboveNav } from "../lib/useFitAboveNav";

// One line of explanation under an idea: when it was last made, or where a new
// recipe idea comes from.
export function IdeaSubtitle({ item }) {
  const { lang, t } = useLanguage();
  if (item.type === "recipe") {
    return t("ideaNew", { source: SOURCE_LABELS[item.idea.source] ?? item.idea.source });
  }
  return item.lastDate ? t("ideaLast", { date: shortDayDate(item.lastDate, lang) }) : t("dishNever");
}

// Opens a recipe idea on its own site (or a dish's saved recipe link).
export function RecipeLink({ url }) {
  const { t } = useLanguage();
  if (!url) return null;
  return (
    <a
      className="idea__link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("dishOpenRecipe")}
      title={t("dishOpenRecipe")}
    >
      <ExternalLink size={15} strokeWidth={2.2} />
    </a>
  );
}

// The ideas popover under an empty meal slot.
export default function IdeaList({ items, onPick, onMore }) {
  const { t } = useLanguage();
  const ref = useRef(null);
  const up = useFitAboveNav(ref);

  return (
    <div
      ref={ref}
      className={`idea-pop${up ? " idea-pop--up" : ""}`}
      role="dialog"
      aria-label={t("ideasTitle")}
    >
      {items.length === 0 ? (
        <p className="idea-pop__empty">{t("ideasNone")}</p>
      ) : (
        <ul className="idea-pop__list">
          {items.map((item) => (
            <li key={item.type === "recipe" ? item.idea.id : item.dish.id} className="idea">
              <button
                type="button"
                className="idea__pick"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(item)}
              >
                <span className="idea__name">{ideaName(item)}</span>
                <span className={`idea__sub${item.type === "recipe" ? " idea__sub--new" : ""}`}>
                  <IdeaSubtitle item={item} />
                </span>
              </button>
              <RecipeLink url={item.type === "recipe" ? item.idea.url : item.dish.source_url} />
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="idea-pop__more" onClick={onMore}>
        {t("ideasMore")}
      </button>
    </div>
  );
}
