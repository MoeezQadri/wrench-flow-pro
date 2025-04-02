
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Invoices from "@/pages/Invoices";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/customers" element={<div className="p-6">Customers page coming soon</div>} />
            <Route path="/mechanics" element={<div className="p-6">Mechanics page coming soon</div>} />
            <Route path="/tasks" element={<div className="p-6">Tasks page coming soon</div>} />
            <Route path="/parts" element={<div className="p-6">Parts page coming soon</div>} />
            <Route path="/expenses" element={<div className="p-6">Expenses page coming soon</div>} />
            <Route path="/settings" element={<div className="p-6">Settings page coming soon</div>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
