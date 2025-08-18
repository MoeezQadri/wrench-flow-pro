
import { useState } from 'react';
import type { Expense } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
export const useExpenses = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const { applyOrganizationFilter } = useOrganizationAwareQuery();
    const { organizationId } = useOrganizationFilter();

    const addExpense = async (expense: Expense) => {
        try {
            const payload = {
                ...(expense as any),
                organization_id: (expense as any).organization_id || organizationId,
            };
            const { data, error } = await supabase.from('expenses').insert(payload).select();
            if (error) {
                console.error('Error adding expense:', error);
                toast.error('Failed to add expense');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Expense;
                setExpenses((prev) => [...prev, result]);
                toast.success('Expense added successfully');
            }
        } catch (error) {
            console.error('Error adding expense:', error);
            toast.error('Failed to add expense');
            throw error;
        }
    };

    const removeExpense = async (id: string) => {
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) {
                console.error('Error removing expense:', error);
                toast.error('Failed to delete expense');
                throw error;
            }
            setExpenses((prev) => prev.filter((item) => item.id !== id));
            toast.success('Expense deleted successfully');
        } catch (error) {
            console.error('Error removing expense:', error);
            toast.error('Failed to delete expense');
            throw error;
        }
    };

    const updateExpense = async (id: string, updates: Partial<Expense>) => {
        try {
            const { data, error } = await supabase
                .from('expenses')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating expense:', error);
                toast.error('Failed to update expense');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Expense;
                setExpenses((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Expense updated successfully');
            }
        } catch (error) {
            console.error('Error updating expense:', error);
            toast.error('Failed to update expense');
            throw error;
        }
    };

    const loadExpenses = async () => {
        try {
            const query = supabase.from('expenses').select('*');
            const { data: expensesData, error: expensesError } = await applyOrganizationFilter(query);
            if (expensesError) {
                console.error('Error fetching expenses:', expensesError);
                toast.error('Failed to load expenses');
            } else {
                setExpenses(expensesData || []);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
            toast.error('Failed to load expenses');
        }
    };

    return {
        expenses,
        setExpenses,
        addExpense,
        removeExpense,
        updateExpense,
        loadExpenses
    };
};
