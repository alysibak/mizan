"use client";

import { useEffect } from "react";

/**
 * Opens the answer a link points at (page#key), so a shared answer arrives
 * open and in view instead of folded among the rest.
 */
export default function OpenFromHash() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      const details = target?.querySelector("details");
      if (!target || !details) return;
      details.open = true;
      // An answer inside a folded group opens its group too.
      for (let up = target.parentElement?.closest("details"); up; up = up.parentElement?.closest("details")) {
        up.open = true;
      }
      target.scrollIntoView({ block: "start" });
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
