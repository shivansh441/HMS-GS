import { NavLink } from "react-router-dom";

interface NotificationBellProps {
  unreadCount: number;
}

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  return (
    <NavLink
      to="/notifications"
      className="relative w-10 h-10 md:w-12 md:h-12 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:scale-105 active:scale-95 transition-all bg-white dark:bg-slate-800"
    >
      <i className="fas fa-bell text-slate-600 dark:text-slate-300"></i>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
          {unreadCount}
        </span>
      )}
    </NavLink>
  );
}