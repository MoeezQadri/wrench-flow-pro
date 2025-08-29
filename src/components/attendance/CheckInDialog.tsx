import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CheckInForm from "./CheckInForm";
import { Attendance } from "@/types";

interface CheckInDialogProps {
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  onSave: (attendance: Omit<Attendance, "id">) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CheckInDialog({
  trigger,
  title = "Check In",
  description = "Record check-in time for a mechanic.",
  onSave,
  open,
  onOpenChange,
}: CheckInDialogProps) {
  const handleSave = async (data: Omit<Attendance, "id">) => {
    console.log("CheckInDialog handleSave called with:", data);
    try {
      await onSave(data);
      console.log("CheckInDialog onSave completed successfully");
      // Close dialog immediately after successful save
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("CheckInDialog onSave failed:", error);
      // Don't close dialog on error, let user try again
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CheckInForm onSubmit={handleSave} />
      </DialogContent>
    </Dialog>
  );
}