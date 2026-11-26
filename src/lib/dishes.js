import { DAY_KEYS, dateForDayIndex } from "./dates";

const MEAL_KEYS = ["pranzo", "cena"];

// Little words that don't change which dish it is: "pasta w/ pesto" and
// "pasta al pesto" are the same thing. Italian, English and Polish, since the
// menu is written in all three.
const FILLER_WORDS = new Set([
  "with", "and", "w", "of", "the",
  "con", "e", "al", "alla", "allo", "ai", "alle", "agli", "di", "del", "della", "in",
  "z", "i", "ze",
]);

// Lowercase, no accents, no punctuation, single spaces. "Baos ?" -> "baos".
export function normalizeName(name) {
  return (name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\bw\//g, "with ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// The words that matter, sorted, so word order and filler words don't count.
function keyWords(normalized) {
  return normalized
    .split(" ")
    .filter((w) => w && !FILLER_WORDS.has(w))
    .sort();
}

// How many typos a word of this length may contain and still count as the
// same word. Short words must match exactly: "test" is not "pesto".
function typoAllowance(length) {
  if (length >= 7) return 2;
  if (length >= 5) return 1;
  return 0;
}

function editDistance(a, b) {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = temp;
    }
  }
  return prev[b.length];
}

// True when two names are very likely the same dish: the same words in any
// order, each at most a typo apart ("gateaux"/"gatteux", "kotlet"/"kotlety").
// Kept strict on purpose - merging two different dishes is worse than leaving
// a duplicate.
export function isSameDish(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const wa = keyWords(na);
  const wb = keyWords(nb);
  if (wa.length === 0 || wa.length !== wb.length) return false;
  return wa.every((word, i) => {
    const other = wb[i];
    return editDistance(word, other) <= typoAllowance(Math.min(word.length, other.length));
  });
}

// The library dish a free-text meal refers to, if any.
export function findDish(text, dishes) {
  if (!normalizeName(text)) return null;
  return dishes.find((d) => isSameDish(d.name, text)) ?? null;
}

// Dish names for the autocomplete under a meal field, best first: names that
// start with what's typed, then names with a later word starting with it, then
// names containing it anywhere. An exact match isn't suggested back.
export function suggestDishes(query, dishes, limit = 5) {
  const q = normalizeName(query);
  if (!q) return [];
  const tiers = [[], [], []];
  for (const dish of dishes) {
    const n = normalizeName(dish.name);
    if (n === q) continue;
    if (n.startsWith(q)) tiers[0].push(dish);
    else if (n.split(" ").some((w) => w.startsWith(q))) tiers[1].push(dish);
    else if (n.includes(q)) tiers[2].push(dish);
  }
  const byName = (a, b) => a.name.localeCompare(b.name);
  return tiers.flatMap((tier) => tier.sort(byName)).slice(0, limit);
}

// Every meal ever planned, as { text, date } - one entry per lunch/dinner slot.
export function mealsFromWeeks(weeks) {
  const meals = [];
  for (const week of weeks) {
    const [y, m, d] = week.id.split("-").map(Number);
    const monday = new Date(y, m - 1, d);
    DAY_KEYS.forEach((dayKey, index) => {
      const day = week.menu?.[dayKey];
      if (!day) return;
      for (const mealKey of MEAL_KEYS) {
        const text = (day[mealKey] ?? "").trim();
        if (text) meals.push({ text, date: dateForDayIndex(monday, index) });
      }
    });
  }
  return meals;
}

// Groups past meals into suggested dishes for the import screen. Spellings of
// the same dish are merged; the name shown is the most used spelling (ties go
// to the most recent). Meals that already match a library dish are left out.
export function importCandidates(meals, existingDishes) {
  const groups = [];
  for (const meal of meals) {
    if (findDish(meal.text, existingDishes)) continue;
    let group = groups.find((g) => g.spellings.some((s) => isSameDish(s.text, meal.text)));
    if (!group) {
      group = { spellings: [], count: 0, lastDate: meal.date };
      groups.push(group);
    }
    group.count += 1;
    if (meal.date > group.lastDate) group.lastDate = meal.date;
    let spelling = group.spellings.find((s) => s.text.toLowerCase() === meal.text.toLowerCase());
    if (!spelling) {
      spelling = { text: meal.text, count: 0, lastDate: meal.date };
      group.spellings.push(spelling);
    }
    spelling.count += 1;
    if (meal.date > spelling.lastDate) spelling.lastDate = meal.date;
  }

  return groups
    .map((g) => {
      const best = [...g.spellings].sort((a, b) => b.count - a.count || b.lastDate - a.lastDate)[0];
      return {
        name: capitalize(best.text),
        variants: g.spellings.map((s) => s.text).filter((t) => t !== best.text),
        count: g.count,
        lastDate: g.lastDate,
      };
    })
    .sort((a, b) => b.count - a.count || b.lastDate - a.lastDate);
}

export function capitalize(text) {
  const t = (text ?? "").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}
