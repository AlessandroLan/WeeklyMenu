export const DAYS = [
  { key: "lun", label: "Lunedì" },
  { key: "mar", label: "Martedì" },
  { key: "mer", label: "Mercoledì" },
  { key: "gio", label: "Giovedì" },
  { key: "ven", label: "Venerdì" },
  { key: "sab", label: "Sabato" },
  { key: "dom", label: "Domenica" },
];

const MONTHS_IT = [
  "gen", "feb", "mar", "apr", "mag", "giu",
  "lug", "ago", "set", "ott", "nov", "dic",
];

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

export function shortDayDate(date) {
  return `${date.getDate()} ${MONTHS_IT[date.getMonth()]}`;
}

export function weekRangeLabel(mondayDate) {
  const sunday = dateForDayIndex(mondayDate, 6);
  const sameMonth = mondayDate.getMonth() === sunday.getMonth();
  const start = sameMonth
    ? `${mondayDate.getDate()}`
    : `${mondayDate.getDate()} ${MONTHS_IT[mondayDate.getMonth()]}`;
  const end = `${sunday.getDate()} ${MONTHS_IT[sunday.getMonth()]}`;
  return `${start}\u2013${end}`;
}

export function isSameWeek(a, b) {
  return weekId(mondayOf(a)) === weekId(mondayOf(b));
}
