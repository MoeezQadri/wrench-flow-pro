
import { useState } from 'react';
import type { Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const { applyOrganizationFilter } = useOrganizationAwareQuery();
    const { organizationId } = useOrganizationFilter();

    const transformTask = (dbTask: any): Task => {
        return {
            id: dbTask.id,
            title: dbTask.title,
            description: dbTask.description,
            mechanicId: dbTask.mechanic_id,
            mechanic_id: dbTask.mechanic_id,
            vehicleId: dbTask.vehicle_id,
            vehicle_id: dbTask.vehicle_id,
            status: dbTask.status,
            location: dbTask.location,
            hoursEstimated: dbTask.hours_estimated || 0,
            hours_estimated: dbTask.hours_estimated,
            hoursSpent: dbTask.hours_spent,
            hours_spent: dbTask.hours_spent,
            price: dbTask.price,
            startTime: dbTask.start_time,
            start_time: dbTask.start_time,
            endTime: dbTask.end_time,
            end_time: dbTask.end_time,
            completedBy: dbTask.completed_by,
            completed_by: dbTask.completed_by,
            completedAt: dbTask.completed_at,
            completed_at: dbTask.completed_at,
            invoiceId: dbTask.invoice_id,
            invoice_id: dbTask.invoice_id,
            created_at: dbTask.created_at,
            updated_at: dbTask.updated_at
        };
    };

    const transformTaskForDB = (task: Task): any => {
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            mechanic_id: task.mechanicId || (task as any).mechanic_id,
            vehicle_id: task.vehicleId || (task as any).vehicle_id,
            status: task.status,
            location: task.location,
            hours_estimated: (task as any).hoursEstimated || (task as any).hours_estimated || 0,
            hours_spent: (task as any).hoursSpent || (task as any).hours_spent,
            price: task.price,
            start_time: (task as any).startTime || (task as any).start_time,
            end_time: (task as any).endTime || (task as any).end_time,
            completed_by: (task as any).completedBy || (task as any).completed_by,
            completed_at: (task as any).completedAt || (task as any).completed_at,
            invoice_id: (task as any).invoiceId || (task as any).invoice_id,
            organization_id: (task as any).organization_id || organizationId,
            created_at: (task as any).created_at,
            updated_at: (task as any).updated_at
        };
    };

    const addTask = async (task: Task) => {
        try {
            const dbTask = transformTaskForDB(task);
            const { data, error } = await supabase.from('tasks').insert(dbTask).select();
            if (error) {
                console.error('Error adding task:', error);
                toast.error('Failed to add task');
                throw error;
            }
            if (data && data.length > 0) {
                const result = transformTask(data[0]);
                setTasks((prev) => [...prev, result]);
                toast.success('Task added successfully');
            }
        } catch (error) {
            console.error('Error adding task:', error);
            toast.error('Failed to add task');
            throw error;
        }
    };

    const removeTask = async (id: string) => {
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) {
                console.error('Error removing task:', error);
                toast.error('Failed to delete task');
                throw error;
            }
            setTasks((prev) => prev.filter((item) => item.id !== id));
            toast.success('Task deleted successfully');
        } catch (error) {
            console.error('Error removing task:', error);
            toast.error('Failed to delete task');
            throw error;
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        try {
            const dbUpdates = transformTaskForDB(updates as Task);
            const { data, error } = await supabase
                .from('tasks')
                .update(dbUpdates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating task:', error);
                toast.error('Failed to update task');
                throw error;
            }

            if (data && data.length > 0) {
                const result = transformTask(data[0]);
                setTasks((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Task updated successfully');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('Failed to update task');
            throw error;
        }
    };

    const loadTasks = async () => {
        try {
            const query = supabase.from('tasks').select('*');
            const { data: tasksData, error: tasksError } = await applyOrganizationFilter(query);
            if (tasksError) {
                console.error('Error fetching tasks:', tasksError);
                toast.error('Failed to load tasks');
            } else {
                const transformedTasks = (tasksData || []).map(transformTask);
                setTasks(transformedTasks);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to load tasks');
        }
    };

    return {
        tasks,
        setTasks,
        addTask,
        removeTask,
        updateTask,
        loadTasks
    };
};
