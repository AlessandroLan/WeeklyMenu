import { findDish, isSameDish, mealsFromWeeks } from "./dishes";

const DAY_MS = 24 * 60 * 60 * 1000;

// Dishes eaten this recently aren't suggested again.
const MIN_DAYS_BETWEEN = 6;
// How long ago a never-eaten dish counts as, for ranking.
const NEVER_EATEN_DAYS = 45;
// Past this, "longer ago" stops making a dish more likely.
const MAX_DAYS = 60;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysBetween(earlier, later) {
  return Math.round((startOfDay(later) - startOfDay(earlier)) / DAY_MS);
}

// For each library dish: how many times it was eaten and when last, counting
// only meals up to today (planned future meals haven't been eaten yet).
// Returns a Map of dish id -> { count, lastDate }.
export function dishHistory(weeks, dishes, today = new Date()) {
  const stats = new Map();
  const cutoff = startOfDay(today);
  for (const meal of mealsFromWeeks(weeks)) {
    if (meal.date > cutoff) continue;
    const dish = findDish(meal.text, dishes);
    if (!dish) continue;
    const s = stats.get(dish.id) ?? { count: 0, lastDate: null };
    s.count += 1;
    if (!s.lastDate || meal.date > s.lastDate) s.lastDate = meal.date;
    stats.set(dish.id, s);
  }
  return stats;
}

// Small seeded random generator, so the same day shows the same ideas until
// someone asks for others (instead of reshuffling on every render).
export function seededRandom(seedText) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedSample(entries, count, random) {
  const pool = entries.filter((e) => e.weight > 0);
  const picked = [];
  while (picked.length < count && pool.length) {
    const total = pool.reduce((sum, e) => sum + e.weight, 0);
    let r = random() * total;
    let index = pool.findIndex((e) => (r -= e.weight) <= 0);
    if (index === -1) index = pool.length - 1;
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

// Ideas from the dish library: favours dishes not eaten for a while, with a
// nudge for ones you make often. Skips anything already planned this week or
// eaten in the last few days.
//   planned: meal texts already in the week being planned.
export function pickDishIdeas({ dishes, stats, planned, count = 3, random = Math.random, today = new Date() }) {
  const candidates = dishes
    .filter((dish) => !planned.some((text) => isSameDish(dish.name, text)))
    .map((dish) => {
      const s = stats.get(dish.id);
      const days = s?.lastDate ? daysBetween(s.lastDate, today) : NEVER_EATEN_DAYS;
      if (days < MIN_DAYS_BETWEEN) return { dish, weight: 0 };
      const favourite = 1 + 0.5 * Math.log(1 + (s?.count ?? 0));
      return { dish, stats: s, weight: Math.min(days, MAX_DAYS) * favourite };
    });
  return weightedSample(candidates, count, random).map(({ dish, stats: s }) => ({
    type: "dish",
    dish,
    count: s?.count ?? 0,
    lastDate: s?.lastDate ?? null,
  }));
}

// New ideas from recipe sites: recent meal recipes that aren't already a
// library dish or planned this week. `perSource` ideas from each site, so
// both the Italian and the Polish site are always represented.
export function pickRecipeIdeas({ ideas, dishes, planned, perSource = 1, random = Math.random }) {
  const fresh = ideas
    .filter((idea) => idea.kind === "meal")
    .filter((idea) => !dishes.some((d) => isSameDish(d.name, idea.title)))
    .filter((idea) => !planned.some((text) => isSameDish(idea.title, text)));
  const sources = [...new Set(fresh.map((idea) => idea.source))].sort(
    (a, b) => SOURCE_ORDER.indexOf(a) - SOURCE_ORDER.indexOf(b)
  );
  return sources.flatMap((source) =>
    weightedSample(
      fresh.filter((idea) => idea.source === source).map((idea) => ({ idea, weight: 1 })),
      perSource,
      random
    ).map(({ idea }) => ({ type: "recipe", idea }))
  );
}

// Meal texts in a week's menu.
export function plannedMeals(menu) {
  return Object.values(menu ?? {})
    .flatMap((day) => [day?.pranzo, day?.cena])
    .map((text) => (text ?? "").trim())
    .filter(Boolean);
}

export function ideaName(item) {
  return item.type === "recipe" ? item.idea.title : item.dish.name;
}

export const SOURCE_LABELS = {
  giallozafferano: "GialloZafferano",
  kwestiasmaku: "Kwestia Smaku",
};

// Recipe sites, in the order their ideas are shown.
export const SOURCE_ORDER = ["giallozafferano", "kwestiasmaku"];
