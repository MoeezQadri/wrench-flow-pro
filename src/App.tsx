import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/toaster';

// Lazy-loaded components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const SuperAdminLogin = lazy(() => import('./pages/superadmin/SuperAdminLogin'));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const CreateSuperAdmin = lazy(() => import('./pages/superadmin/CreateSuperAdmin'));

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Auth routes */}
              <Route path="/auth" element={<PublicRoute />}>
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
              </Route>
              
              {/* SuperAdmin routes */}
              <Route path="/superadmin">
                <Route path="login" element={<SuperAdminLogin />} />
                <Route path="create" element={<CreateSuperAdmin />} />
                <Route path="dashboard" element={
                  <PrivateRoute>
                    <SuperAdminDashboard />
                  </PrivateRoute>
                } />
                {/* Add any other superadmin routes here */}
              </Route>
              
              {/* Protected routes */}
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              {/* Redirect root to dashboard if logged in, otherwise to login */}
              <Route path="/" element={<Navigate to="/auth/login" replace />} />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
