"use client";

import { useEffect, useState } from "react";

/* ---------- THEMES ---------- */
const THEMES = {
  slate: {
    bodyClass: "min-h-screen bg-slate-950 text-slate-100",
    card: "rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shadow-xl shadow-black/20",
    // ... tutte le altre classi già definite
  },
  ffxiv: {
    bodyClass: "min-h-screen bg-gradient-to-b from-[#0b1120] to-[#101a2c] text-[#f1e5c7]",
    card: "rounded-2xl border border-yellow-700 bg-[#1a2238]/70 p-4 shadow-lg",
    // ... tutte le altre classi già definite
  },
};

/* ---------- Hook ---------- */
export function useThemeClasses() {
  const [theme, setTheme] = useState("slate");

  useEffect(() => {
    const saved = localStorage.getItem("marketcraft:theme");
    if (saved && THEMES[saved]) setTheme(saved);
  }, []);

  const T = THEMES[theme];
  return { theme, setTheme, T };
}
