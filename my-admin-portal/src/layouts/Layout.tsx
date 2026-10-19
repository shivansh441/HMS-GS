import { useRef, useMemo, useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { MENU_ITEMS } from "../constants/Navigation";

import { Sidebar } from "../components/organisms/Sidebar";
import { Header } from "../components/organisms/Header";
import { EmptyPropertyState } from "../components/organisms/EmptyPropertyState";
import { normalizeRole } from "../utils/accountPermissions";
import { useAppDispatch, usePropertySelection } from "../store/hooks";
import { setSelectedPropertyId as setCurrentHostelId } from "../store/slices/propertiesSlice";
import { logout } from "../store/slices/authSlice";

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  // --- REDUX SELECTORS ---
  // Adjust the state paths below to match your actual Redux store structure
  // Avoid returning new array/object defaults from selectors to prevent unnecessary rerenders
  const theme = useSelector((state: any) => state.ui?.theme);
  const notifications = useSelector((state: any) => state.ui?.notifications);

  const { selectedProperty } = usePropertySelection();
  const currentAdmin = useSelector((state: any) => state.auth?.user);

  // --- REDUX DISPATCHERS ---
  const handleSelectHostel = (id: string) => {
    dispatch(setCurrentHostelId(id || null));
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  useEffect(() => {
    if (theme) document.body.className = `theme-${theme}`;
  }, [theme]);

  useGSAP(
    () => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    },
    { dependencies: [location.pathname] }
  );

  const unreadCount = (notifications ?? []).filter((n: any) => !n.read).length;
  const globalRoutes = ["/admin", "/manage-admins", "/landing-page", "/profile", "/settings", "/employees", "/hr-directory"];
  const isGlobalRoute = globalRoutes.some((route) => location.pathname.startsWith(route));
  const currentAdminRole = normalizeRole(currentAdmin?.role);
  const currentAdminName = [currentAdmin?.firstName, currentAdmin?.lastName].filter(Boolean).join(" ") || currentAdmin?.email || "User";
  const currentHostel = selectedProperty;
  const isHotelProperty = currentHostel?.type === "HOTEL";
  const isHostelProperty = currentHostel?.type?.startsWith("HOSTEL_") ?? false;

  const visibleMenuItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      if (
        (item.path === "/manage-admins" ||
          item.path === "/landing-page" ||
          item.label === "Manage Admins" ||
          item.label === "Landing Page") &&
        currentAdminRole !== "SUPER_ADMIN"
      ) {
        return false;
      }

      if (isHotelProperty) {
        const hotelAllowedPaths = ["/", "/guests", "/finance", "/mess", "/admin", "/manage-admins", "/landing-page", "/settings", "/rooms", "/employees", "/hr-directory"];
        if (!hotelAllowedPaths.includes(item.path)) {
          return false;
        }
      }

      return true;
    });
  }, [currentAdmin?.role, isHotelProperty, isHostelProperty]);

  const currentPageLabel = MENU_ITEMS.find((m) => location.pathname === m.path || location.pathname.startsWith(`${m.path}/`))?.label || "Overview";

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      <Sidebar
        menuItems={visibleMenuItems}
        currentHostel={currentHostel}
        onSelectHostel={handleSelectHostel}
        onLogout={handleLogout}
      />

      <main className="flex-1 md:ml-72 flex flex-col min-h-screen transition-all duration-500 w-full overflow-x-hidden">
        <Header
          title={currentPageLabel}
          currentHostelName={currentHostel?.name}
          unreadNotifications={unreadCount}
          adminName={currentAdminName}
          adminRole={currentAdminRole}
        />

        <div
          ref={contentRef}
          className="flex-1 w-full flex flex-col p-6 md:p-8 [&>div]:!max-w-none [&>div]:!mt-0 [&>div]:!mb-0 [&>div]:!p-0"
        >
          {!currentHostel && !isGlobalRoute && currentAdminRole !== "SUPER_ADMIN" ? (
            <EmptyPropertyState />
          ) : (
            <div className="w-full flex-1 flex flex-col">{children}</div>
          )}
        </div>
      </main>
    </div>
  );
}