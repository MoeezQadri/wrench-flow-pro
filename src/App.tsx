
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Import immediately loaded components
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import PrivateRoute from '@/components/PrivateRoute';
import PublicRoute from '@/components/PublicRoute';

// Auth pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Non-lazy loaded reports
import FinanceReport from '@/pages/reports/FinanceReport';

// Lazy load other pages for performance
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Customers = lazy(() => import('@/pages/Customers'));
const CustomerDetails = lazy(() => import('@/pages/CustomerDetails'));
const Invoices = lazy(() => import('@/pages/Invoices'));
const InvoiceDetails = lazy(() => import('@/pages/InvoiceDetails'));
const NewInvoice = lazy(() => import('@/pages/NewInvoice'));
const Mechanics = lazy(() => import('@/pages/Mechanics'));
const Tasks = lazy(() => import('@/pages/Tasks'));
const Parts = lazy(() => import('@/pages/Parts'));
const Expenses = lazy(() => import('@/pages/Expenses'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));
const Attendance = lazy(() => import('@/pages/Attendance'));
const Vehicles = lazy(() => import('@/pages/Vehicles'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Super Admin pages
const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/SuperAdminDashboard'));
const SuperAdminLogin = lazy(() => import('@/pages/superadmin/SuperAdminLogin'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public authentication routes */}
          <Route path="/auth" element={<PublicRoute />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </Route>
          
          {/* Super Admin Routes */}
          <Route path="/superadmin/login" element={<SuperAdminLogin />} />
          <Route path="/superadmin" element={<PrivateRoute />}>
            <Route path="dashboard" element={<SuperAdminDashboard />} />
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
              <Route path="mechanics" element={<Mechanics />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="parts" element={<Parts />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/finance" element={<FinanceReport />} />
              <Route path="settings" element={<Settings />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="vehicles" element={<Vehicles />} />
            </Route>
          </Route>
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
