
import { useState } from "react";
import { DollarSign, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Payment } from "@/types";
import { format } from "date-fns";
import { toast } from "sonner";
import { useFormContext } from "react-hook-form";

interface PaymentsSectionProps {
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  total: number;
}

const PaymentsSection = ({ payments, setPayments, total }: PaymentsSectionProps) => {
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank-transfer">("cash");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);
  
  const form = useFormContext();
  
  // Calculate total paid
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate remaining balance
  const remainingBalance = total - totalPaid;

  // Add payment
  const handleAddPayment = () => {
    if (paymentAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    const newPayment: Payment = {
      id: Date.now().toString(), // Temporary ID
      invoiceId: "", // Will be set when invoice is created
      amount: paymentAmount,
      method: paymentMethod,
      date: format(new Date(), "yyyy-MM-dd"),
      notes: paymentNotes,
    };

    setPayments([...payments, newPayment]);
    
    // Reset payment form
    setPaymentAmount(0);
    setPaymentNotes("");
    setShowPaymentForm(false);

    // If total is fully paid, set status to paid, otherwise to partial
    if (total <= totalPaid + paymentAmount) {
      form.setValue("status", "paid");
    } else {
      form.setValue("status", "partial");
    }

    toast.success("Payment added successfully");
  };

  // Remove payment
  const handleRemovePayment = (paymentId: string) => {
    setPayments(payments.filter(payment => payment.id !== paymentId));
    
    // Update status based on remaining payments
    const remainingPayments = payments.filter(payment => payment.id !== paymentId);
    const paidAmount = remainingPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    if (paidAmount <= 0) {
      form.setValue("status", "completed");
    } else if (paidAmount < total) {
      form.setValue("status", "partial");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Payments</h3>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setShowPaymentForm(!showPaymentForm)}
          className="flex items-center"
        >
          {showPaymentForm ? "Cancel" : 
            <>
              <DollarSign className="mr-2 h-4 w-4" />
              Add Payment
            </>
          }
        </Button>
      </div>
      
      {showPaymentForm && (
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <FormLabel htmlFor="paymentAmount">Amount ($)</FormLabel>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min="0"
                max={remainingBalance > 0 ? remainingBalance : undefined}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <FormLabel htmlFor="paymentMethod">Method</FormLabel>
              <Select
                value={paymentMethod}
                onValueChange={(value: "cash" | "card" | "bank-transfer") => setPaymentMethod(value)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select method" />
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
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Payment notes"
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
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.date}</TableCell>
                <TableCell>
                  {payment.method === "cash" ? "Cash" : 
                   payment.method === "card" ? "Card" : "Bank Transfer"}
                </TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>{payment.notes}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePayment(payment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={2} className="text-right font-medium">
                Total Paid
              </TableCell>
              <TableCell className="font-medium">${totalPaid.toFixed(2)}</TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2} className="text-right font-medium">
                Remaining Balance
              </TableCell>
              <TableCell className={`font-medium ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${remainingBalance.toFixed(2)}
              </TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : (
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-muted-foreground">No payments added yet.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentsSection;
