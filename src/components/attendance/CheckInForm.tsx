import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Attendance } from '@/types';
import { useDataContext } from '@/context/data/DataContext';

const checkInSchema = z.object({
  mechanicId: z.string().min(1, { message: "Mechanic is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  checkIn: z.string().min(1, { message: "Check-in time is required" }),
  status: z.enum(["pending", "approved", "rejected", "present", "late", "absent", "half-day"]).default('pending'),
  notes: z.string().optional()
});

export type CheckInFormValues = z.infer<typeof checkInSchema>;

interface CheckInFormProps {
  onSubmit: (data: Omit<Attendance, 'id'>) => Promise<void>;
}

const CheckInForm: React.FC<CheckInFormProps> = ({ onSubmit }) => {
  const { mechanics } = useDataContext();

  const form = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      mechanicId: "",
      date: new Date().toISOString().slice(0, 10),
      checkIn: new Date().toTimeString().slice(0, 5), // Current time as HH:MM
      status: "pending",
      notes: ""
    }
  });

  const handleSubmit = async (data: CheckInFormValues) => {
    console.log("CheckInForm handleSubmit called with data:", data);
    
    // Validate that we have a mechanic selected
    if (!data.mechanicId) {
      toast.error("Please select a mechanic");
      return;
    }

    try {
      const attendanceData: Omit<Attendance, 'id'> = {
        mechanic_id: data.mechanicId,
        date: data.date,
        check_in: data.checkIn,
        check_out: undefined, // No check-out time for check-in
        status: data.status as 'pending' | 'approved' | 'rejected',
        notes: data.notes || undefined,
        created_at: new Date().toISOString(),
        approved_by: undefined
      };

      console.log("CheckInForm calling onSubmit with:", attendanceData);
      await onSubmit(attendanceData);
      console.log("CheckInForm onSubmit completed successfully");
      form.reset();
      toast.success("Check-in recorded successfully!");
    } catch (error: any) {
      console.error("Error submitting check-in in form:", error);
      const errorMessage = error?.message || "Failed to record check-in. Please try again.";
      toast.error(errorMessage);
      
      // Re-throw the error so the dialog knows not to close
      throw error;
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
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
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

        <div className="flex justify-end">
          <Button type="submit">Check In</Button>
        </div>
      </form>
    </Form>
  );
};

export default CheckInForm;