
import React, { useState, useEffect } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Mechanic } from "@/types";
import { useDataContext } from "@/context/data/DataContext";

interface MechanicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technician?: Mechanic | null;
  onSave: (technician: Mechanic) => void;
}

interface MechanicFormValues {
  name: string;
  specialization: string;
  phone: string;
  address: string;
  employment_type: 'fulltime' | 'contractor';
  is_active: boolean;
}

const mechanicSchema = z.object({
  name: z.string().min(1, { message: "Mechanic name is required" }),
  specialization: z.string().optional().or(z.literal("")),
  phone: z.string().min(1, { message: "Phone number is required" }),
  address: z.string().optional().or(z.literal("")),
  employment_type: z.enum(['fulltime', 'contractor'], {
    required_error: "Employment type is required.",
  }),
  is_active: z.boolean().default(true),
});

const MechanicDialog: React.FC<MechanicDialogProps> = ({ open, onOpenChange, technician, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    addMechanic, updateMechanic
  } = useDataContext();

  const form = useForm<MechanicFormValues>({
    resolver: zodResolver(mechanicSchema),
    defaultValues: {
      name: technician?.name || "",
      specialization: technician?.specialization || "",
      phone: technician?.phone || "",
      address: technician?.address || "",
      employment_type: technician?.employment_type || "fulltime",
      is_active: technician?.is_active ?? true,
    },
  });

  useEffect(() => {
    if (technician) {
      form.reset({
        name: technician.name,
        specialization: technician.specialization || "",
        phone: technician.phone || "",
        address: technician.address || "",
        employment_type: technician.employment_type,
        is_active: technician.is_active,
      });
    }
  }, [technician, form]);

  const handleSubmit = async (data: MechanicFormValues) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const mechanicData: Omit<Mechanic, 'id'> = {
        name: data.name,
        specialization: data.specialization || undefined,
        phone: data.phone,
        address: data.address || undefined,
        employment_type: data.employment_type,
        is_active: data.is_active,
      };

      if (technician) {
        // Update existing technician
        await updateMechanic(technician.id, mechanicData);
        onSave({ ...technician, ...mechanicData });
      } else {
        // Add new technician
        const newMechanic = await addMechanic(mechanicData);
        onSave(newMechanic);
      }

      toast.success(technician ? "Mechanic updated successfully!" : "Mechanic added successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding/updating technician:", error);
      toast.error("Failed to save technician. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{technician ? "Edit Mechanic" : "Add New Mechanic"}</DialogTitle>
          <DialogDescription>
            {technician ? "Update technician details." : "Enter the details for the new technician."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Engine Repair" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="555-123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City, State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fulltime">Full-time</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Active</FormLabel>
                    <FormDescription>
                      Whether the technician is currently active
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (technician ? "Updating..." : "Adding...") 
                  : (technician ? "Update Mechanic" : "Add Mechanic")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MechanicDialog;
