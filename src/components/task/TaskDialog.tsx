
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
import { Task } from "@/types";
import TaskForm, { TaskFormValues } from "./TaskForm";
import { generateId, getCurrentUser, hasPermission } from "@/services/data-service";

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
  const canEdit = hasPermission(currentUser, 'tasks', 'manage') ||
    (currentUser.role === 'mechanic' && 
     currentUser.mechanicId === task?.mechanicId && 
     hasPermission(currentUser, 'tasks', 'manage'));

  if (!canEdit) {
    return null;
  }

  const handleSubmit = (data: TaskFormValues) => {
    try {
      // Ensure all required fields are provided
      const newTask: Task = {
        id: task?.id || generateId("task"),
        title: data.title,
        description: data.description,
        mechanicId: data.mechanicId,
        status: data.status,
        hoursEstimated: data.hoursEstimated,
        hoursSpent: data.hoursSpent,
        invoiceId: data.invoiceId,
      };
      
      onSave(newTask);
      toast.success(`Task ${isEditing ? "updated" : "added"} successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Add New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the task information below."
              : "Enter the details for the new task."}
          </DialogDescription>
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
