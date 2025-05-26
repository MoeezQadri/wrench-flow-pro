import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mechanic } from "@/types";
import { generateId, getCurrentUser, hasPermission } from "@/services/data-service";
import MechanicForm from "./MechanicForm";

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

  const handleSubmit = async (data: MechanicFormValues) => {
    try {
      const newMechanic: Mechanic = {
        id: mechanic?.id || generateId("mechanic"),
        name: data.name,
        specialization: data.specialization || "",
        phone: data.phone || "",
        address: data.address || "",
        is_active: true,
        created_at: mechanic?.created_at || new Date().toISOString(),
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
              ? "Update the mechanic information below."
              : "Enter the details for the new mechanic."}
          </DialogDescription>
        </DialogHeader>

        <MechanicForm
          defaultValues={
            mechanic
              ? {
                  name: mechanic.name,
                  specialization: mechanic.specialization || "",
                  phone: mechanic.phone || "",
                  address: mechanic.address || "",
                  idCardImage: mechanic.id_card_image || "",
                  employmentType: mechanic.employment_type || "fulltime",
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
