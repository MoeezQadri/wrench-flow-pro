import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Attendance, Mechanic } from '@/types';

const attendanceSchema = z.object({
  mechanicId: z.string().min(1, { message: "Mechanic is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  checkIn: z.string().min(1, { message: "Check-in time is required" }),
  checkOut: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  approved_by: z.string().optional()
});

export type AttendanceFormValues = z.infer<typeof attendanceSchema>;

interface AttendanceFormProps {
  onSubmit: (data: Omit<Attendance, 'id'>) => Promise<void>;
  initialData?: Attendance;
  mechanics: Mechanic[];
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ onSubmit, initialData, mechanics }) => {
  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      mechanicId: initialData?.mechanic_id || "",
      date: initialData?.date || new Date().toISOString().slice(0, 10),
      checkIn: initialData?.check_in || "",
      checkOut: initialData?.check_out || "",
      status: initialData?.status || "pending",
      notes: initialData?.notes || "",
      created_at: initialData?.created_at || new Date().toISOString(),
      approved_by: initialData?.approved_by || ""
    }
  });

  const handleSubmit = async (data: AttendanceFormValues) => {
    try {
      const attendanceData: Omit<Attendance, 'id'> = {
        mechanic_id: data.mechanicId,
        date: data.date,
        check_in: data.checkIn,
        check_out: data.checkOut,
        status: data.status as 'pending' | 'approved' | 'rejected',
        notes: data.notes,
        created_at: data.created_at,
        approved_by: data.approved_by
      };
      
      await onSubmit(attendanceData);
      form.reset();
      toast.success("Attendance recorded successfully!");
    } catch (error) {
      console.error("Error submitting attendance:", error);
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
              <FormLabel>Mechanic</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a mechanic" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mechanics.map((mechanic) => (
                    <SelectItem key={mechanic.id} value={mechanic.id}>
                      {mechanic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <FormField
          control={form.control}
          name="checkOut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Check-out Time (Optional)</FormLabel>
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit">Submit Attendance</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default AttendanceForm;
