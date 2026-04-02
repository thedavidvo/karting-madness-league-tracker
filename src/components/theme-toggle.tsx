"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "karting-theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      applyTheme(saved);
      return;
    }

    const initial: Theme = "dark";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button type="button" className="small-button theme-toggle" onClick={toggleTheme}>
      {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
    </button>
  );
}
