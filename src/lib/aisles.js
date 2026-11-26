import { editDistance, normalizeName, typoAllowance } from "./dishes";

// Supermarket sections. Keys are stored in the database (learned items, aisle
// order), so keep them stable; names come from i18n ("aisle_<key>").
export const AISLES = [
  "produce",
  "bakery",
  "meat_fish",
  "deli",
  "dairy",
  "pantry",
  "canned",
  "breakfast_sweets",
  "drinks",
  "frozen",
  "household",
  "other",
];

// Section order until it's rearranged in the app.
export const DEFAULT_ORDER = AISLES;

// Words that place an item, in Italian, English and Polish (the list is
// written in all three). Each matches the start of a word, so "pomodor" covers
// "pomodori" and "pomodoro"; a trailing "!" means the whole word only ("mela!"
// isn't "melanzane"). Phrases are fine. When several match, the longest wins:
// "tomato sauce" (canned) beats "tomato" (produce), "peanut butter" beats
// "butter". A leading "^" marks a word that decides on its own whatever else
// is in the name - "frozen", "juice", "in a can": "mrożone warzywa" is frozen,
// "sok pomarańczowy" a drink. Accents don't matter ("drożdże" = "drozdze").
const WORDS = {
  produce: [
    // it
    "frutta", "verdur", "insalat", "lattuga", "rucola", "spinaci", "pomodor", "patat", "cipoll",
    "aglio", "carot", "zucchin", "melanzan", "peperon", "funghi", "champignon", "broccol",
    "cavolfior", "cavol", "verza", "finocch", "sedano", "porri", "zucca", "cetriol", "ravanell",
    "basilico", "prezzemol", "rosmarino", "salvia", "limon", "aranc", "mandarin", "mela!", "mele!",
    "pera!", "pere!", "banan", "uva!", "fragol", "kiwi", "ananas", "avocado", "lampon", "mirtill",
    "pesche", "albicocc", "cachi", "melone", "anguria", "carciof", "asparag", "fagiolini",
    "zenzero", "erbe",
    // en
    "fruit", "vegetable", "veggie", "salad", "lettuce", "rocket", "spinach", "tomato", "potato",
    "onion", "garlic", "carrot", "zucchini", "courgette", "eggplant", "aubergine", "bell pepper",
    "pepper!", "peppers", "mushroom", "broccoli", "cauliflower", "cabbage", "celery", "fennel",
    "leek", "pumpkin", "squash", "cucumber", "radish", "herbs", "parsley", "basil", "lemon", "lime",
    "orange", "apple", "pear!", "pears", "banana", "grape", "strawberr", "raspberr", "blueberr",
    "berries", "peach", "plum", "melon", "watermelon", "ginger", "coleslaw", "beetroot", "beets",
    "avocado", "kale", "dill",
    // pl
    "owoc", "warzyw", "sałat", "rukol", "szpinak", "pomidor", "ziemniak", "kartofl", "cebul",
    "czosn", "marchew", "marchewk", "cukini", "bakłażan", "papryk", "pieczark", "grzyb", "brokuł",
    "kalafior", "kapust", "seler", "koper", "pietruszk", "por!", "pory!", "dyni", "dynia", "ogór",
    "rzodkiew", "cytryn", "pomarańcz", "mandaryn", "jabłk", "grusz", "banan", "winogron",
    "truskaw", "malin", "borówk", "śliwk", "brzoskwin", "arbuz", "imbir", "buraki", "burak",
    "włoszczyzn", "szczypior", "natka",
  ],
  bakery: [
    "hamburger bun", "burger bun", "bułki do burger", "pane!", "pan bauletto", "panin", "panino", "focacc", "piadin", "grissin", "crackers",
    "fette biscottate", "tortill", "bread", "baguette", "roll!", "rolls", "bun!", "buns", "bagel",
    "wrap!", "wraps", "pita", "croissant", "chleb", "bułk", "bulk", "bagietk", "rogal", "pieczyw",
    "chlebek",
  ],
  meat_fish: [
    // it
    "carne", "macinat", "pollo", "petto di pollo", "tacchino", "manzo", "vitello", "maiale",
    "salsicc", "hamburger", "bistecc", "fettin", "cotolett", "spezzatino", "costin", "agnello",
    "pesce", "salmone", "merluzz", "tonno fresco", "gamber", "cozze", "vongol", "calamar",
    "polpo", "orata", "branzino",
    // en
    "meat", "mince", "minced", "chicken", "turkey", "beef", "pork", "veal", "lamb", "sausage",
    "burger", "steak", "ribs", "fish", "salmon", "cod!", "shrimp", "prawn", "mussel", "squid",
    // pl
    "mięso", "mieso", "mielon", "kurczak", "kurczę", "pierś", "piers", "udka", "udko",
    "skrzydełk", "indyk", "wołow", "wieprzow", "schab", "karkówk", "żeberk", "kotlet", "kiełbask",
    "ryba", "ryby", "łosoś", "łososi", "dorsz", "krewetk", "filet",
  ],
  deli: [
    // it
    "prosciutto", "cotto", "crudo", "mortadell", "salame", "salami", "speck", "bresaola",
    "pancett", "guanciale", "wurstel", "affettat", "parmigian", "grana", "pecorin", "scamorz",
    "provol", "gorgonzol", "taleggio", "fontina", "asiago", "emmental", "formagg", "fontal",
    // en
    "ham!", "cold cut", "coldcut", "bacon", "cheddar", "gouda", "brie", "camembert", "cheese",
    "hummus",
    // pl
    "szynk", "wędlin", "wedlin", "kiełbas", "kielbas", "boczek", "boczk", "salami", "kabanos",
    "parówk", "ser żółty", "żółty ser", "ser!", "sery",
  ],
  dairy: [
    // it
    "latte", "yogurt", "jogurt", "burro", "panna", "uova", "uovo", "mozzarell", "burrata",
    "ricotta", "mascarpone", "stracchino", "philadelphia", "feta", "skyr", "kefir", "lievito fresco",
    // en
    "milk", "yoghurt", "butter", "cream", "egg!", "eggs", "cottage", "cream cheese", "sour cream",
    // pl
    "mleko", "maślank", "maslank", "masło", "maslo", "śmietan", "jajk", "jaja", "twaróg", "twarog",
    "serek", "serki", "jogurt", "drożdże świeże",
  ],
  pantry: [
    // it
    "pasta!", "spaghett", "penne", "fusill", "rigaton", "orecchiett", "tagliatell",
    "lasagn", "gnocchi", "riso", "farina", "zucchero", "sale!", "olio", "aceto", "lievito",
    "pangrattato", "brodo", "dado", "spezie", "pepe!", "origano", "noci", "mandorl", "nocciol",
    "pinoli", "semi", "cous cous", "couscous", "quinoa", "lenticchie secche", "farro", "polenta",
    // en
    "olive oil", "pasta", "spaghetti", "noodle", "rice", "flour", "sugar", "salt", "oil", "vinegar", "yeast",
    "panko", "breadcrumb", "stock", "bouillon", "spice", "paprika powder", "cinnamon", "nuts",
    "almond", "walnut", "hazelnut", "seeds", "lentils", "chickpeas dry",
    // pl
    "makaron", "ryż", "ryz", "mąka", "maka", "cukier", "sól", "olej", "oliwa", "ocet", "drożdż",
    "drozdz", "bułka tarta", "bulka tarta", "kasza", "orzech", "migdał", "przypraw", "pieprz",
    "bulion", "kostka rosołowa", "pestki", "nasiona", "soczewica",
  ],
  canned: [
    // it
    "passata", "polpa", "pelati", "concentrato", "sugo", "pesto", "tonno", "fagioli", "ceci",
    "lenticchie", "mais", "piselli in scatola", "olive", "capperi", "sottaceti", "pomodori secchi",
    "maionese", "ketchup", "senape", "conserv",
    // en
    "tomato sauce", "tomato paste", "^canned", "^tinned", "^in scatola", "^in barattolo", "beans", "chickpeas", "corn", "tuna",
    "olives", "pickle", "mayo", "mayonnaise", "mustard", "sauce", "jar!",
    // pl
    "koncentrat", "przecier", "sos", "pomidory w puszce", "^w puszce", "^ze słoika", "puszk", "fasol",
    "ciecierzyc", "kukurydz", "tuńczyk", "tunczyk", "oliwk", "ogórki kiszone", "ogorki kiszone",
    "kiszon", "korniszon", "majonez", "musztard", "keczup", "ketchup", "chrzan",
  ],
  breakfast_sweets: [
    // it
    "caffè", "caffe", "tè!", "the!", "tisan", "cereali", "fiocchi d'avena", "avena", "muesli",
    "granola", "biscott", "marmellat", "confettur", "nutella", "miele", "cioccolat", "cacao",
    "savoiardi", "merendin", "snack", "patatine", "caramell", "budino", "crema spalmabile",
    // en
    "coffee", "tea!", "teabag", "cereal", "oats", "oatmeal", "porridge", "jam", "honey",
    "chocolate", "cookie", "biscuit", "ladyfinger", "lady finger", "ladys finger", "candy",
    "sweets", "chips", "crisps", "peanut butter", "pudding", "snacks",
    // pl
    "kawa", "kawę", "herbat", "płatki", "platki", "owsian", "musli", "dżem", "dzem", "miód", "miod",
    "czekolad", "ciastk", "ciasteczk", "herbatnik", "budyń", "budyn", "kajmak", "krówk",
    "słodycz", "chipsy", "paluszk", "masło orzechowe", "kisiel", "wafel", "wafl",
  ],
  drinks: [
    "acqua", "^succo", "birra", "vino", "bibit", "aranciata", "coca", "spremuta",
    "water", "^juice", "beer", "wine", "soda", "cola", "sparkling", "drink",
    "woda", "wody", "^sok!", "^soki", "piwo", "wino", "napój", "napoj", "lemoniad",
  ],
  frozen: [
    "^surgelat", "gelato", "gelati", "bastoncini", "^frozen", "ice cream", "ice!", "^mrożon",
    "^mrozon", "lody!", "lód", "frytki",
  ],
  household: [
    // it
    "detersiv", "sapone", "shampoo", "bagnoschiuma", "dentifricio", "spazzolin", "carta igienica",
    "carta assorbente", "scottex", "tovaglioli", "spugn", "sacchetti", "sacchi", "pellicola",
    "alluminio", "candeggina", "ammorbidente", "pannolin", "assorbenti", "deodorante",
    // en
    "soap", "detergent", "dish", "washing", "shower gel", "shampoo", "toothpaste", "toothbrush",
    "toilet paper", "paper towel", "kitchen roll", "napkin", "tissues", "sponge", "trash bag",
    "bin bag", "garbage bag", "plastic bag", "freezer bag", "freezing bag", "bags", "foil",
    "cling film", "bleach", "softener", "deodorant", "cleaner",
    // pl
    "płyn", "plyn", "mydło", "mydlo", "żel pod prysznic", "zel pod prysznic", "szampon",
    "pasta do zębów", "pasta do zebow", "szczoteczk", "papier toaletowy", "ręcznik papierow",
    "recznik papierow", "ręczniki papierowe", "serwetk", "chusteczk", "gąbk", "gabk", "zmywak",
    "worki", "woreczk", "folia", "tabletki do zmywarki", "proszek do prania", "domestos",
  ],
};

// Normalised once: { aisle, word (normalised), whole }.
const ENTRIES = Object.entries(WORDS).flatMap(([aisle, words]) =>
  words.map((raw) => {
    const decisive = raw.startsWith("^");
    const whole = raw.endsWith("!");
    const word = raw.slice(decisive ? 1 : 0, whole ? -1 : undefined);
    return { aisle, word: normalizeName(word), whole, decisive };
  })
);

function matches(text, { word, whole }) {
  let from = 0;
  for (;;) {
    const i = text.indexOf(word, from);
    if (i === -1) return false;
    const startsWord = i === 0 || text[i - 1] === " ";
    const end = i + word.length;
    const endsOk = !whole || end === text.length || text[end] === " ";
    if (startsWord && endsOk) return true;
    from = i + 1;
  }
}

// Best guess from the word list: a decisive word wins, otherwise the longest
// matching word; if nothing matches, allow a typo in longer words ("mozarella").
export function guessAisle(itemText) {
  const text = normalizeName(itemText);
  if (!text) return "other";

  let best = null;
  for (const entry of ENTRIES) {
    if (!matches(text, entry)) continue;
    const better =
      !best ||
      (entry.decisive && !best.decisive) ||
      (entry.decisive === best.decisive && entry.word.length > best.word.length);
    if (better) best = entry;
  }
  if (best) return best.aisle;

  for (const w of text.split(" ")) {
    if (w.length < 5) continue;
    for (const entry of ENTRIES) {
      if (entry.word.includes(" ") || entry.word.length < 5) continue;
      const stem = w.slice(0, entry.word.length + 1);
      if (editDistance(stem, entry.word) <= typoAllowance(entry.word.length)) return entry.aisle;
    }
  }
  return "other";
}

// The key an item is remembered under when someone moves it to another aisle.
export function aisleKey(itemText) {
  return normalizeName(itemText);
}

// Aisle for an item: what you taught the app first, otherwise the guess.
//   learned: Map of aisleKey -> aisle
export function aisleFor(itemText, learned) {
  return learned.get(aisleKey(itemText)) ?? guessAisle(itemText);
}

// Items grouped into sections, in the chosen order, keeping each section's
// items in the order they were added. Empty sections are left out.
export function groupByAisle(items, learned, order) {
  const sequence = [...order, ...AISLES.filter((a) => !order.includes(a))];
  const groups = new Map(sequence.map((a) => [a, []]));
  for (const item of items) {
    const aisle = aisleFor(item.text, learned);
    (groups.get(aisle) ?? groups.get("other")).push(item);
  }
  return sequence.filter((a) => groups.get(a).length).map((aisle) => ({ aisle, items: groups.get(aisle) }));
}
