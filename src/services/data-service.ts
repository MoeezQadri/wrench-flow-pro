
// Function to calculate invoice total
export const calculateInvoiceTotal = (invoice: Invoice) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * (invoice.taxRate || 0);
  const total = subtotal + tax;
  
  // Calculate paid amount from payments
  const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Calculate balance due
  const balanceDue = total - paidAmount;
  
  return { subtotal, tax, total, paidAmount, balanceDue };
};
