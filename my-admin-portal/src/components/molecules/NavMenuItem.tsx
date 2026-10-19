import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface NavMenuItemProps {
  to: string;
  label: string;
  icon?: ReactNode;
}

export function NavMenuItem({ to, label, icon }: NavMenuItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
          isActive
            ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"
            : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
        }`
      }
    >
      {icon ? <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span> : null}
      <span className="font-bold tracking-tight">{label}</span>
    </NavLink>
  );
}