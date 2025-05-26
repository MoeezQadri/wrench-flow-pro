
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
import { Task, InvoiceItem, Invoice } from "@/types";
import TaskForm, { TaskFormValues } from "./TaskForm";
import { 
  generateId, 
  getCurrentUser, 
  hasPermission, 
  getInvoiceById, 
  tasks,
  invoices,
  getVehicleById
} from "@/services/data-service";
import { resolvePromiseAndSetState } from "@/utils/async-helpers";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Task) => void;
  task?: Task;
}

const TaskDialog = ({ open, onOpenChange, onSave, task }: TaskDialogProps) => {
  const isEditing = !!task;
  const formId = "task-form";
  const currentUser = getCurrentUser();
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Check if user has permission to edit this task
  const canEdit = 
    hasPermission(currentUser, 'tasks', 'manage') ||
    currentUser.role === 'foreman' ||
    (currentUser.role === 'mechanic' && 
     currentUser.mechanicId === task?.mechanic_id && 
     hasPermission(currentUser, 'tasks', 'manage'));

  if (!canEdit) {
    return null;
  }

  // Fetch invoice data if task has an invoice_id
  useEffect(() => {
    if (open && task?.invoice_id) {
      setLoading(true);
      const fetchInvoice = async () => {
        try {
          const invoicePromise = getInvoiceById(task.invoice_id!);
          await resolvePromiseAndSetState(invoicePromise, (data) => {
            if (data) {
              setInvoiceData(data);
            }
          });
        } catch (error) {
          console.error("Error fetching invoice:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchInvoice();
    }
  }, [open, task]);

  const handleSubmit = async (data: TaskFormValues) => {
    try {
      const existingInvoiceId = task?.invoice_id;
      const wasCompleted = task?.status === "completed";
      const isBeingCompleted = data.status === "completed" && (!task || task.status !== "completed");
      
      // Ensure all required fields are provided
      const newTask: Task = {
        id: task?.id || generateId("task"),
        title: data.title,
        description: data.description,
        mechanic_id: data.mechanicId,
        status: data.status,
        hours_estimated: data.hoursEstimated,
        hours_spent: data.hoursSpent,
        // Set invoice_id to undefined if "none" is selected
        invoice_id: data.invoiceId === "none" ? undefined : data.invoiceId,
        // Add new fields
        vehicle_id: data.vehicleId === "none" ? undefined : data.vehicleId,
        location: data.location || "workshop",
        price: data.price,
        created_at: task?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        start_time: task?.start_time,
        end_time: task?.end_time,
        completed_by: task?.completed_by,
        completed_at: task?.completed_at,
      };
      
      // If task is being completed, add timestamp and user information
      if (isBeingCompleted) {
        newTask.completed_by = currentUser.id;
        newTask.completed_at = new Date().toISOString();
        newTask.end_time = new Date().toISOString();
      }
      
      // Find open invoice for the vehicle if task is completed and not already assigned to an invoice
      if (isBeingCompleted && newTask.vehicle_id && !newTask.invoice_id) {
        const openInvoices = invoices.filter(
          invoice => invoice.vehicle_id === newTask.vehicle_id && 
                    (invoice.status === 'open' || invoice.status === 'in-progress')
        );
        
        if (openInvoices.length > 0) {
          // Use the most recent open invoice
          const latestInvoice = openInvoices.sort(
            (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
          )[0];
          
          newTask.invoice_id = latestInvoice.id;
          
          // Notify the user that the task was added to an existing invoice
          const vehiclePromise = getVehicleById(newTask.vehicle_id);
          await resolvePromiseAndSetState(vehiclePromise, (vehicle) => {
            if (vehicle) {
              toast.info(
                `Task added to existing invoice for ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
                { duration: 5000 }
              );
            }
          });
          
          // Update the invoice with this task
          await updateInvoiceOnTaskCompletion(latestInvoice.id, newTask);
        }
      }
      // Update the invoice if task is completed and has an invoice_id
      else if (isBeingCompleted && data.invoiceId && data.invoiceId !== "none") {
        await updateInvoiceOnTaskCompletion(data.invoiceId, newTask);
      }
      
      // If invoice association is removed or changed, update the old invoice
      if (existingInvoiceId && existingInvoiceId !== data.invoiceId && wasCompleted) {
        await removeTaskFromInvoice(existingInvoiceId, task!.id);
      }
      
      onSave(newTask);
      toast.success(`Task ${isEditing ? "updated" : "added"} successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task. Please try again.");
    }
  };

  // Function to update the invoice when a task is completed
  const updateInvoiceOnTaskCompletion = async (invoiceId: string, task: Task) => {
    try {
      const invoicePromise = getInvoiceById(invoiceId);
      let invoice: Invoice | null = null;
      
      await resolvePromiseAndSetState(invoicePromise, (data) => {
        invoice = data;
      });
      
      if (!invoice) {
        toast.warning("Could not find associated invoice.");
        return;
      }
      
      // Only proceed if we have hours spent data
      if (!task.hours_spent) {
        toast.warning("Task marked as completed but no hours spent recorded.");
        return;
      }
      
      // Use custom price if set, otherwise calculate based on hourly rate
      const hourlyRate = 85; // Default hourly rate for labor
      const taskPrice = task.price || (task.hours_spent * hourlyRate);
      
      // Create a new invoice item for this task
      const newItem: InvoiceItem = {
        id: generateId("item"),
        invoice_id: invoiceId,
        type: "labor",
        description: `Labor: ${task.title}`,
        quantity: task.hours_spent,
        price: task.price ? (taskPrice / task.hours_spent) : hourlyRate,
      };
      
      // Add the item to the invoice (this would normally update the database)
      console.log("Adding item to invoice:", newItem);
      
      toast.success("Invoice updated with completed task.");
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice with task data.");
    }
  };
  
  // Function to remove task from invoice if the association is removed
  const removeTaskFromInvoice = async (invoiceId: string, taskId: string) => {
    try {
      const invoicePromise = getInvoiceById(invoiceId);
      let invoice: Invoice | null = null;
      
      await resolvePromiseAndSetState(invoicePromise, (data) => {
        invoice = data;
      });
      
      if (!invoice) {
        return;
      }
      
      // Find and remove any items associated with this task
      const taskTitle = tasks.find(t => t.id === taskId)?.title || "";
      
      if (taskTitle) {
        console.log("Removing task from invoice:", taskTitle);
        toast.info("Task removed from invoice.");
      }
    } catch (error) {
      console.error("Error removing task from invoice:", error);
      toast.error("Failed to update invoice.");
    }
  };

  // Determine dialog title and description based on user role
  let dialogTitle = isEditing ? "Edit Task" : "Add New Task";
  let dialogDescription = isEditing
    ? "Update the task information below."
    : "Enter the details for the new task.";

  if (currentUser.role === 'foreman') {
    dialogTitle = isEditing ? "Manage Task" : "Assign New Task";
    dialogDescription = isEditing
      ? "Update task details and assignment."
      : "Create a new task and assign it to a mechanic.";
  }

  if (loading) {
    return null; // or show a loading indicator
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <TaskForm
          defaultValues={
            task
              ? {
                  title: task.title,
                  description: task.description,
                  mechanicId: task.mechanic_id,
                  status: task.status,
                  hoursEstimated: task.hours_estimated,
                  hoursSpent: task.hours_spent,
                  invoiceId: task.invoice_id,
                  vehicleId: task.vehicle_id,
                  location: task.location || "workshop",
                  price: task.price,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          formId={formId}
          userRole={currentUser.role}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            {isEditing ? "Update" : (currentUser.role === 'foreman' ? "Assign" : "Add")} Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
