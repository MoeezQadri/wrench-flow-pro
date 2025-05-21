
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
     currentUser.mechanicId === task?.mechanicId && 
     hasPermission(currentUser, 'tasks', 'manage'));

  if (!canEdit) {
    return null;
  }

  // Fetch invoice data if task has an invoiceId
  useEffect(() => {
    if (open && task?.invoiceId) {
      setLoading(true);
      const fetchInvoice = async () => {
        try {
          const invoicePromise = getInvoiceById(task.invoiceId!);
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
      const existingInvoiceId = task?.invoiceId;
      const wasCompleted = task?.status === "completed";
      const isBeingCompleted = data.status === "completed" && (!task || task.status !== "completed");
      
      // Ensure all required fields are provided
      const newTask: Task = {
        id: task?.id || generateId("task"),
        title: data.title,
        description: data.description,
        mechanicId: data.mechanicId,
        status: data.status,
        hoursEstimated: data.hoursEstimated,
        hoursSpent: data.hoursSpent,
        // Set invoiceId to undefined if "none" is selected
        invoiceId: data.invoiceId === "none" ? undefined : data.invoiceId,
        // Add new fields
        vehicleId: data.vehicleId === "none" ? undefined : data.vehicleId,
        location: data.location || "workshop",
        price: data.price,
      };
      
      // If task is being completed, add timestamp and user information
      if (isBeingCompleted) {
        newTask.completedBy = currentUser.id;
        newTask.completedAt = new Date().toISOString();
        newTask.endTime = new Date().toISOString();
      }
      
      // Find open invoice for the vehicle if task is completed and not already assigned to an invoice
      if (isBeingCompleted && newTask.vehicleId && !newTask.invoiceId) {
        const openInvoices = invoices.filter(
          invoice => invoice.vehicleId === newTask.vehicleId && 
                    (invoice.status === 'open' || invoice.status === 'in-progress')
        );
        
        if (openInvoices.length > 0) {
          // Use the most recent open invoice
          const latestInvoice = openInvoices.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          
          newTask.invoiceId = latestInvoice.id;
          
          // Notify the user that the task was added to an existing invoice
          const vehiclePromise = getVehicleById(newTask.vehicleId);
          await resolvePromiseAndSetState(vehiclePromise, (vehicle) => {
            if (vehicle) {
              toast.info(
                `Task added to existing invoice for ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
                { duration: 5000 }
              );
            }
          });
          
          // Update the invoice with this task
          await updateInvoiceOnTaskCompletion(latestInvoice.id, newTask);
        }
      }
      // Update the invoice if task is completed and has an invoiceId
      else if (isBeingCompleted && data.invoiceId && data.invoiceId !== "none") {
        await updateInvoiceOnTaskCompletion(data.invoiceId, newTask);
      }
      
      // If invoice association is removed or changed, update the old invoice
      if (existingInvoiceId && existingInvoiceId !== data.invoiceId && wasCompleted) {
        await removeTaskFromInvoice(existingInvoiceId, task.id);
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
      if (!task.hoursSpent) {
        toast.warning("Task marked as completed but no hours spent recorded.");
        return;
      }
      
      // Use custom price if set, otherwise calculate based on hourly rate
      const hourlyRate = 85; // Default hourly rate for labor
      const taskPrice = task.price || (task.hoursSpent * hourlyRate);
      
      // Create a new invoice item for this task
      const newItem: InvoiceItem = {
        id: generateId("item"),
        type: "labor",
        description: `Labor: ${task.title}`,
        quantity: task.hoursSpent,
        price: task.price ? (taskPrice / task.hoursSpent) : hourlyRate,
      };
      
      // Add the item to the invoice
      invoice.items.push(newItem);
      
      // Update invoice status if needed
      if (invoice.status === "open") {
        invoice.status = "in-progress";
      }
      
      // Here you would update the invoice in the database
      // For now we're just using the in-memory data
      
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
      const taskItems = invoice.items.filter(item => 
        item.type === "labor" && item.description.includes(taskTitle)
      );
      
      if (taskItems.length > 0) {
        invoice.items = invoice.items.filter(item => !taskItems.includes(item));
        // Here you would update the invoice in the database
        
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
                  mechanicId: task.mechanicId,
                  status: task.status,
                  hoursEstimated: task.hoursEstimated,
                  hoursSpent: task.hoursSpent,
                  invoiceId: task.invoiceId,
                  vehicleId: task.vehicleId,
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
