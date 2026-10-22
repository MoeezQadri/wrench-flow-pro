
import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";

const InvoiceDetailsFields = () => {
  const form = useFormContext();
  const { getCurrencySymbol } = useOrganizationSettings();
  const currencySymbol = getCurrencySymbol();
  
  // Get values with safe defaults
  const discountType = form.watch("discountType") || "none";
  const status = form.watch("status") || "approved";
  
  // Discounts can be adjusted on active billing documents and estimates.
  const canEditDiscount = ['approved', 'work_in_progress', 'work_completed', 'payment_pending', 'partial_payment', 'estimate'].includes(status);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Invoice Date */}
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>{status === 'estimate' ? 'Estimate Date' : 'Invoice Date'}</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className="pl-3 text-left font-normal h-10"
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
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Status */}
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Status</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value || "approved"}
            >
              <FormControl>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="estimate">Estimate</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="work_in_progress">Work in progress</SelectItem>
                <SelectItem value="payment_pending">Payment pending</SelectItem>
                <SelectItem value="partial_payment">Partial payment</SelectItem>
                <SelectItem value="payment_completed">Payment completed</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tax Rate */}
      <FormField
        control={form.control}
        name="taxRate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tax Rate (%)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01" 
                min="0" 
                max="100"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Discount Type */}
      <FormField
        control={form.control}
        name="discountType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Discount Type</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value || "none"}
              disabled={!canEditDiscount}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">No Discount</SelectItem>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="fixed">{`Fixed Amount (${currencySymbol})`}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Discount Value */}
      {discountType && discountType !== "none" && (
        <FormField
          control={form.control}
          name="discountValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {discountType === "percentage" ? "Discount Percentage (%)" : `Discount Amount (${currencySymbol})`}
              </FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  max={discountType === "percentage" ? "100" : undefined}
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  disabled={!canEditDiscount}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

export default InvoiceDetailsFields;
