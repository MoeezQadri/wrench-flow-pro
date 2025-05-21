
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
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const handleSubmit = async (data: MechanicFormValues) => {
    try {
      // Ensure all required fields are provided
      const newMechanic: Mechanic = {
        id: mechanic?.id || generateId("mechanic"),
        name: data.name,
        specialization: data.specialization,
        address: data.address,
        phone: data.phone,
        id_card_image: data.idCardImage,
        employment_type: data.employmentType,
        is_active: data.isActive
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
      <DialogContent className="sm:max-w-[600px] w-full">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Mechanic" : "Add New Mechanic"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the mechanic's information below."
              : "Enter the details for the new mechanic."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <MechanicForm
            defaultValues={
              mechanic
                ? {
                    name: mechanic.name,
                    specialization: mechanic.specialization,
                    address: mechanic.address,
                    phone: mechanic.phone,
                    idCardImage: mechanic.id_card_image,
                    employmentType: mechanic.employment_type,
                    isActive: mechanic.is_active,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            formId={formId}
          />
        </ScrollArea>

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
