import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Languages, RefreshCw, ShoppingCart } from "lucide-react";
import PinGate, { isUnlocked } from "./components/PinGate";
import PullToRefresh from "./components/PullToRefresh";
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

  // Fetches the week + its shopping list. Extracted from the effect so that the
  // pull-to-refresh gesture and the header button can re-run exactly the same
  // load on demand.
  const loadWeek = useCallback(async () => {
    if (!isSupabaseConfigured) return;

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

    setMenu(week?.menu ?? {});
    setItems(shoppingItems ?? []);
  }, [id]);

  useEffect(() => {
    if (!unlocked || !isSupabaseConfigured) return;
    let cancelled = false;
    setLoading(true);

    loadWeek().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [loadWeek, unlocked]);

  async function handleRefresh() {
    await loadWeek();
  }


  async function saveMeal(dayKey, mealKey, text) {
    const nextMenu = { ...menu, [dayKey]: { ...menu[dayKey], [mealKey]: text } };
    setMenu(nextMenu);
    await supabase.from("weeks").upsert({ id, menu: nextMenu });
  }

  async function duplicateLastWeek() {
    const hasContent = Object.values(menu).some(
      (day) => day && (day.pranzo || day.cena || day.note)
    );
    if (hasContent && !window.confirm(t("duplicateWeekConfirm"))) return;

    const prevId = weekId(addWeeks(monday, -1));
    const { data: prevWeek } = await supabase
      .from("weeks")
      .select("menu")
      .eq("id", prevId)
      .maybeSingle();

    const prevMenu = prevWeek?.menu ?? {};
    const hasPrevContent = Object.values(prevMenu).some(
      (day) => day && (day.pranzo || day.cena || day.note)
    );
    if (!hasPrevContent) {
      window.alert(t("duplicateWeekEmpty"));
      return;
    }

    setMenu(prevMenu);
    await supabase.from("weeks").upsert({ id, menu: prevMenu });
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
          <div className="app__header-actions">
            <button
              className="app__icon-button"
              onClick={handleRefresh}
              aria-label={t("refreshAria")}
              title={t("refreshAria")}
            >
              <RefreshCw size={15} strokeWidth={2.2} />
            </button>
            <button
              className="app__lang-toggle"
              onClick={toggleLang}
              aria-label={t("toggleLanguageAria")}
            >
              <Languages size={14} strokeWidth={2.2} />
              {lang === "it" ? "EN" : "IT"}
            </button>
          </div>
        </div>
        <WeekNav
          monday={monday}
          onPrev={() => setMonday(addWeeks(monday, -1))}
          onNext={() => setMonday(addWeeks(monday, 1))}
          onToday={() => setMonday(mondayOf(new Date()))}
        />
      </header>

      <PullToRefresh onRefresh={handleRefresh}>
      <main className="app__main">
        {loading ? (
          <p className="app__loading">{t("loading")}</p>
        ) : tab === "menu" ? (
          <MenuTab monday={monday} menu={menu} onSave={saveMeal} onDuplicate={duplicateLastWeek} />
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
      </PullToRefresh>

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
