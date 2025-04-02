
import React from "react";
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
import { Task, InvoiceItem } from "@/types";
import TaskForm, { TaskFormValues } from "./TaskForm";
import { 
  generateId, 
  getCurrentUser, 
  hasPermission, 
  getInvoiceById, 
  tasks,
  invoices
} from "@/services/data-service";

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

  const handleSubmit = (data: TaskFormValues) => {
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
      };
      
      // Update the invoice if task is completed
      if (isBeingCompleted && data.invoiceId && data.invoiceId !== "none") {
        updateInvoiceOnTaskCompletion(data.invoiceId, newTask);
      }
      
      // If invoice association is removed or changed, update the old invoice
      if (existingInvoiceId && existingInvoiceId !== data.invoiceId && wasCompleted) {
        removeTaskFromInvoice(existingInvoiceId, task.id);
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
  const updateInvoiceOnTaskCompletion = (invoiceId: string, task: Task) => {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) return;
    
    // Only proceed if we have hours spent data
    if (!task.hoursSpent) {
      toast.warning("Task marked as completed but no hours spent recorded.");
      return;
    }
    
    // Create a new invoice item for this task
    const hourlyRate = 85; // Default hourly rate for labor
    const newItem: InvoiceItem = {
      id: generateId("item"),
      type: "labor",
      description: `Labor: ${task.title}`,
      quantity: task.hoursSpent,
      price: hourlyRate,
    };
    
    // Add the item to the invoice
    invoice.items.push(newItem);
    
    // Update invoice status if needed
    if (invoice.status === "open") {
      invoice.status = "in-progress";
    }
    
    toast.success("Invoice updated with completed task.");
  };
  
  // Function to remove task from invoice if the association is removed
  const removeTaskFromInvoice = (invoiceId: string, taskId: string) => {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) return;
    
    // Find and remove any items associated with this task
    // This is a simplified approach - in a real system, you'd have a more direct relationship
    const taskItems = invoice.items.filter(item => 
      item.type === "labor" && item.description.includes(tasks.find(t => t.id === taskId)?.title || "")
    );
    
    if (taskItems.length > 0) {
      invoice.items = invoice.items.filter(item => !taskItems.includes(item));
      toast.info("Task removed from invoice.");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
