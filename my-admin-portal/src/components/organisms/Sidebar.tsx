import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { NavMenuItem } from "../molecules/NavMenuItem";
import { PropertySelector } from "../molecules/PropertySelector";
import type { Property } from "../../types/property.types";

interface MenuItem {
  id: string | number;
  path: string;
  label: string;
  icon: any;
}

interface SidebarProps {
  menuItems: MenuItem[];
  currentHostel?: Property | null;
  onSelectHostel: (id: string) => void;
  onLogout: () => void;
}

export function Sidebar({ menuItems, currentHostel, onSelectHostel, onLogout }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useGSAP(() => {
    gsap.fromTo(sidebarRef.current, { x: -100, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: "power4.out" });
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <aside
      ref={sidebarRef}
      className="w-72 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col fixed h-full z-50 transition-all duration-500 bg-slate-50 dark:bg-slate-900"
    >
      <div className="p-8 flex items-center space-x-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30">
          <i className="fas fa-layer-group text-2xl"></i>
        </div>
        <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">PropertyFlow</span>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <NavMenuItem
            key={item.id}
            to={item.path}
            label={item.path === "/admin" ? "Properties" : item.path === "/mess" && currentHostel?.type === "HOTEL" ? "Food & Orders" : item.path === "/mess" ? "Mess Menu" : item.label}
            icon={item.icon}
          />
        ))}

        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/50">
          <NavMenuItem
            to="/settings"
            label="Settings"
            icon={<i className="fas fa-sliders-h"></i>}
          />
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
        <PropertySelector
          currentHostelId={currentHostel?.id ? String(currentHostel.id) : undefined}
          onChange={onSelectHostel}
        />

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-4 px-6 py-4 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all text-left group cursor-pointer"
        >
          <i className="fas fa-sign-out-alt text-xl group-hover:scale-110 transition-transform"></i>
          <span className="font-bold tracking-tight">Logout</span>
        </button>
      </div>
    </aside>
  );
}