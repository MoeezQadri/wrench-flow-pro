
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
import { useState } from "react";

const App = () => {
  // Create a new QueryClient instance inside the component
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<NewInvoice />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/mechanics" element={<div className="p-6">Mechanics page coming soon</div>} />
              <Route path="/tasks" element={<div className="p-6">Tasks page coming soon</div>} />
              <Route path="/parts" element={<div className="p-6">Parts page coming soon</div>} />
              <Route path="/expenses" element={<div className="p-6">Expenses page coming soon</div>} />
              <Route path="/settings" element={<div className="p-6">Settings page coming soon</div>} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/attendance" element={<AttendanceReport />} />
              <Route path="/reports/tasks" element={<TasksReport />} />
              <Route path="/reports/finance" element={<FinanceReport />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
