
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Invoices from "@/pages/Invoices";
import NewInvoice from "@/pages/NewInvoice";
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
import { useState } from "react";

const App = () => {
  // Create a new QueryClient instance inside the component
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<NewInvoice />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/mechanics" element={<Mechanics />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/parts" element={<Parts />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/users" element={<Users />} />
              <Route path="/settings" element={<div className="p-6">Settings page coming soon</div>} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/attendance" element={<AttendanceReport />} />
              <Route path="/reports/tasks" element={<TasksReport />} />
              <Route path="/reports/finance" element={<FinanceReport />} />
              <Route path="/reports/invoicing" element={<InvoicingReport />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
