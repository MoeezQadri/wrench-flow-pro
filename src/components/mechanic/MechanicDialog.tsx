
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
import { Mechanic } from "@/types";
import MechanicForm, { MechanicFormValues } from "./MechanicForm";
import { generateId, getCurrentUser, hasPermission } from "@/services/data-service";

interface MechanicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (mechanic: Mechanic) => void;
  mechanic?: Mechanic;
}

const MechanicDialog = ({ open, onOpenChange, onSave, mechanic }: MechanicDialogProps) => {
  const isEditing = !!mechanic;
  const formId = "mechanic-form";
  const currentUser = getCurrentUser();
  
  // Check if user has permission to manage mechanics
  const canManageMechanics = hasPermission(currentUser, 'mechanics', 'manage');
  
  if (!canManageMechanics) {
    return null;
  }

  const handleSubmit = (data: MechanicFormValues) => {
    try {
      // Ensure all required fields are provided
      const newMechanic: Mechanic = {
        id: mechanic?.id || generateId("mechanic"),
        name: data.name,
        specialization: data.specialization,
        hourlyRate: data.hourlyRate,
        isActive: data.isActive
      };
      
      onSave(newMechanic);
      toast.success(`Mechanic ${isEditing ? "updated" : "added"} successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving mechanic:", error);
      toast.error("Failed to save mechanic. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Mechanic" : "Add New Mechanic"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the mechanic's information below."
              : "Enter the details for the new mechanic."}
          </DialogDescription>
        </DialogHeader>

        <MechanicForm
          defaultValues={
            mechanic
              ? {
                  name: mechanic.name,
                  specialization: mechanic.specialization,
                  hourlyRate: mechanic.hourlyRate,
                  isActive: mechanic.isActive,
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
            {isEditing ? "Update" : "Add"} Mechanic
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MechanicDialog;
