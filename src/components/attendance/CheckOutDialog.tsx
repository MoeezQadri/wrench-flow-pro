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
import CheckOutForm from "./CheckOutForm";
import { Attendance } from "@/types";

interface CheckOutDialogProps {
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  attendance: Attendance;
  onSave: (attendanceId: string, checkOutData: { check_out: string; notes?: string }) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CheckOutDialog({
  trigger,
  title = "Check Out",
  description = "Record check-out time for this attendance record.",
  attendance,
  onSave,
  open,
  onOpenChange,
}: CheckOutDialogProps) {
  const handleSave = async (attendanceId: string, checkOutData: { check_out: string; notes?: string }) => {
    console.log("CheckOutDialog handleSave called with:", attendanceId, checkOutData);
    try {
      await onSave(attendanceId, checkOutData);
      console.log("CheckOutDialog onSave completed successfully");
      // Close dialog immediately after successful save
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("CheckOutDialog onSave failed:", error);
      // Don't close dialog on error, let user try again
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CheckOutForm attendance={attendance} onSubmit={handleSave} />
      </DialogContent>
    </Dialog>
  );
}