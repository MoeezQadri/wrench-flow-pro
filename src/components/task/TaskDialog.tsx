
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Task, Invoice, Vehicle } from "@/types";
import TaskForm from "./TaskForm";
import { TaskFormValues } from "./TaskFormValues";
import { useDataContext } from "@/context/data/DataContext";

// Generate proper UUID for database
const generateId = (): string => {
  return crypto.randomUUID();
};

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Task) => Promise<void>;
  task?: Task;
  invoiceId?: string;
}

const TaskDialog = ({ open, onOpenChange, onSave, task, invoiceId }: TaskDialogProps) => {
  const isEditing = !!task;
  const formId = "task-form";
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(invoiceId ? true : false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    getInvoiceById,
    getVehicleById
  } = useDataContext();

  useEffect(() => {
    if (invoiceId) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const invoiceData = await getInvoiceById(invoiceId);
          if (invoiceData) {
            setInvoice(invoiceData);

            // Fetch vehicle data
            const vehicleData = await getVehicleById(invoiceData.vehicle_id);
            setVehicle(vehicleData);
          }
        } catch (error) {
          console.error("Error fetching invoice/vehicle:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setInvoice(null);
      setVehicle(null);
    }
  }, [invoiceId]);

  const handleSubmit = async (data: TaskFormValues) => {
    // Prevent duplicate submissions
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Determine task assignment based on type
      let taskInvoiceId = undefined;
      let taskVehicleId = undefined;

      if (data.taskType === "invoice") {
        if (!data.invoiceId) {
          toast.error("Invoice must be selected for invoice tasks");
          return;
        }
        taskInvoiceId = data.invoiceId;
        taskVehicleId = data.vehicleId;
      }

      const newTask: Task = {
        id: task?.id || generateId(),
        title: data.title,
        description: data.description || "",
        status: data.status === 'in-progress' ? 'in-progress' : 'completed',
        mechanicId: data.mechanicId === "unassigned" ? undefined : data.mechanicId,
        vehicleId: taskVehicleId,
        invoiceId: taskInvoiceId,
        hoursEstimated: data.hoursEstimated,
        hoursSpent: data.hoursSpent,
        price: data.price,
        
        created_at: task?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await onSave(newTask);

      // Show success message
      if (data.taskType === "invoice" && vehicle) {
        toast.success(`Task ${isEditing ? "updated" : "added"} for ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})!`);
      } else {
        toast.success(`Internal workshop task ${isEditing ? "updated" : "added"} successfully!`);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return null;
  }

  // Determine task type for editing
  const getTaskType = (task?: Task) => {
    if (!task) return invoiceId ? "invoice" : "internal";
    return task.invoiceId ? "invoice" : "internal";
  };

  // Convert TaskLocation to form location type
  const convertLocationForForm = (location?: string): 'workshop' | 'roadside' | 'other' => {
    if (location === 'onsite' || location === 'remote') return 'other';
    if (location === 'roadside') return 'roadside';
    return 'workshop';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Add New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the task information below."
              : invoice && vehicle
                ? `Add a new task for ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}).`
                : "Create either an invoice-based task or an internal workshop task."
            }
          </DialogDescription>
        </DialogHeader>

        <TaskForm
          defaultValues={
            task
              ? {
                title: task.title,
                description: task.description,
                status: task.status === 'completed' ? 'completed' : 'in-progress',
                price: task.price || 0,
                
                taskType: getTaskType(task),
                mechanicId: task.mechanicId || "unassigned",
                vehicleId: task.vehicleId,
                invoiceId: task.invoiceId,
                hoursEstimated: task.hoursEstimated,
                hoursSpent: task.hoursSpent || 0,
              }
              : {
                taskType: invoiceId ? "invoice" : "internal",
                invoiceId: invoiceId,
                vehicleId: invoice?.vehicle_id,
                mechanicId: "unassigned",
                
              }
          }
          onSubmit={handleSubmit}
          formId={formId}
          task={task}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update" : "Add"} Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
