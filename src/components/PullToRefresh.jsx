import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

// How far (in px, after resistance) the user must pull before a release triggers a refresh.
const THRESHOLD = 70;
// Maximum visual pull, so the header can't be dragged halfway down the screen.
const MAX_PULL = 110;
// Higher = the content follows the finger more slowly, which is what makes the
// gesture feel "rubber-banded" rather than like a normal drag.
const RESISTANCE = 2.2;

export default function PullToRefresh({ onRefresh, children }) {
  const { t } = useLanguage();
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onTouchStart(e) {
      // Only arm the gesture when the page is already scrolled to the very top,
      // otherwise a normal upward scroll would be hijacked.
      if (window.scrollY > 0 || refreshing) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
      setDragging(true);
    }

    function onTouchMove(e) {
      if (startY.current === null || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;

      if (delta <= 0) {
        // Pulling up: hand control back to the browser's normal scrolling.
        setPull(0);
        setDragging(false);
        startY.current = null;
        return;
      }
      if (window.scrollY > 0) {
        setPull(0);
        setDragging(false);
        startY.current = null;
        return;
      }

      // Stop the browser doing its own overscroll bounce while we animate ours.
      e.preventDefault();
      setPull(Math.min(delta / RESISTANCE, MAX_PULL));
    }

    async function onTouchEnd() {
      if (startY.current === null) return;
      const shouldRefresh = pull >= THRESHOLD;
      startY.current = null;
      setDragging(false);

      if (!shouldRefresh) {
        setPull(0);
        return;
      }

      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    }

    // passive: false is required so that preventDefault() above actually works.
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [pull, refreshing, onRefresh]);

  const active = pull >= THRESHOLD;
  const label = refreshing
    ? t("refreshing")
    : active
      ? t("releaseToRefresh")
      : t("pullToRefresh");

  return (
    <div className="ptr" ref={containerRef}>
      <div
        className="ptr__indicator"
        style={{ height: pull, opacity: pull > 6 ? 1 : 0 }}
        aria-hidden={pull === 0}
      >
        <RefreshCw
          size={16}
          strokeWidth={2.4}
          className={`ptr__icon${refreshing ? " ptr__icon--spinning" : ""}`}
          style={{ transform: refreshing ? undefined : `rotate(${pull * 2.6}deg)` }}
        />
        <span className="ptr__label">{label}</span>
      </div>
      <div
        className="ptr__content"
        style={{
          transform: `translateY(${pull}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
