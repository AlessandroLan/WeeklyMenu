import { useLayoutEffect, useState } from "react";

// For pop-up lists (ideas, aisle picker): near the end of the page a list
// opening downwards would end up under the floating bottom navigation with no
// room left to scroll, so it opens upwards instead. Either way the whole list
// is then scrolled into view. Returns true when the list should open upwards.
export function useFitAboveNav(ref) {
  const [up, setUp] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const nav = document.querySelector(".app__nav-inner");
    const navSpace = nav ? window.innerHeight - nav.getBoundingClientRect().top + 12 : 0;
    const bottomOnPage = el.getBoundingClientRect().bottom + window.scrollY;
    const lowestVisible = document.documentElement.scrollHeight - navSpace;
    if (bottomOnPage > lowestVisible) setUp(true);
  }, [ref]);

  useLayoutEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [ref, up]);

  return up;
}
