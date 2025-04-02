
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Payment } from "@/types";
import { toast } from "sonner";
import { useFormContext } from "react-hook-form";
import { format } from "date-fns";

interface PaymentsSectionProps {
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  total: number;
}

const PaymentsSection = ({
  payments,
  setPayments,
  total,
}: PaymentsSectionProps) => {
  const [newPaymentAmount, setNewPaymentAmount] = useState<number | string>("");
  const [newPaymentMethod, setNewPaymentMethod] = useState<"cash" | "card" | "bank-transfer">("cash");
  const [newPaymentNotes, setNewPaymentNotes] = useState("");
  
  const form = useFormContext();
  const status = form.watch("status");
  
  // Define which statuses allow editing payments
  const canEditPayments = ['open', 'in-progress', 'completed', 'partial'].includes(status);

  // Add new payment
  const handleAddPayment = () => {
    if (typeof newPaymentAmount !== "number" || newPaymentAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    // Calculate total payments to check if we're exceeding the invoice total
    const existingPaymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
    if (existingPaymentsTotal + newPaymentAmount > total) {
      toast.error("Total payments cannot exceed invoice total");
      return;
    }

    const newPayment: Payment = {
      id: Date.now().toString(), // Temporary ID
      invoiceId: "", // Will be set when the invoice is created
      amount: newPaymentAmount as number,
      method: newPaymentMethod,
      date: format(new Date(), "yyyy-MM-dd"),
      notes: newPaymentNotes,
    };

    setPayments([...payments, newPayment]);
    
    // Update invoice status based on payments
    const newTotalPayments = existingPaymentsTotal + newPaymentAmount;
    if (newTotalPayments === total) {
      form.setValue("status", "paid");
    } else if (newTotalPayments > 0) {
      form.setValue("status", "partial");
    }
    
    // Reset payment form
    setNewPaymentAmount("");
    setNewPaymentMethod("cash");
    setNewPaymentNotes("");
  };

  // Remove payment
  const handleRemovePayment = (paymentId: string) => {
    setPayments(payments.filter(payment => payment.id !== paymentId));
    
    // Update invoice status based on remaining payments
    const remainingPayments = payments.filter(payment => payment.id !== paymentId);
    const remainingTotal = remainingPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    if (remainingTotal === 0) {
      // If no payments left, revert to previous status (based on current status)
      if (status === "paid" || status === "partial") {
        form.setValue("status", "completed");
      }
    } else if (remainingTotal < total) {
      form.setValue("status", "partial");
    }
  };

  // Calculate total payments
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Calculate remaining balance
  const remainingBalance = total - totalPayments;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Payments</h3>
      
      {/* Add New Payment Form - Only visible in editable statuses */}
      {canEditPayments && (
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <FormLabel htmlFor="paymentAmount">Amount ($)</FormLabel>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min="0"
                value={newPaymentAmount}
                onChange={(e) => setNewPaymentAmount(parseFloat(e.target.value) || "")}
              />
            </div>
            
            <div>
              <FormLabel htmlFor="paymentMethod">Method</FormLabel>
              <Select
                value={newPaymentMethod}
                onValueChange={(value: "cash" | "card" | "bank-transfer") => 
                  setNewPaymentMethod(value)
                }
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <FormLabel htmlFor="paymentNotes">Notes</FormLabel>
              <Input
                id="paymentNotes"
                value={newPaymentNotes}
                onChange={(e) => setNewPaymentNotes(e.target.value)}
                placeholder="Payment reference or notes"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button 
              type="button" 
              onClick={handleAddPayment}
              className="flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </div>
        </Card>
      )}
      
      {/* Payments Table */}
      {payments.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Notes</TableHead>
              {canEditPayments && <TableHead className="w-[80px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.date}</TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>
                  {payment.method === "cash" ? "Cash" : 
                   payment.method === "card" ? "Card" : "Bank Transfer"}
                </TableCell>
                <TableCell>{payment.notes}</TableCell>
                {canEditPayments && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePayment(payment.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            
            <TableRow>
              <TableCell colSpan={1} className="text-right font-medium">
                Total Payments:
              </TableCell>
              <TableCell className="font-medium">${totalPayments.toFixed(2)}</TableCell>
              <TableCell colSpan={canEditPayments ? 3 : 2}></TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell colSpan={1} className="text-right font-medium">
                Remaining Balance:
              </TableCell>
              <TableCell className={`font-medium ${remainingBalance === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                ${remainingBalance.toFixed(2)}
              </TableCell>
              <TableCell colSpan={canEditPayments ? 3 : 2}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No payments added yet. Add a payment to track invoice status.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentsSection;
