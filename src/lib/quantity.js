// Units we recognise. Keys are what the user might type (any case), values are
// how the unit is displayed. Anything not in here is left as part of the item
// name rather than guessed at - a wrong guess is worse than no quantity.
const UNITS = {
  g: "g",
  gr: "g",
  grammi: "g",
  grams: "g",
  kg: "kg",
  chilo: "kg",
  chili: "kg",
  kilo: "kg",
  kilos: "kg",
  ml: "ml",
  cl: "cl",
  l: "l",
  lt: "l",
  litro: "l",
  litri: "l",
  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
  pz: "pz",
  pcs: "pcs",
  pc: "pcs",
  conf: "conf",
  pack: "pack",
  packs: "pack",
  bottiglia: "bott.",
  bottiglie: "bott.",
  bottle: "bottle",
  bottles: "bottle",
};

const UNIT_KEYS = Object.keys(UNITS).sort((a, b) => b.length - a.length);
const UNIT_PATTERN = UNIT_KEYS.join("|");

// "3", "1,5", "0.5"
const NUM = "\\d+(?:[.,]\\d+)?";

function toNumber(raw) {
  return parseFloat(raw.replace(",", "."));
}

// Ordered most-specific first. Each returns { amount, unit, name }.
const PATTERNS = [
  // leading amount + unit: "500g pasta", "2 kg patate", "1,5 l latte"
  {
    re: new RegExp(`^(${NUM})\\s*(${UNIT_PATTERN})\\b\\s*(?:di\\s+|of\\s+)?(.+)$`, "i"),
    take: (m) => ({ amount: toNumber(m[1]), unit: UNITS[m[2].toLowerCase()], name: m[3] }),
  },
  // trailing amount + unit: "pasta 500g", "patate 2 kg"
  {
    re: new RegExp(`^(.+?)[\\s,]+(${NUM})\\s*(${UNIT_PATTERN})$`, "i"),
    take: (m) => ({ amount: toNumber(m[2]), unit: UNITS[m[3].toLowerCase()], name: m[1] }),
  },
  // trailing xN: "mozzarella x3", "yogurt X 4"
  {
    re: new RegExp(`^(.+?)[\\s,]*[xX×]\\s*(${NUM})$`),
    take: (m) => ({ amount: toNumber(m[2]), unit: null, name: m[1] }),
  },
  // leading count: "3 mozzarella", "2 avocado"
  {
    re: new RegExp(`^(${NUM})\\s+(?:di\\s+|of\\s+)?(.+)$`),
    take: (m) => ({ amount: toNumber(m[1]), unit: null, name: m[2] }),
  },
];

// Turns free text into { text, amount, unit }. Any input that doesn't clearly
// carry a quantity comes back unchanged with amount/unit null.
export function parseItemText(input) {
  const raw = (input ?? "").trim();
  if (!raw) return { text: "", amount: null, unit: null };

  for (const { re, take } of PATTERNS) {
    const m = raw.match(re);
    if (!m) continue;
    const { amount, unit, name } = take(m);
    const text = name.trim().replace(/[\s,]+$/, "");
    // A quantity with nothing left over isn't a shopping item ("500g"), and a
    // NaN amount means the number didn't survive parsing - keep those as text.
    if (!text || !Number.isFinite(amount)) break;
    return { text, amount, unit: unit ?? null };
  }

  return { text: raw, amount: null, unit: null };
}

// Renders the quantity pill: "500 g", "2 kg", "3".
export function formatQuantity(amount, unit) {
  if (amount === null || amount === undefined) return null;
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  // Drop the trailing ".0" that Postgres numerics come back with.
  const shown = Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
  return unit ? `${shown} ${unit}` : shown;
}

// The editable form of an item - what the user typed, reconstructed.
export function itemToRawText(item) {
  const qty = formatQuantity(item.amount, item.unit);
  if (!qty) return item.text;
  return item.unit ? `${item.text} ${qty}` : `${item.text} x${qty}`;
}
