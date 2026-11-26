// Reads public recipe RSS feeds and saves new entries to the recipe_ideas table
// as title + link + date only. Recipe text and photos are never stored: the app
// shows the title and opens the recipe on its own site.
//
// Run by .github/workflows/recipe-ideas.yml once a day. Locally:
//   node --env-file=.env.development.local scripts/fetch-recipe-ideas.mjs [--dry-run]
//
// Needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (the same values the app
// uses). The anon key may only insert and read recipe_ideas - see schema.sql.

import { pathToFileURL } from "node:url";

const FEEDS = [{ source: "giallozafferano", url: "https://www.giallozafferano.it/feed" }];

// Titles that are desserts, drinks or bakes rather than a lunch or dinner. The
// feed has no categories, so this is a best guess from the title; the app only
// suggests 'meal' ideas.
const DESSERT_WORDS = [
  "torta", "torte", "crostata", "biscott", "cookie", "dolce", "dolci", "dessert",
  "tiramis", "muffin", "plumcake", "plum cake", "budino", "panna cotta", "cheesecake",
  "brownie", "ciambell", "mousse", "semifreddo", "gelato", "sorbetto", "panetton",
  "cioccolat", "cacao", "nutella", "candit", "uvetta", "mele",
  "pandoro", "cantucci", "frittelle dolci", "zeppole", "bign", "cupcake", "pancake",
  "crêpes dolci", "meringh", "praline", "cioccolatini", "tartufini", "confettura",
  "marmellata", "liquore", "cocktail", "smoothie", "frullato", "crema pasticcera",
  "glassa", "croissant", "brioche", "babà", "cannoli", "sbriciolata", "strudel",
  "millefoglie", "profiterole", "salame di cioccolato", "torroncin", "torrone",
];

const UNESCAPE = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };

function decode(text) {
  return text
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, code) => {
      if (code[0] === "#") {
        const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return UNESCAPE[code.toLowerCase()] ?? m;
    })
    .trim();
}

function tag(item, name) {
  const m = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : null;
}

// Words that make a "torta" or "cheesecake" savoury ("torta di patate",
// "cheesecake salata"). They win over the dessert words.
const SAVOURY_WORDS = [
  "salat", "patat", "fungh", "funghi", "verdur", "spinac", "zucchin", "broccol", "carciof",
  "porri", "cipoll", "prosciutt", "speck", "pancett", "salmon", "tonno", "pollo", "carne",
  "salsicc", "gorgonzol", "provol", "scamorz", "pecorin", "parmigian",
];

export function kindOf(title) {
  const t = title.toLowerCase();
  if (SAVOURY_WORDS.some((w) => t.includes(w))) return "meal";
  return DESSERT_WORDS.some((w) => t.includes(w)) ? "dessert" : "meal";
}

// Only title, link and date are read from each item.
export function parseFeed(xml, source) {
  return xml
    .split(/<item[\s>]/)
    .slice(1)
    .map((item) => {
      const title = tag(item, "title");
      const url = tag(item, "link");
      const date = tag(item, "pubDate");
      if (!title || !url || !/^https:\/\//.test(url)) return null;
      const published = date ? new Date(date) : null;
      return {
        source,
        title,
        url,
        kind: kindOf(title),
        published_at: published && !Number.isNaN(published.valueOf()) ? published.toISOString() : null,
      };
    })
    .filter(Boolean);
}

async function save(rows) {
  const base = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set");
  // ignore-duplicates = ON CONFLICT (url) DO NOTHING: already-saved ideas are
  // skipped, and only insert permission is needed.
  const res = await fetch(`${base}/rest/v1/recipe_ideas?on_conflict=url`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase insert failed: ${res.status} ${await res.text()}`);
  return (await res.json()).length;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  let failures = 0;
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, { headers: { "User-Agent": "WeeklyMenu-feed-reader/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = parseFeed(await res.text(), feed.source);
      const meals = rows.filter((r) => r.kind === "meal").length;
      if (dryRun) {
        console.log(`${feed.source}: ${rows.length} items (${meals} meals, ${rows.length - meals} desserts), not saved`);
        continue;
      }
      const added = rows.length ? await save(rows) : 0;
      console.log(`${feed.source}: ${rows.length} items read, ${added} new`);
    } catch (err) {
      failures += 1;
      console.error(`${feed.source}: ${err.message}`);
    }
  }
  if (failures) process.exitCode = 1;
}

// Run only when executed directly, so the parser can be imported for checks.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
