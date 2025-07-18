
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { subDays, isWithinInterval, parseISO } from 'date-fns';
import { resolvePromiseAndSetState } from '@/utils/async-helpers';
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
  
  return data || [];
};

const FinanceReport = () => {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
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

  // Filter data based on date range
  const filteredExpenses = expenses.filter(expense => {
    try {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, { start: startDate, end: endDate });
    } catch (e) {
      return false;
    }
  });

  const filteredRevenue = revenue.filter(invoice => {
    try {
      const invoiceDate = parseISO(invoice.date || '');
      return isWithinInterval(invoiceDate, { start: startDate, end: endDate });
    } catch (e) {
      return false;
    }
  });

  // Calculate totals
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const totalRevenue = filteredRevenue.reduce((sum, invoice) => {
    const invoiceTotal = invoice.invoice_items?.reduce(
      (itemSum: number, item: { price: number; quantity: number }) => 
        itemSum + (item.price * item.quantity), 
      0
    ) || 0;
    return sum + invoiceTotal;
  }, 0);

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };
  
  if (loading) {
    return <div className="p-4 text-center">Loading financial data...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/reports">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Reports
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Financial Report</h1>
        </div>
        <div className="mt-4 sm:mt-0">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${parseFloat(profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin}%
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Revenue Breakdown</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRevenue.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No revenue data available for selected period</p>
            ) : (
              <div className="space-y-4">
                {filteredRevenue.slice(0, 10).map((invoice, index) => {
                  const invoiceTotal = invoice.invoice_items?.reduce(
                    (sum: number, item: { price: number; quantity: number }) => 
                      sum + (item.price * item.quantity), 
                    0
                  ) || 0;
                  
                  return (
                    <div key={invoice.id || index} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <p className="font-medium">Invoice #{invoice.id?.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${invoiceTotal.toFixed(2)}</p>
                        <p className={`text-xs ${
                          invoice.status === 'paid' ? 'text-green-600' : 
                          invoice.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {invoice.status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Expense Breakdown</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expense data available for selected period</p>
            ) : (
              <div className="space-y-4">
                {filteredExpenses.slice(0, 10).map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{expense.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                      {expense.description && (
                        <p className="text-xs text-muted-foreground">{expense.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${expense.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{expense.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceReport;
