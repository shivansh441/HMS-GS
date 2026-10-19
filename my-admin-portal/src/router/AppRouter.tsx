import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import EmployeesPage from "../pages/EmployeesPage";
import {PropertyPage} from "../pages/PropertyPage";
import RoomsPage from "../pages/RoomsPage";
import ResidentsPage from "../pages/ResidentsPage";
import GuestAccountsPage from "../pages/GuestAccountsPage";
import MessPage from "../pages/MessPage";
import LandingPage from "../pages/LandingPage";
import SettingsPage from "../pages/SettingsPage";
import Layout from "../layouts/Layout";
import { ProtectedRoute } from "./ProtectedRoute";

const employeeRoutes = [
  { path: "/employees", element: <EmployeesPage /> },
  { path: "/hr-directory", element: <EmployeesPage /> },
];

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<PropertyPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/residents" element={<ResidentsPage />} />
        <Route path="/guests" element={<GuestAccountsPage />} />
        <Route path="/mess" element={<MessPage />} />
        <Route path="/landing-page" element={<LandingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {employeeRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}