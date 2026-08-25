import { MONTH_LABELS } from "./i18n";

// Internal keys used both for display order and as the JSON keys stored in
// Supabase (weeks.menu). Keep these stable even if you add more languages -
// changing them would orphan any week already saved.
export const DAY_KEYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

function pad(n) {
  return String(n).padStart(2, "0");
}

// Returns a Date set to local midnight for the Monday of the week containing `date`.
export function mondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday .. 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addWeeks(date, weeks) {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

// Stable id used as the Supabase primary key, e.g. "2026-08-24"
export function weekId(mondayDate) {
  return `${mondayDate.getFullYear()}-${pad(mondayDate.getMonth() + 1)}-${pad(mondayDate.getDate())}`;
}

export function dateForDayIndex(mondayDate, index) {
  const d = new Date(mondayDate);
  d.setDate(d.getDate() + index);
  return d;
}

export function shortDayDate(date, lang = "it") {
  const months = MONTH_LABELS[lang] ?? MONTH_LABELS.it;
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

export function weekRangeLabel(mondayDate, lang = "it") {
  const months = MONTH_LABELS[lang] ?? MONTH_LABELS.it;
  const sunday = dateForDayIndex(mondayDate, 6);
  const sameMonth = mondayDate.getMonth() === sunday.getMonth();
  const start = sameMonth ? `${mondayDate.getDate()}` : `${mondayDate.getDate()} ${months[mondayDate.getMonth()]}`;
  const end = `${sunday.getDate()} ${months[sunday.getMonth()]}`;
  return `${start}\u2013${end}`;
}

export function isSameWeek(a, b) {
  return weekId(mondayOf(a)) === weekId(mondayOf(b));
}
