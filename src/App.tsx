
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import PrivateRoute from "@/components/PrivateRoute";

// Layouts
import Layout from "@/components/Layout";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ResetPassword from "@/pages/auth/ResetPassword";

// App Pages
import Dashboard from "@/pages/Dashboard";
import Invoices from "@/pages/Invoices";
import NewInvoice from "@/pages/NewInvoice";
import EditInvoice from "@/pages/EditInvoice";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import NotFound from "@/pages/NotFound";
import Reports from "@/pages/Reports";
import AttendanceReport from "@/pages/reports/AttendanceReport";
import TasksReport from "@/pages/reports/TasksReport";
import FinanceReport from "@/pages/reports/FinanceReport";
import InvoicingReport from "@/pages/reports/InvoicingReport";
import Mechanics from "@/pages/Mechanics";
import Tasks from "@/pages/Tasks";
import Parts from "@/pages/Parts";
import Finance from "@/pages/Finance";
import Attendance from "@/pages/Attendance";
import Users from "@/pages/Users";
import Help from "@/pages/Help";
import Settings from "@/pages/Settings";

const App = () => {
  // Create a new QueryClient instance inside the component
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Auth Routes */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              
              {/* Protected App Routes */}
              <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/new" element={<NewInvoice />} />
                <Route path="/invoices/edit/:id" element={<EditInvoice />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:id" element={<CustomerDetail />} />
                <Route path="/mechanics" element={<Mechanics />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/parts" element={<Parts />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/users" element={<Users />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/reports/attendance" element={<AttendanceReport />} />
                <Route path="/reports/tasks" element={<TasksReport />} />
                <Route path="/reports/finance" element={<FinanceReport />} />
                <Route path="/reports/invoicing" element={<InvoicingReport />} />
              </Route>
              
              {/* Redirect Index to Root */}
              <Route path="/index" element={<Navigate to="/" replace />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
