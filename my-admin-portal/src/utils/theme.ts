export const STORAGE_KEY = "propertyflow-theme";

export function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(isDark: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  try {
    root.style.colorScheme = isDark ? "dark" : "light";
  } catch {}
  window.localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
}
