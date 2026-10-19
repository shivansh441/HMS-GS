import { useLocation } from "react-router-dom";
import { NotificationBell } from "../atoms/NotificationBell";
import { UserProfileBadge } from "../molecules/UserProfileBadge";

interface HeaderProps {
  title: string;
  currentHostelName?: string;
  unreadNotifications: number;
  adminName?: string;
  adminRole?: string;
}

export function Header({
  title,
  currentHostelName,
  unreadNotifications,
  adminName,
  adminRole,
}: HeaderProps) {
  const location = useLocation();
  const pageTitle = location.pathname === "/admin" ? "Properties" : title;

  return (
    <header className="h-20 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 flex items-center justify-between px-6 md:px-8">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">{pageTitle}</h2>
        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
          {currentHostelName || "Global"}
        </span>
      </div>

      <div className="flex items-center space-x-4 md:space-x-6">
        <NotificationBell unreadCount={unreadNotifications} />
        <UserProfileBadge name={adminName} role={adminRole} />
      </div>
    </header>
  );
}