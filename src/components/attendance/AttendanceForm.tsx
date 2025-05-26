
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Attendance } from "@/types";
import { getMechanics, getCurrentUser } from "@/services/data-service";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const attendanceFormSchema = z.object({
  mechanicId: z.string().min(1, "Mechanic is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  checkIn: z.string().min(1, "Check-in time is required"),
  checkOut: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]),
  notes: z.string().optional(),
});

type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

interface AttendanceFormProps {
  formId: string;
  defaultValues?: Attendance;
  onSubmit: (data: Omit<Attendance, "id">) => void;
}

export const AttendanceForm = ({
  formId,
  defaultValues,
  onSubmit,
}: AttendanceFormProps) => {
  const [mechanics, setMechanics] = useState<any[]>([]);
  const currentUser = getCurrentUser();

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: defaultValues
      ? {
          mechanicId: defaultValues.mechanic_id,
          date: new Date(defaultValues.date),
          checkIn: defaultValues.check_in,
          checkOut: defaultValues.check_out || "",
          status: defaultValues.status === "present" || defaultValues.status === "late" || defaultValues.status === "absent" || defaultValues.status === "half-day" 
            ? "pending" 
            : defaultValues.status,
          notes: defaultValues.notes || "",
        }
      : {
          mechanicId: "",
          date: new Date(),
          checkIn: format(new Date(), "HH:mm"),
          checkOut: "",
          status: "pending",
          notes: "",
        },
  });

  useEffect(() => {
    const loadMechanics = async () => {
      try {
        const mechanicsData = await getMechanics();
        setMechanics(mechanicsData.filter((m) => m.is_active));
      } catch (error) {
        console.error("Error loading mechanics:", error);
      }
    };

    loadMechanics();
  }, []);

  const handleSubmit = (values: AttendanceFormValues) => {
    const formattedDate = format(values.date, "yyyy-MM-dd");
    
    const attendanceData: Omit<Attendance, "id"> = {
      mechanic_id: values.mechanicId,
      date: formattedDate,
      check_in: values.checkIn,
      check_out: values.checkOut || null,
      status: values.status,
      notes: values.notes || "",
      approved_by: null,
      created_at: new Date().toISOString(),
    };

    onSubmit(attendanceData);
  };

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
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

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="checkIn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check In Time</FormLabel>
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
                <FormLabel>Check Out Time (Optional)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} value={field.value || ""} />
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
                <Textarea
                  placeholder="Enter any additional notes"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
