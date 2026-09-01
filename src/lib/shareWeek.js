import { DAY_KEYS, dateForDayIndex, shortDayDate, weekRangeLabel } from "./dates";
import { DAY_LABELS, STRINGS } from "./i18n";

// Formats a week into the kind of plain-text message that used to get pasted
// into WhatsApp, so it can be shared or copied straight out of the app.
export function formatWeekAsText({ monday, menu, items, lang }) {
  const s = STRINGS[lang] ?? STRINGS.it;
  const days = DAY_LABELS[lang] ?? DAY_LABELS.it;
  const lines = [];

  lines.push(`${s.shareHeading} ${weekRangeLabel(monday, lang)}`);

  DAY_KEYS.forEach((key, index) => {
    const day = menu?.[key];
    if (!day) return;
    const lunch = (day.pranzo ?? "").trim();
    const dinner = (day.cena ?? "").trim();
    const note = (day.note ?? "").trim();
    if (!lunch && !dinner && !note) return;

    lines.push("");
    lines.push(`${days[key]} ${shortDayDate(dateForDayIndex(monday, index), lang)}`);
    if (lunch) lines.push(`  ${s.mealLunch}: ${lunch}`);
    if (dinner) lines.push(`  ${s.mealDinner}: ${dinner}`);
    if (note) lines.push(`  ${s.dayNoteLabel}: ${note}`);
  });

  const pending = items.filter((i) => !i.checked);
  if (pending.length > 0) {
    lines.push("");
    lines.push(`${s.shareShoppingHeading}`);
    pending.forEach((i) => lines.push(`- ${i.text}`));
  }

  return lines.join("\n");
}

// True when there is genuinely nothing worth sharing yet.
export function weekHasContent({ menu, items }) {
  const menuHasContent = Object.values(menu ?? {}).some(
    (day) => day && ((day.pranzo ?? "").trim() || (day.cena ?? "").trim() || (day.note ?? "").trim())
  );
  return menuHasContent || items.some((i) => !i.checked);
}
