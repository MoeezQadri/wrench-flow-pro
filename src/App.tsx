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
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Core app modules
const Invoices = lazy(() => import('./pages/Invoices'));
const NewInvoice = lazy(() => import('./pages/NewInvoice'));
const EditInvoice = lazy(() => import('./pages/EditInvoice'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const Mechanics = lazy(() => import('./pages/Mechanics'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Parts = lazy(() => import('./pages/Parts'));
const Finance = lazy(() => import('./pages/Finance'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Users = lazy(() => import('./pages/Users'));
const Reports = lazy(() => import('./pages/Reports'));
const Attendance = lazy(() => import('./pages/Attendance'));

// Report modules
const AttendanceReport = lazy(() => import('./pages/reports/AttendanceReport'));
const FinanceReport = lazy(() => import('./pages/reports/FinanceReport'));
const InvoicingReport = lazy(() => import('./pages/reports/InvoicingReport'));
const TasksReport = lazy(() => import('./pages/reports/TasksReport'));

// SuperAdmin components
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
              </Route>
              
              {/* Protected routes with Layout */}
              <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Invoices */}
                <Route path="/invoices">
                  <Route index element={<Invoices />} />
                  <Route path="new" element={<NewInvoice />} />
                  <Route path="edit/:id" element={<EditInvoice />} />
                  <Route path=":id" element={<EditInvoice />} />
                </Route>
                
                {/* Customers */}
                <Route path="/customers">
                  <Route index element={<Customers />} />
                  <Route path=":id" element={<CustomerDetail />} />
                </Route>
                
                {/* Other core routes */}
                <Route path="/mechanics" element={<Mechanics />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/parts" element={<Parts />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/users" element={<Users />} />
                
                {/* Reports */}
                <Route path="/reports">
                  <Route index element={<Reports />} />
                  <Route path="attendance" element={<AttendanceReport />} />
                  <Route path="finance" element={<FinanceReport />} />
                  <Route path="invoicing" element={<InvoicingReport />} />
                  <Route path="tasks" element={<TasksReport />} />
                </Route>
              </Route>
              
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
