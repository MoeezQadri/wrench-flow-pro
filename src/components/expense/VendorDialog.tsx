
import React from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { addVendor } from "@/services/data-service";
import { Vendor } from "@/types";

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorAdded?: (vendor: Vendor) => void;
}

const vendorSchema = z.object({
  name: z.string().min(1, { message: "Vendor name is required" }),
  contactName: z.string().min(1, { message: "Contact person is required" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

const VendorDialog = ({ open, onOpenChange, onVendorAdded }: VendorDialogProps) => {
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      contactName: "",
      phone: "",
    }
  });

  const handleSubmit = (data: VendorFormValues) => {
    try {
      // Create a new vendor with minimal required fields
      const newVendor: Omit<Vendor, "id"> = {
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: "", // Adding empty defaults for required fields
        address: "",
      };
      
      const addedVendor = addVendor(newVendor);
      toast.success("Vendor added successfully!");
      
      if (onVendorAdded && addedVendor) {
        onVendorAdded(addedVendor);
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding vendor:", error);
      toast.error("Failed to add vendor. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Enter vendor details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC Parts Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Point of Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
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

            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Vendor</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default VendorDialog;
