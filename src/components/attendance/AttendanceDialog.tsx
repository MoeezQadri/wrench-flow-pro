
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
import AttendanceForm from "./AttendanceForm";
import { Attendance } from "@/types";

interface AttendanceDialogProps {
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  attendance?: Attendance;
  onSave: (attendance: Omit<Attendance, "id">) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AttendanceDialog({
  trigger,
  title = "Add Attendance Record",
  description = "Record a new attendance entry for a mechanic.",
  attendance,
  onSave,
  open,
  onOpenChange,
}: AttendanceDialogProps) {
  const handleSave = async (data: Omit<Attendance, "id">) => {
    await onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <AttendanceForm
          initialData={attendance}
          onSubmit={handleSave}
        />
      </DialogContent>
    </Dialog>
  );
}
