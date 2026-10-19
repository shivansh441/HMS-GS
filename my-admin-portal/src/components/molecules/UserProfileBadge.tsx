import { useNavigate } from "react-router-dom";
import { Avatar } from "../atoms/Avatar";
import { useAppSelector } from "../../store/hooks";

interface UserProfileBadgeProps {
  name?: string;
  role?: string;
}

export function UserProfileBadge({ name, role }: UserProfileBadgeProps) {
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth?.user);
  const displayName = name || `${authUser?.firstName || ''} ${authUser?.lastName || ''}`.trim() || "Loading...";
  const displayRole = role || authUser?.role || "User";

  const formattedRole = displayRole
    ? String(displayRole)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "User";

  return (
    <div
      onClick={() => navigate("/profile")}
      className="flex items-center gap-3 ml-2 border-l border-slate-300 dark:border-slate-700 pl-4 md:pl-6 cursor-pointer group hover:opacity-80 transition-all"
    >
      <div className="text-right hidden sm:block">
        <p className="text-sm font-black leading-none text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {displayName}
        </p>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1">{formattedRole}</p>
      </div>
      <Avatar name={displayName} />
    </div>
  );
}