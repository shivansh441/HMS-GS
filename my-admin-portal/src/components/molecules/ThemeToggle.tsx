import { useEffect, useState } from "react";
import { getInitialTheme, applyTheme } from "../../utils/theme";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => getInitialTheme() === "dark");

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark((s) => !s)}
      className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-lg transition-all hover:scale-105 cursor-pointer"
    >
      <i className={`fas ${isDark ? "fa-sun text-amber-400" : "fa-moon text-indigo-600"} text-lg`}></i>
    </button>
  );
}