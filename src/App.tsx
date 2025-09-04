import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Import immediately loaded components
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import PrivateRoute from '@/components/PrivateRoute';
import PublicRoute from '@/components/PublicRoute';
import { AuthProvider } from '@/context/AuthProvider';
import { DataProvider } from '@/context/data/DataContext';

import { Toaster } from '@/components/ui/toaster';

// Auth pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ConfirmEmail from '@/pages/auth/ConfirmEmail';
import ResetPassword from '@/pages/auth/ResetPassword';
import SetupPassword from '@/pages/auth/SetupPassword';

// Non-lazy loaded reports
import FinanceReport from '@/pages/reports/FinanceReport';
import FinancialReport from '@/pages/reports/FinancialReport';
import TasksReport from '@/pages/reports/TasksReport';
import InvoicingReport from '@/pages/reports/InvoicingReport';
import AttendanceReport from '@/pages/reports/AttendanceReport';

// Pages created to fix missing module errors
import CustomerDetails from '@/pages/CustomerDetails';
import InvoiceDetails from '@/pages/InvoiceDetails';
import EditInvoice from '@/pages/EditInvoice';
import Vehicles from '@/pages/Vehicles';

// Lazy load other pages for performance
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Customers = lazy(() => import('@/pages/Customers'));
const Invoices = lazy(() => import('@/pages/Invoices'));
const NewInvoice = lazy(() => import('@/pages/NewInvoice'));
const Mechanics = lazy(() => import('@/pages/Mechanics'));
const MechanicPerformance = lazy(() => import('@/pages/MechanicPerformance'));
const Tasks = lazy(() => import('@/pages/Tasks'));
const Parts = lazy(() => import('@/pages/Parts'));
const Expenses = lazy(() => import('@/pages/Expenses'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));
const Attendance = lazy(() => import('@/pages/Attendance'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Add Users and Finance pages
const Users = lazy(() => import('@/pages/Users'));
const Finance = lazy(() => import('@/pages/Finance'));

// Super Admin pages
const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/SuperAdminDashboard'));
const SuperAdminLogin = lazy(() => import('@/pages/superadmin/SuperAdminLogin'));
const SuperAdminDataDebug = lazy(() => import('@/pages/superadmin/SuperAdminDataDebug'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
                  {/* Public authentication routes */}
                  <Route path="/auth" element={<PublicRoute />}>
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="confirm" element={<ConfirmEmail />} />
                    <Route path="reset-password" element={<ResetPassword />} />
                    <Route path="setup-password" element={<SetupPassword />} />
                    <Route path="*" element={<Navigate to="/auth/login" replace />} />
                  </Route>

                  {/* Super Admin Routes */}
                  <Route path="/superadmin/login" element={<SuperAdminLogin />} />
                  <Route path="/superadmin" element={<PrivateRoute />}>
                    <Route path="dashboard" element={<SuperAdminDashboard />} />
                    <Route path="data-debug" element={<SuperAdminDataDebug />} />
                    <Route path="*" element={<Navigate to="/superadmin/dashboard" replace />} />
                  </Route>

                  {/* Protected routes within the main layout */}
                  <Route path="/" element={<Layout />}>
                    <Route element={<PrivateRoute />}>
                      <Route index element={<Dashboard />} />
                      <Route path="customers" element={<Customers />} />
                      <Route path="customers/:id" element={<CustomerDetails />} />
                      <Route path="invoices" element={<Invoices />} />
                      <Route path="invoices/new" element={<NewInvoice />} />
                      <Route path="invoices/:id" element={<InvoiceDetails />} />
                      <Route path="invoices/:id/edit" element={<PrivateRoute requiredResource="invoices" requiredAction="edit"><EditInvoice /></PrivateRoute>} />
                      <Route path="mechanics" element={<Mechanics />} />
                      <Route path="mechanics/:mechanicId/performance" element={<MechanicPerformance />} />
                      <Route path="tasks" element={<Tasks />} />
                      <Route path="parts" element={<Parts />} />
                      <Route path="expenses" element={<Expenses />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="reports/finance" element={<FinanceReport />} />
                      <Route path="reports/financial" element={<FinancialReport />} />
                      <Route path="reports/tasks" element={<TasksReport />} />
                      <Route path="reports/invoicing" element={<InvoicingReport />} />
                      <Route path="reports/attendance" element={<AttendanceReport />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="attendance" element={<Attendance />} />
                      <Route path="vehicles" element={<Vehicles />} />
                      <Route path="users" element={<Users />} />
                      <Route path="finance" element={<Finance />} />
                    </Route>
                  </Route>

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;