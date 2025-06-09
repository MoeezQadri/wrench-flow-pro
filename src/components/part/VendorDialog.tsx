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
import { Vendor } from "@/types";
import { useDataContext } from "@/context/data/DataContext";

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const vendorSchema = z.object({
  name: z.string().min(1, { message: "Vendor name is required" }),
  email: z.string().email({ message: "Invalid email format" }).optional().or(z.literal("")),
  phone: z.string().min(1, { message: "Phone number is required" }),
  address: z.string().optional().or(z.literal("")),
  contactPerson: z.string().min(1, { message: "Contact person is required" }),
  paymentTerms: z.string().optional().or(z.literal(""))
});

type VendorFormValues = z.infer<typeof vendorSchema>;

const VendorDialog = ({ open, onOpenChange }: VendorDialogProps) => {
  const {
    addVendor
  } = useDataContext();

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      contactPerson: "",
      paymentTerms: ""
    }
  });

  const handleSubmit = async (data: VendorFormValues) => {
    try {
      const newVendor: Omit<Vendor, "id"> = {
        name: data.name,
        email: data.email || "",
        phone: data.phone,
        address: data.address || "",
        contact_name: data.contactPerson,
      };

      await addVendor(newVendor);
      toast.success("Vendor added successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding vendor:", error);
      toast.error("Failed to add vendor. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Enter the details for the new parts vendor.
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
                    <Input placeholder="AutoParts Plus" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="contact@vendor.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactPerson"
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Vendor St, City, State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Net 30" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
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
