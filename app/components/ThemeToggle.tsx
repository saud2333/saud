"use client";

import { useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

export function applyTheme(preference: ThemePreference) {
  const resolved = preference === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  window.localStorage.setItem("civilkuwait-theme", preference);
}

export default function ThemeToggle({ label }: { label?: string }) {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return "system";
    const saved = window.localStorage.getItem("civilkuwait-theme");
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });
  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { if ((window.localStorage.getItem("civilkuwait-theme") ?? "system") === "system") applyTheme("system"); };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);
  const toggle = () => {
    const resolved = document.documentElement.dataset.theme;
    const next: ThemePreference = resolved === "dark" ? "light" : "dark";
    setTheme(next); applyTheme(next);
  };
  return <button className="theme-toggle" type="button" onClick={toggle} aria-label={label ?? "Toggle color theme"} title={theme === "system" ? "System theme" : `${theme} theme`}><span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span></button>;
}
