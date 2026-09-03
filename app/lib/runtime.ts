import type { View } from "../components/CivilApp";

export const GITHUB_PAGES_BASE = "/saud/";

export function isGitHubPagesRuntime() {
  if (typeof window === "undefined") return false;
  return window.location.hostname.endsWith("github.io") || document.documentElement.dataset.hosting === "github-pages";
}

export function viewFromLocation(paths: Record<View, string>, fallback: View = "home"): View {
  if (typeof window === "undefined") return fallback;
  const locationPath = isGitHubPagesRuntime()
    ? (window.location.hash.replace(/^#/, "").split("?")[0] || "/")
    : window.location.pathname;
  return (Object.entries(paths).find(([, path]) => path === locationPath)?.[0] ?? fallback) as View;
}

export function appHref(path: string) {
  return isGitHubPagesRuntime() ? `#${path}` : path;
}

export function navigateToPath(path: string) {
  if (typeof window === "undefined") return;
  if (isGitHubPagesRuntime()) window.location.hash = path;
  else window.location.assign(path);
}

export function authRedirectUrl() {
  if (typeof window === "undefined") return "https://saud2333.github.io/saud/";
  return isGitHubPagesRuntime()
    ? `${window.location.origin}${GITHUB_PAGES_BASE}`
    : `${window.location.origin}/profile`;
}
