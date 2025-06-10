
import React, { useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InvoiceItem, Part, Task } from "@/types";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  type: z.enum(["part", "labor", "other"]), // Changed from "parts" to "part"
  quantity: z.coerce.number().min(0.01, "Quantity must be at least 0.01"),
  price: z.coerce.number().min(0, "Price must be at least 0"),
  part_id: z.string().optional(),
  task_id: z.string().optional(),
});

type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;

interface InvoiceItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: InvoiceItem) => void;
  availableParts: Part[];
  availableTasks: Task[];
  vehicleId: string;
  editingItem?: InvoiceItem | null;
}

const InvoiceItemForm: React.FC<InvoiceItemFormProps> = ({
  open,
  onOpenChange,
  onSave,
  availableParts,
  availableTasks,
  vehicleId,
  editingItem
}) => {
  const form = useForm<InvoiceItemFormData>({
    resolver: zodResolver(invoiceItemSchema),
    defaultValues: {
      description: "",
      type: "other",
      quantity: 1,
      price: 0,
      part_id: "",
      task_id: "",
    },
  });

  const watchedType = form.watch("type");

  useEffect(() => {
    if (editingItem) {
      form.reset({
        description: editingItem.description,
        type: editingItem.type,
        quantity: editingItem.quantity,
        price: editingItem.price,
        part_id: editingItem.part_id || "",
        task_id: editingItem.task_id || "",
      });
    } else {
      form.reset({
        description: "",
        type: "other",
        quantity: 1,
        price: 0,
        part_id: "",
        task_id: "",
      });
    }
  }, [editingItem, form]);

  const handleSubmit = (data: InvoiceItemFormData) => {
    const item: InvoiceItem = {
      id: editingItem?.id || `item-${Date.now()}`,
      description: data.description,
      type: data.type,
      quantity: data.quantity,
      price: data.price,
      part_id: data.part_id || undefined,
      task_id: data.task_id || undefined,
      is_auto_added: false,
    };

    onSave(item);
    form.reset();
  };

  const handlePartSelect = (partId: string) => {
    const part = availableParts.find(p => p.id === partId);
    if (part) {
      form.setValue("description", part.name);
      form.setValue("price", part.price);
    }
  };

  const handleTaskSelect = (taskId: string) => {
    const task = availableTasks.find(t => t.id === taskId);
    if (task) {
      form.setValue("description", task.title);
      form.setValue("price", task.price || 0);
      form.setValue("quantity", task.hoursEstimated || 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Edit Invoice Item" : "Add Custom Invoice Item"}
          </DialogTitle>
          <DialogDescription>
            Add a custom item or select from available parts and tasks.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="part">Parts</SelectItem>
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedType === "part" && (
              <FormField
                control={form.control}
                name="part_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Part (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value) handlePartSelect(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose from available parts" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableParts.map((part) => (
                          <SelectItem key={part.id} value={part.id}>
                            {part.name} - ${part.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchedType === "labor" && (
              <FormField
                control={form.control}
                name="task_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Task (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value) handleTaskSelect(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose from available tasks" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title} - ${(task.price || 0).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Item description" 
                      {...field} 
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingItem ? "Update" : "Add"} Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceItemForm;
