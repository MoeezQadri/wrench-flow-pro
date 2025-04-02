
import React, { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IdCard, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const mechanicSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  specialization: z.string().min(1, { message: "Specialization is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  idCardImage: z.string().optional(),
  employmentType: z.enum(["contractor", "fulltime"]),
  contractorRate: z.number().optional(),
  isActive: z.boolean().default(true),
});

export type MechanicFormValues = z.infer<typeof mechanicSchema>;

interface MechanicFormProps {
  defaultValues?: MechanicFormValues;
  onSubmit: (data: MechanicFormValues) => void;
  formId: string;
}

const MechanicForm = ({ defaultValues, onSubmit, formId }: MechanicFormProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(defaultValues?.idCardImage || null);
  
  const form = useForm<MechanicFormValues>({
    resolver: zodResolver(mechanicSchema),
    defaultValues: defaultValues || {
      name: "",
      specialization: "",
      address: "",
      phone: "",
      idCardImage: "",
      employmentType: "fulltime",
      contractorRate: undefined,
      isActive: true,
    },
  });

  const employmentType = form.watch("employmentType");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }
    
    // Check file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error("Only JPEG, JPG, and PNG images are allowed");
      return;
    }
    
    // Create a preview URL for the uploaded image
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    // In a real application, you would upload the file to a server or storage service
    // For this example, we'll use the preview URL as a placeholder
    form.setValue("idCardImage", previewUrl);
    toast.success("ID card image uploaded successfully");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id={formId} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
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
              <FormLabel>Specialization</FormLabel>
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
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="123 Main St, Anytown" 
                  {...field} 
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="idCardImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Card Image</FormLabel>
              <div className="space-y-2">
                <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-md border-gray-300 bg-gray-50">
                  {imagePreview ? (
                    <div className="relative w-full max-w-md mb-3">
                      <img 
                        src={imagePreview} 
                        alt="ID Card Preview" 
                        className="rounded-md object-cover max-h-48 mx-auto"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview(null);
                          form.setValue("idCardImage", "");
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <IdCard className="w-12 h-12 text-gray-400 mb-2" />
                  )}
                  
                  <label htmlFor="id-card-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex items-center justify-center"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {imagePreview ? "Change Image" : "Upload ID Card"} 
                      </Button>
                    </div>
                    <input
                      id="id-card-upload"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Upload a clear photo of the mechanic's ID card (PNG or JPEG, max 5MB)
                  </p>
                </div>
                <Input
                  {...field}
                  value={field.value || ""}
                  className="hidden" 
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="employmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employment Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fulltime">Full-Time Employee</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {employmentType === "contractor" && (
          <FormField
            control={form.control}
            name="contractorRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contractor Rate ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder="45" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    value={field.value === undefined ? "" : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Set whether the mechanic is currently active
                </div>
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
      </form>
    </Form>
  );
};

export default MechanicForm;
