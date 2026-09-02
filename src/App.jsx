import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Languages, RefreshCw, Share2, ShoppingCart } from "lucide-react";
import PinGate, { isUnlocked } from "./components/PinGate";
import PullToRefresh from "./components/PullToRefresh";
import WeekNav from "./components/WeekNav";
import MenuTab from "./components/MenuTab";
import ShoppingTab from "./components/ShoppingTab";
import { mondayOf, addWeeks, weekId } from "./lib/dates";
import { supabase, isSupabaseConfigured } from "./lib/supabaseClient";
import { useLanguage } from "./lib/LanguageContext";
import { formatWeekAsText, weekHasContent } from "./lib/shareWeek";
import { parseItemText } from "./lib/quantity";

export default function App() {
  const { lang, toggleLang, t } = useLanguage();
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [monday, setMonday] = useState(() => mondayOf(new Date()));
  const [tab, setTab] = useState("menu");
  const [menu, setMenu] = useState({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const lastLoadedAt = useRef(0);

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
    lastLoadedAt.current = Date.now();
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

  // Re-fetch when the app comes back to the foreground (tab focus, or reopening
  // the installed PWA). Replaces the realtime subscription for the common case
  // of "the other person edited it while my phone was in my pocket".
  useEffect(() => {
    if (!unlocked || !isSupabaseConfigured) return;

    function maybeRefresh() {
      if (document.visibilityState !== "visible") return;
      // Don't yank text out from under someone mid-edit.
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      // A quick app-switch shouldn't cause a burst of identical queries.
      if (Date.now() - lastLoadedAt.current < 10000) return;
      loadWeek();
    }

    document.addEventListener("visibilitychange", maybeRefresh);
    window.addEventListener("focus", maybeRefresh);
    return () => {
      document.removeEventListener("visibilitychange", maybeRefresh);
      window.removeEventListener("focus", maybeRefresh);
    };
  }, [loadWeek, unlocked]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  }

  async function handleShare() {
    if (!weekHasContent({ menu, items })) {
      showToast(t("shareNothing"));
      return;
    }
    const text = formatWeekAsText({ monday, menu, items, lang });

    // navigator.share is the good path on phones (opens WhatsApp, Messages, ...).
    // Everywhere else, fall back to the clipboard.
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (err) {
        // The user dismissing the share sheet lands here too - stay quiet then.
        if (err?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("shareCopied"));
    } catch {
      showToast(t("shareNothing"));
    }
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

  async function addItem(rawText) {
    const { text, amount, unit } = parseItemText(rawText);
    if (!text) return;
    const { data } = await supabase
      .from("shopping_items")
      .insert({ week_id: id, text, amount, unit, checked: false })
      .select()
      .single();
    if (data) setItems((prev) => [...prev, data]);
  }

  async function toggleItem(itemId, checked) {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, checked } : it)));
    await supabase.from("shopping_items").update({ checked }).eq("id", itemId);
  }

  async function editItem(itemId, rawText) {
    const { text, amount, unit } = parseItemText(rawText);
    if (!text) return;
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, text, amount, unit } : it)));
    await supabase.from("shopping_items").update({ text, amount, unit }).eq("id", itemId);
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
              onClick={handleShare}
              aria-label={t("shareAria")}
              title={t("shareAria")}
            >
              <Share2 size={15} strokeWidth={2.2} />
            </button>
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
            onEdit={editItem}
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

      {toast && <div className="app__toast" role="status">{toast}</div>}
    </div>
  );
}
