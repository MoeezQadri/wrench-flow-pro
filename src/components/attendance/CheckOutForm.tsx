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
import { Textarea } from "@/components/ui/textarea";
import { Attendance } from '@/types';

const checkOutSchema = z.object({
  checkOut: z.string().min(1, { message: "Check-out time is required" }),
  notes: z.string().optional()
});

export type CheckOutFormValues = z.infer<typeof checkOutSchema>;

interface CheckOutFormProps {
  attendance: Attendance;
  onSubmit: (attendanceId: string, checkOutData: { check_out: string; notes?: string }) => Promise<void>;
}

const CheckOutForm: React.FC<CheckOutFormProps> = ({ attendance, onSubmit }) => {
  const form = useForm<CheckOutFormValues>({
    resolver: zodResolver(checkOutSchema),
    defaultValues: {
      checkOut: new Date().toTimeString().slice(0, 5), // Current time as HH:MM
      notes: attendance.notes || ""
    }
  });

  const handleSubmit = async (data: CheckOutFormValues) => {
    console.log("CheckOutForm handleSubmit called with data:", data);
    
    try {
      const checkOutData = {
        check_out: data.checkOut,
        notes: data.notes || undefined
      };

      console.log("CheckOutForm calling onSubmit with:", checkOutData);
      await onSubmit(attendance.id, checkOutData);
      console.log("CheckOutForm onSubmit completed successfully");
      form.reset();
      toast.success("Check-out recorded successfully!");
    } catch (error: any) {
      console.error("Error submitting check-out in form:", error);
      const errorMessage = error?.message || "Failed to record check-out. Please try again.";
      toast.error(errorMessage);
      
      // Re-throw the error so the dialog knows not to close
      throw error;
    }
  };

  const calculateWorkingHours = () => {
    if (!attendance.check_in) return '';
    
    const checkIn = new Date(`1970-01-01T${attendance.check_in}`);
    const checkOutTime = form.watch('checkOut');
    if (!checkOutTime) return '';
    
    const checkOut = new Date(`1970-01-01T${checkOutTime}`);
    const diffMs = checkOut.getTime() - checkIn.getTime();
    
    if (diffMs < 0) return 'Invalid time range';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Display check-in info */}
        <div className="bg-muted p-3 rounded-md">
          <div className="text-sm space-y-1">
            <div><span className="font-medium">Date:</span> {attendance.date}</div>
            <div><span className="font-medium">Check-in Time:</span> {attendance.check_in}</div>
            <div><span className="font-medium">Working Hours:</span> {calculateWorkingHours()}</div>
          </div>
        </div>

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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes or updates" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit">Check Out</Button>
        </div>
      </form>
    </Form>
  );
};

export default CheckOutForm;