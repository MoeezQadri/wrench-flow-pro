
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
import { AttendanceForm } from "./AttendanceForm";
import { Attendance } from "@/types";

interface AttendanceDialogProps {
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  attendance?: Attendance;
  onSave: (attendance: Omit<Attendance, "id">) => void;
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
  const formId = "attendance-form";

  const handleSave = (data: Omit<Attendance, "id">) => {
    onSave(data);
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
          formId={formId}
          defaultValues={attendance}
          onSubmit={handleSave}
        />
        <DialogFooter>
          <Button type="submit" form={formId}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
