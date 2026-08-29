import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Languages, ShoppingCart } from "lucide-react";
import PinGate, { isUnlocked } from "./components/PinGate";
import WeekNav from "./components/WeekNav";
import MenuTab from "./components/MenuTab";
import ShoppingTab from "./components/ShoppingTab";
import { mondayOf, addWeeks, weekId } from "./lib/dates";
import { supabase, isSupabaseConfigured } from "./lib/supabaseClient";
import { useLanguage } from "./lib/LanguageContext";

export default function App() {
  const { lang, toggleLang, t } = useLanguage();
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [monday, setMonday] = useState(() => mondayOf(new Date()));
  const [tab, setTab] = useState("menu");
  const [menu, setMenu] = useState({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const id = useMemo(() => weekId(monday), [monday]);

  useEffect(() => {
    if (!unlocked || !isSupabaseConfigured) return;
    let cancelled = false;
    setLoading(true);

    async function load() {
      let { data: week } = await supabase.from("weeks").select("*").eq("id", id).maybeSingle();
      if (!week) {
        const { data: created } = await supabase
          .from("weeks")
          .insert({ id, menu: {} })
          .select()
          .single();
        week = created;
      }
      const { data: shoppingItems } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("week_id", id)
        .order("created_at", { ascending: true });

      if (!cancelled) {
        setMenu(week?.menu ?? {});
        setItems(shoppingItems ?? []);
        setLoading(false);
      }
    }
    load();

    const channel = supabase
      .channel(`week-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "weeks", filter: `id=eq.${id}` },
        (payload) => setMenu(payload.new.menu ?? {})
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items", filter: `week_id=eq.${id}` },
        () => {
          supabase
            .from("shopping_items")
            .select("*")
            .eq("week_id", id)
            .order("created_at", { ascending: true })
            .then(({ data }) => setItems(data ?? []));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [id, unlocked]);

  async function saveMeal(dayKey, mealKey, text) {
    const nextMenu = { ...menu, [dayKey]: { ...menu[dayKey], [mealKey]: text } };
    setMenu(nextMenu);
    await supabase.from("weeks").upsert({ id, menu: nextMenu });
  }

  async function addItem(text) {
    const { data } = await supabase
      .from("shopping_items")
      .insert({ week_id: id, text, checked: false })
      .select()
      .single();
    if (data) setItems((prev) => [...prev, data]);
  }

  async function toggleItem(itemId, checked) {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, checked } : it)));
    await supabase.from("shopping_items").update({ checked }).eq("id", itemId);
  }

  async function deleteItem(itemId) {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    await supabase.from("shopping_items").delete().eq("id", itemId);
  }

  async function clearChecked() {
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id);
    setItems((prev) => prev.filter((i) => !i.checked));
    await supabase.from("shopping_items").delete().in("id", checkedIds);
  }

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} />;
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="setup-notice">
        <h1>{t("setupTitle")}</h1>
        <p>{t("setupBody")}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-row">
          <h1 className="app__title">{t("appTitle")}</h1>
          <button
            className="app__lang-toggle"
            onClick={toggleLang}
            aria-label={t("toggleLanguageAria")}
          >
            <Languages size={14} strokeWidth={2.2} />
            {lang === "it" ? "EN" : "IT"}
          </button>
        </div>
        <WeekNav
          monday={monday}
          onPrev={() => setMonday(addWeeks(monday, -1))}
          onNext={() => setMonday(addWeeks(monday, 1))}
          onToday={() => setMonday(mondayOf(new Date()))}
        />
      </header>

      <main className="app__main">
        {loading ? (
          <p className="app__loading">{t("loading")}</p>
        ) : tab === "menu" ? (
          <MenuTab monday={monday} menu={menu} onSave={saveMeal} />
        ) : (
          <ShoppingTab
            items={items}
            onAdd={addItem}
            onToggle={toggleItem}
            onDelete={deleteItem}
            onClearChecked={clearChecked}
          />
        )}
      </main>

      <nav className="app__nav">
        <div className="app__nav-inner">
          <button
            className={`app__nav-item${tab === "menu" ? " app__nav-item--active" : ""}`}
            onClick={() => setTab("menu")}
          >
            <CalendarDays size={17} strokeWidth={2.2} />
            {t("navMenu")}
          </button>
          <button
            className={`app__nav-item${tab === "spesa" ? " app__nav-item--active" : ""}`}
            onClick={() => setTab("spesa")}
          >
            <ShoppingCart size={17} strokeWidth={2.2} />
            {t("navSpesa")}
          </button>
        </div>
      </nav>
    </div>
  );
}
