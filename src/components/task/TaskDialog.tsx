
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
import TaskForm, { TaskFormValues } from "./TaskForm";
import { useDataContext } from "@/context/data/DataContext";

const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Task) => void;
  task?: Task;
  invoiceId?: string;
}

const TaskDialog = ({ open, onOpenChange, onSave, task, invoiceId }: TaskDialogProps) => {
  const isEditing = !!task;
  const formId = "task-form";
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(invoiceId ? true : false);

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
    try {
      const newTask: Task = {
        id: task?.id || generateId("task"),
        title: data.title,
        description: data.description || "",
        status: data.status,
        mechanicId: data.mechanicId === "unassigned" ? undefined : data.mechanicId,
        vehicleId: data.vehicleId || (invoice ? invoice.vehicle_id : undefined),
        invoiceId: data.invoiceId || invoiceId,
        hoursEstimated: data.hoursEstimated,
        hoursSpent: data.hoursSpent,
        price: data.price,
        location: data.location,
        created_at: task?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      onSave(newTask);

      // Show success message
      if (invoiceId && vehicle) {
        toast.success(`Task ${isEditing ? "updated" : "added"} for ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})!`);
      } else {
        toast.success(`Task ${isEditing ? "updated" : "added"} successfully!`);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task. Please try again.");
    }
  };

  if (loading) {
    return null;
  }

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
                : "Enter the details for the new task."
            }
          </DialogDescription>
        </DialogHeader>

        <TaskForm
          defaultValues={
            task
              ? {
                title: task.title,
                description: task.description,
                status: task.status,
                price: task.price || 0,
                location: task.location,
                mechanicId: task.mechanicId || "unassigned",
                vehicleId: task.vehicleId,
                invoiceId: task.invoiceId,
                hoursEstimated: task.hoursEstimated,
                hoursSpent: task.hoursSpent || 0,
              }
              : {
                invoiceId: invoiceId,
                vehicleId: invoice?.vehicle_id,
                mechanicId: "unassigned"
              }
          }
          onSubmit={handleSubmit}
          formId={formId}
          task={task}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            {isEditing ? "Update" : "Add"} Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
