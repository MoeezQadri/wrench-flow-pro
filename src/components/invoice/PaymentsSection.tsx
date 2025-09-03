import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Payment } from "@/types";
import { useFormContext } from "react-hook-form";
import { nanoid } from "nanoid";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { usePayments } from "@/context/data/hooks/usePayments";
import { useOrganizationContext } from "@/hooks/useOrganizationContext";
import { toast } from "sonner";

interface PaymentsSectionProps {
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  total: number;
  invoiceId?: string;
}

const PaymentsSection: React.FC<PaymentsSectionProps> = ({ payments, setPayments, total, invoiceId }) => {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const { formatCurrency } = useOrganizationSettings();
  const { setValue, watch } = useFormContext();
  const { addPayment, removePayment } = usePayments();
  const selectedOrganizationId = ''; // Temporarily disabled
  const status = watch("status");

  // Determine if payments can be edited based on invoice status
  const canEditPayments = status !== "paid" && status !== "cancelled";

  const handleAddPayment = useCallback(async () => {
    if (!paymentAmount || !paymentMethod) {
      return;
    }

    const amount = parseFloat(paymentAmount);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    if (totalPaid + amount > total) {
      toast.error(`Payment amount exceeds remaining balance. Remaining: ${formatCurrency(total - totalPaid)}`);
      return;
    }

    try {
      if (invoiceId && selectedOrganizationId) {
        // If we have an invoice ID, save to database immediately
        const newPayment = await addPayment({
          invoice_id: invoiceId,
          amount: amount,
          method: paymentMethod,
          date: new Date().toISOString(),
          notes: paymentNotes || undefined,
          organization_id: selectedOrganizationId
        });
        
        console.log("PAYMENTS_SECTION: Payment saved to database:", newPayment);
        setPayments(prev => [...prev, newPayment]);
      } else {
        // If no invoice ID, add to local state (for new invoices)
        const tempPayment: Payment = {
          id: nanoid(),
          invoice_id: invoiceId || "",
          amount: amount,
          date: new Date().toISOString(),
          method: paymentMethod,
          notes: paymentNotes || null
        };

        console.log("PAYMENTS_SECTION: Adding temporary payment:", tempPayment);
        setPayments(prev => [...prev, tempPayment]);
      }

      // Reset form
      setPaymentAmount("");
      setPaymentMethod("");
      setPaymentNotes("");

      // Update invoice status based on payments
      const newTotalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0) + amount;
      if (newTotalPaid >= total) {
        setValue("status", "paid");
      } else if (newTotalPaid > 0) {
        setValue("status", "partially_paid");
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      // Error already handled by the hook with toast
    }
  }, [paymentAmount, paymentMethod, paymentNotes, payments, total, invoiceId, selectedOrganizationId, addPayment, setPayments, setValue, formatCurrency]);

  const handleRemovePayment = useCallback(async (paymentId: string) => {
    try {
      if (invoiceId) {
        // If we have an invoice ID, remove from database
        await removePayment(paymentId);
        console.log("PAYMENTS_SECTION: Payment removed from database:", paymentId);
      }
      
      // Update local state
      const updatedPayments = payments.filter(payment => payment.id !== paymentId);
      setPayments(updatedPayments);

      // Update invoice status based on remaining payments
      const totalPaid = updatedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      if (totalPaid === 0) {
        setValue("status", "pending");
      } else if (totalPaid < total) {
        setValue("status", "partially_paid");
      } else {
        setValue("status", "paid");
      }
    } catch (error) {
      console.error("Error removing payment:", error);
      // Error already handled by the hook with toast
    }
  }, [invoiceId, removePayment, payments, setPayments, setValue, total]);

  // Calculate totals
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = total - totalPaid;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEditPayments && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="paymentAmount">Amount</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentNotes">Notes</Label>
              <Input
                id="paymentNotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddPayment} disabled={!paymentAmount || !paymentMethod}>
                Add Payment
              </Button>
            </div>
          </div>
        )}

        {payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Notes</TableHead>
                {canEditPayments && <TableHead className="w-[80px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {(() => {
                      try {
                        return new Date(payment.date).toLocaleDateString();
                      } catch {
                        return String(payment.date);
                      }
                    })()}
                  </TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    {payment.method === "cash" ? "Cash" : 
                     payment.method === "card" ? "Card" : 
                     payment.method === "bank_transfer" ? "Bank Transfer" :
                     payment.method === "check" ? "Check" : payment.method}
                  </TableCell>
                  <TableCell>{payment.notes}</TableCell>
                  {canEditPayments && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePayment(payment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No payments added yet.
          </div>
        )}

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between items-center font-medium">
            <span>Total Paid:</span>
            <span>{formatCurrency(totalPaid)}</span>
          </div>
          <div className="flex justify-between items-center font-medium">
            <span>Remaining Balance:</span>
            <span className={remainingBalance === 0 ? "text-green-600" : "text-orange-600"}>
              {formatCurrency(remainingBalance)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentsSection;