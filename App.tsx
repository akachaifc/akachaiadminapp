
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Finances from './views/Finances';
import SocialInput from './views/SocialInput';
import AdminControls from './views/AdminControls';
import Login from './views/Login';
import Profile from './views/Profile';
import { UserRole } from './types';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: UserRole[] }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center text-akachai-red">Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      
      {/* Finance Route now open to all authenticated users. Role checks happen inside. */}
      <Route path="/finances" element={
        <ProtectedRoute>
          <Finances />
        </ProtectedRoute>
      } />
      
      <Route path="/social" element={
        <ProtectedRoute roles={[UserRole.L3_ADMIN]}>
          <SocialInput />
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute roles={[UserRole.L1_ADMIN]}>
          <AdminControls />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <Router>
            <AppRoutes />
          </Router>
        </CurrencyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;