import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { Payment } from "@/types";
import { useFormContext } from "react-hook-form";
import { nanoid } from "nanoid";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { usePayments } from "@/context/data/hooks/usePayments";
import { useOrganizationContext } from "@/hooks/useOrganizationContext";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "sonner";
import { formatOrgDate } from '@/utils/datetime';
import { supabase } from '@/integrations/supabase/client';

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
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  // Guards against a second click landing before the first save finishes.
  const savingRef = useRef(false);
  const [overpayDialogOpen, setOverpayDialogOpen] = useState(false);
  const [closeDiscountDialogOpen, setCloseDiscountDialogOpen] = useState(false);
  const { formatCurrency } = useOrganizationSettings();
  const { setValue, watch } = useFormContext();
  const { addPayment, removePayment } = usePayments();
  const { currentUser } = useAuthContext();
  const { selectedOrganizationId } = useOrganizationContext();

  // Get organization ID from current user or selected organization
  const contextOrganizationId = selectedOrganizationId || currentUser?.organization_id || '';
  const status = watch("status");

  // Estimates and declined quotes are not payable documents.
  const canEditPayments = status !== "estimate" && status !== "declined";

  // The invoice itself is the source of truth for the shop, so a payment on an
  // existing invoice is never held back just because the screen has no org id.
  const resolveOrganizationId = useCallback(async (): Promise<string> => {
    if (contextOrganizationId) return contextOrganizationId;
    if (!invoiceId) return '';
    const { data } = await supabase
      .from('invoices')
      .select('organization_id')
      .eq('id', invoiceId)
      .maybeSingle();
    return data?.organization_id || '';
  }, [contextOrganizationId, invoiceId]);

  // On an existing invoice the payment is saved straight to the database, so the
  // status (and any discount) must be saved too — otherwise the saved payment and
  // the saved invoice disagree until the form itself is saved.
  const persistInvoiceFields = useCallback(async (fields: Record<string, unknown>) => {
    if (!invoiceId) return;
    const { error } = await supabase
      .from('invoices')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', invoiceId);
    if (error) {
      console.error('Error saving invoice after payment:', error);
      toast.error('The payment was saved, but the invoice status could not be updated. Save the invoice to finish.');
    }
  }, [invoiceId]);

  const savePayment = useCallback(async (allowOverpayment: boolean) => {
    const amount = parseFloat(paymentAmount);
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const amountDue = Math.max(total - totalPaid, 0);
    const change = allowOverpayment ? Math.max(amount - amountDue, 0) : 0;

    savingRef.current = true;
    setIsSavingPayment(true);

    try {
      const organizationId = await resolveOrganizationId();
      // Overpayment: the full amount is recorded as revenue, and the note keeps
      // the change that was handed back to the customer.
      const notes = change > 0
        ? `${paymentNotes ? paymentNotes + ' — ' : ''}Received ${formatCurrency(amount)}, change ${formatCurrency(change)}`
        : paymentNotes || undefined;

      if (invoiceId && organizationId) {
        // Existing invoice: save to the database straight away so the payment
        // cannot be lost if the invoice save is later refused.
        const newPayment = await addPayment({
          invoice_id: invoiceId,
          amount: amount,
          method: paymentMethod,
          date: new Date().toISOString(),
          notes,
          organization_id: organizationId
        });

        setPayments(prev => {
          if (prev.some(payment => payment.id === newPayment.id)) {
            return prev;
          }
          // Without overpayment confirmed, never append a payment that would
          // push the invoice past its total.
          if (!allowOverpayment) {
            const already = prev.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
            if (already + amount > total + 0.005) {
              return prev;
            }
          }
          return [...prev, newPayment];
        });
      } else {
        // No invoice yet (new invoice screen): held on screen, saved with the invoice.
        const tempPayment: Payment = {
          id: nanoid(),
          invoice_id: invoiceId || "",
          amount: amount,
          date: new Date().toISOString(),
          method: paymentMethod,
          notes: notes || null,
          organization_id: organizationId
        };

        setPayments(prev => {
          if (!allowOverpayment) {
            const already = prev.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
            if (already + amount > total + 0.005) {
              return prev;
            }
          }
          return [...prev, tempPayment];
        });
      }

      // Reset form
      setPaymentAmount("");
      setPaymentMethod("");
      setPaymentNotes("");

      // Update invoice status based on payments
      const newTotalPaid = totalPaid + amount;
      if (newTotalPaid >= total - 0.005) {
        setValue("status", "paid", { shouldDirty: true });
        await persistInvoiceFields({ status: 'paid' });
      } else if (newTotalPaid > 0) {
        setValue("status", "partial", { shouldDirty: true });
        await persistInvoiceFields({ status: 'partial' });
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error(error instanceof Error ? `Payment could not be saved: ${error.message}` : "Payment could not be saved.");
    } finally {
      savingRef.current = false;
      setIsSavingPayment(false);
    }
  }, [paymentAmount, paymentMethod, paymentNotes, payments, total, invoiceId, resolveOrganizationId, addPayment, setPayments, setValue, persistInvoiceFields, formatCurrency]);

  const handleAddPayment = useCallback(async () => {
    if (!paymentAmount || !paymentMethod) {
      toast.error("Enter an amount and choose a payment method.");
      return;
    }

    // A repeated click while the first payment is still saving must do nothing,
    // otherwise the same payment gets recorded twice.
    if (savingRef.current) {
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a payment amount greater than zero.");
      return;
    }

    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    if (total <= 0) {
      toast.error("Add invoice lines first — this invoice has no amount to pay against.");
      return;
    }

    if (totalPaid + amount > total + 0.005) {
      // More than due: tell the staff member the change first, and only record
      // the full amount as revenue once they confirm.
      setOverpayDialogOpen(true);
      return;
    }

    await savePayment(false);
  }, [paymentAmount, paymentMethod, payments, total, savePayment]);

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
      let newStatus: string | null = null;
      if (totalPaid <= 0.005) {
        newStatus = "open";
      } else if (totalPaid < total - 0.005) {
        newStatus = "partial";
      } else {
        newStatus = "paid";
      }
      setValue("status", newStatus);
      await persistInvoiceFields({ status: newStatus });
    } catch (error) {
      console.error("Error removing payment:", error);
      // Error already handled by the hook with toast
    }
  }, [invoiceId, removePayment, payments, setPayments, setValue, total, persistInvoiceFields]);

  // "Close with discount": turn the leftover balance into a fixed discount so
  // the invoice closes as Paid and the books still balance.
  const handleCloseWithDiscount = useCallback(async () => {
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const balance = total - totalPaid;
    if (balance <= 0.005) return;

    const taxRate = Number(watch("tax_rate")) || 0;
    const currentType = watch("discount_type") || 'none';
    const currentValue = Number(watch("discount_value")) || 0;

    // Percentage discounts are converted to their fixed amount first so the
    // extra discount can be added on top in currency.
    const subtotal = totalPaid > 0 || true ? undefined : undefined; // placeholder removed below
    void subtotal;

    // Tax is charged on the discounted amount, so the extra discount is the
    // balance worked back through the tax rate.
    const extraDiscount = balance / (1 + taxRate / 100);
    const existingFixed = currentType === 'percentage'
      ? currentValue / 100 * (Number(watch("subtotal")) || 0)
      : currentType === 'fixed' ? currentValue : 0;

    const newDiscountValue = Math.round((existingFixed + extraDiscount) * 100) / 100;
    setValue("discount_type", "fixed", { shouldDirty: true });
    setValue("discount_value", newDiscountValue, { shouldDirty: true });
    setValue("status", "paid", { shouldDirty: true });
    await persistInvoiceFields({ discount_type: 'fixed', discount_value: newDiscountValue, status: 'paid' });
    toast.success(`Discount of ${formatCurrency(balance)} applied — invoice closed as Paid.`);
  }, [payments, total, watch, setValue, persistInvoiceFields, formatCurrency]);

  // Calculate totals
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = total - totalPaid;
  const amountEntered = parseFloat(paymentAmount);
  const overpayChange = Number.isFinite(amountEntered) ? Math.max(amountEntered - remainingBalance, 0) : 0;

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
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
              <Button
                type="button"
                onClick={handleAddPayment}
                disabled={!paymentAmount || !paymentMethod || isSavingPayment}
              >
                {isSavingPayment ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  "Add Payment"
                )}
              </Button>
            </div>
          </div>
        )}

        {canEditPayments && !invoiceId && (
          <p className="text-sm text-muted-foreground">
            Payments listed here are saved together with the invoice.
          </p>
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
                        return formatOrgDate(payment.date);
                      } catch {
                        return String(payment.date);
                      }
                    })()}
                  </TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    {payment.method === "cash" ? "Cash" :
                     payment.method === "card" ? "Card" :
                     payment.method === "bank-transfer" || payment.method === "bank_transfer" ? "Bank Transfer" :
                     payment.method === "check" ? "Check" :
                     payment.method === "other" ? "Other" : payment.method}
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
            <span className={remainingBalance <= 0.005 ? "text-green-600" : "text-orange-600"}>
              {formatCurrency(Math.max(remainingBalance, 0))}
            </span>
          </div>
          {canEditPayments && remainingBalance > 0.005 && status !== 'paid' && (
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCloseDiscountDialogOpen(true)}
              >
                Close with discount ({formatCurrency(remainingBalance)})
              </Button>
            </div>
          )}
        </div>

        <AlertDialog open={overpayDialogOpen} onOpenChange={setOverpayDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>More than the amount due</AlertDialogTitle>
              <AlertDialogDescription>
                Received {formatCurrency(amountEntered)}. Amount due: {formatCurrency(Math.max(remainingBalance, 0))}.
                Change to give back: {formatCurrency(overpayChange)}.
                <br /><br />
                If you continue, the full {formatCurrency(amountEntered)} is recorded as payment and the extra counts as revenue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setOverpayDialogOpen(false);
                  await savePayment(true);
                }}
              >
                Record full amount
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={closeDiscountDialogOpen} onOpenChange={setCloseDiscountDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close with discount</AlertDialogTitle>
              <AlertDialogDescription>
                Give a discount of {formatCurrency(Math.max(remainingBalance, 0))} and mark this invoice as Paid?
                The invoice total, tax and reports will update to match.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setCloseDiscountDialogOpen(false);
                  await handleCloseWithDiscount();
                }}
              >
                Apply discount and close
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default PaymentsSection;
