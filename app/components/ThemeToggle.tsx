"use client";

import { useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";

const themeListeners = new Set<() => void>();

function readThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const saved = window.localStorage.getItem("civilkuwait-theme");
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
}

function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onStorage = (event: StorageEvent) => { if (event.key === "civilkuwait-theme") listener(); };
  const onMedia = () => { if (readThemePreference() === "system") { applyTheme("system"); listener(); } };
  window.addEventListener("storage", onStorage);
  media.addEventListener("change", onMedia);
  return () => {
    themeListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    media.removeEventListener("change", onMedia);
  };
}

export function applyTheme(preference: ThemePreference) {
  const resolved = preference === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  window.localStorage.setItem("civilkuwait-theme", preference);
  themeListeners.forEach((listener) => listener());
}

export default function ThemeToggle({ label }: { label?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, readThemePreference, () => "system");
  const toggle = () => {
    const resolved = document.documentElement.dataset.theme;
    const next: ThemePreference = resolved === "dark" ? "light" : "dark";
    applyTheme(next);
  };
  const title = theme === "system" ? "System theme" : `${theme} theme`;
  return <button className="theme-toggle" type="button" onClick={toggle} aria-label={label ?? "Toggle color theme"} title={title}><span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span></button>;
}
