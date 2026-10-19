import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages & Layout
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PropertyManagement from './pages/PropertyManagement';
import Employees from './pages/Employees'; // <-- Imported Phase 1 HR Directory Page
import Profile from './pages/Profile';
import Layout from './components/Layout'; 

// ==========================================
// PROTECTED ROUTE WRAPPER
// ==========================================
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// ==========================================
// ROUTER LAYOUT BRIDGE
// ==========================================
// This bridges React Router's <Outlet /> with your Layout's {children} prop
const LayoutWrapper = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            {/* Public Access Gateway */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Administrative Application Shell */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <LayoutWrapper />
                </ProtectedRoute>
              }
            >
              {/* Nested Application Routes injected into Layout */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="properties" element={<PropertyManagement />} /> 
              <Route path="employees" element={<Employees />} /> {/* <-- Registered HR Gateway Route */}
              <Route path="profile" element={<Profile />} />
            </Route>
            
            {/* Catch-all 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;