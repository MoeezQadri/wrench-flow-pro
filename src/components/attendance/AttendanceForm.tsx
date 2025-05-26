import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Attendance } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AttendanceFormProps {
  onSubmit: (data: Omit<Attendance, "id">) => void;
}

const attendanceSchema = z.object({
  mechanicId: z.string().min(1, { message: "Mechanic ID is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  checkIn: z.string().min(1, { message: "Check-in time is required" }),
  checkOut: z.string().optional(),
  status: z.enum(["present", "late", "absent", "half-day"], {
    required_error: "Please select an attendance status.",
  }),
  notes: z.string().optional(),
});

export type AttendanceFormValues = z.infer<typeof attendanceSchema>;

const AttendanceForm = ({ onSubmit }: AttendanceFormProps) => {
  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      mechanicId: "",
      date: "",
      checkIn: "",
      checkOut: "",
      status: "present",
      notes: "",
    },
  });

  const handleSubmit = async (values: AttendanceFormValues) => {
    try {
      onSubmit({
        mechanicId: values.mechanicId,
        date: values.date,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        status: values.status,
        notes: values.notes,
        created_at: new Date().toISOString(),
        approved_by: "",
      });
      toast.success("Attendance recorded successfully!");
      form.reset();
    } catch (error) {
      console.error("Error recording attendance:", error);
      toast.error("Failed to record attendance. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="mechanicId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mechanic ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter mechanic ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="checkIn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Check-in Time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="checkOut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Check-out Time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select attendance status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="half-day">Half Day</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input placeholder="Additional notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Record Attendance</Button>
      </form>
    </Form>
  );
};

export default AttendanceForm;
