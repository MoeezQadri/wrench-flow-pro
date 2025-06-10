
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolvePromiseAndSetState } from '@/utils/async-helpers';
import { useAsyncData } from '@/hooks/useAsyncData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interface for expenses matching Supabase schema
interface DatabaseExpense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
  payment_method: 'cash' | 'card' | 'bank-transfer' | 'check' | 'other';
  vendor_name?: string;
  vendor_id?: string;
  created_at?: string;
  updated_at?: string;
  payment_status?: string;
}

// Functions to fetch data from Supabase
const getExpenses = async (): Promise<DatabaseExpense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
  
  return data || [];
};

const getRevenueData = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id, 
      date, 
      status, 
      invoice_items(price, quantity)
    `);
  
  if (error) {
    console.error('Error fetching revenue data:', error);
    throw error;
  }
  
  // Process the raw data into monthly revenue
  const monthlyData: Record<string, number> = {};
  
  data.forEach(invoice => {
    if (invoice.date && invoice.invoice_items) {
      const month = new Date(invoice.date).toLocaleString('default', { month: 'short' });
      const invoiceTotal = invoice.invoice_items.reduce(
        (sum: number, item: { price: number; quantity: number }) => 
          sum + (item.price * item.quantity), 
        0
      );
      
      monthlyData[month] = (monthlyData[month] || 0) + invoiceTotal;
    }
  });
  
  // Convert to array format
  return Object.entries(monthlyData).map(([month, revenue]) => ({
    month,
    revenue
  }));
};

const FinanceReport = () => {
  const [expenses, setExpenses] = useState<DatabaseExpense[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadFinanceData = async () => {
      setLoading(true);
      
      try {
        // Load expenses and revenue data using the utility function
        await resolvePromiseAndSetState(getExpenses(), setExpenses);
        await resolvePromiseAndSetState(getRevenueData(), setRevenue);
      } catch (error) {
        console.error('Error loading finance data:', error);
        toast.error('Failed to load financial reports');
      } finally {
        setLoading(false);
      }
    };
    
    loadFinanceData();
  }, []);
  
  if (loading) {
    return <div className="p-4 text-center">Loading financial data...</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Financial Reports</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {revenue.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No revenue data available</p>
            ) : (
              <div className="h-80">
                {/* Revenue chart would go here */}
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Month</th>
                      <th className="text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-2">{item.month}</td>
                        <td className="py-2 text-right">${item.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expense data available</p>
            ) : (
              <div className="h-80">
                {/* Expenses chart would go here */}
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Category</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.slice(0, 5).map((expense) => (
                      <tr key={expense.id} className="border-t">
                        <td className="py-2">{expense.category}</td>
                        <td className="py-2 text-right">${expense.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceReport;
