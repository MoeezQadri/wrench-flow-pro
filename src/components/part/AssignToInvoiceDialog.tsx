import React, { useState, useEffect } from 'react';
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Part } from "@/types";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { X, FileText } from "lucide-react";

interface AssignToInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: Part | null;
  onAssignmentComplete: () => void;
}

const AssignToInvoiceDialog: React.FC<AssignToInvoiceDialogProps> = ({
  open,
  onOpenChange,
  part,
  onAssignmentComplete
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      setInvoiceNumber('');
      setQuantity(1);
    }
  }, [open]);

  const handleAssignToInvoice = async () => {
    if (!part || !invoiceNumber.trim()) {
      toast.error('Please enter an invoice number');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (quantity > part.quantity) {
      toast.error(`Cannot assign ${quantity} pieces. Only ${part.quantity} available in stock.`);
      return;
    }

    setIsAssigning(true);
    try {
      // Check if invoice exists
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, status, organization_id')
        .eq('id', invoiceNumber.trim())
        .single();

      if (invoiceError) {
        toast.error('Invoice not found. Please check the invoice number.');
        return;
      }

      if (invoice.status === 'paid' || invoice.status === 'completed') {
        toast.error('Cannot assign parts to paid or completed invoices');
        return;
      }

      // Check if part is already assigned to this invoice
      const { data: existingItem } = await supabase
        .from('invoice_items')
        .select('id')
        .eq('invoice_id', invoiceNumber.trim())
        .eq('part_id', part.id)
        .single();

      if (existingItem) {
        toast.error('Part is already assigned to this invoice');
        return;
      }

      // Create invoice item
      const { error: invoiceItemError } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoiceNumber.trim(),
          part_id: part.id,
          type: 'part',
          description: part.name,
          quantity: quantity,
          price: part.price,
          unit_of_measure: part.unit || 'piece',
          organization_id: invoice.organization_id,
          is_auto_added: true
        });

      if (invoiceItemError) {
        throw invoiceItemError;
      }

      // Update part inventory and invoice assignments
      const currentInvoiceIds = part.invoice_ids || [];
      const updatedInvoiceIds = currentInvoiceIds.includes(invoiceNumber.trim()) 
        ? currentInvoiceIds 
        : [...currentInvoiceIds, invoiceNumber.trim()];

      const { error: updateError } = await supabase
        .from('parts')
        .update({ 
          quantity: part.quantity - quantity,
          invoice_ids: updatedInvoiceIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', part.id);

      if (updateError) {
        throw updateError;
      }

      toast.success(`${quantity} pieces of "${part.name}" assigned to invoice #${invoiceNumber.trim().substring(0, 8)}`);
      onAssignmentComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning part to invoice:', error);
      toast.error('Failed to assign part to invoice');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = async (invoiceId: string) => {
    if (!part) return;

    setIsAssigning(true);
    try {
      // Get the invoice item to restore the quantity
      const { data: invoiceItem, error: itemError } = await supabase
        .from('invoice_items')
        .select('quantity')
        .eq('invoice_id', invoiceId)
        .eq('part_id', part.id)
        .single();

      if (itemError && itemError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw itemError;
      }

      const quantityToRestore = invoiceItem?.quantity || 0;

      // Remove the invoice item
      if (invoiceItem) {
        const { error: deleteItemError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoiceId)
          .eq('part_id', part.id);

        if (deleteItemError) {
          throw deleteItemError;
        }
      }

      // Update part inventory and invoice assignments
      const currentInvoiceIds = part.invoice_ids || [];
      const updatedInvoiceIds = currentInvoiceIds.filter(id => id !== invoiceId);

      const { error: updateError } = await supabase
        .from('parts')
        .update({ 
          quantity: part.quantity + quantityToRestore,
          invoice_ids: updatedInvoiceIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', part.id);

      if (updateError) {
        throw updateError;
      }

      toast.success(`Part removed from invoice #${invoiceId.substring(0, 8)}${quantityToRestore > 0 ? ` and ${quantityToRestore} pieces restored to inventory` : ''}`);
      onAssignmentComplete();
    } catch (error) {
      console.error('Error removing part assignment:', error);
      toast.error('Failed to remove part assignment');
    } finally {
      setIsAssigning(false);
    }
  };

  if (!part) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Manage Invoice Assignments
          </DialogTitle>
          <DialogDescription>
            Assign "{part.name}" to specific invoices. Parts assigned to invoices will appear automatically when creating/editing those invoices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignments */}
          {part.invoice_ids && part.invoice_ids.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Current Assignments:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {part.invoice_ids.map((invoiceId) => (
                  <Badge key={invoiceId} variant="secondary" className="flex items-center gap-1">
                    #{invoiceId.substring(0, 8)}
                    <button
                      onClick={() => handleRemoveAssignment(invoiceId)}
                      disabled={isAssigning}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add New Assignment */}
          <div className="space-y-3">
            <Label htmlFor="invoiceNumber">Assign to Invoice:</Label>
            <div className="flex gap-2">
              <Input
                id="invoiceNumber"
                placeholder="Enter invoice ID..."
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                disabled={isAssigning}
                className="flex-1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Assign:</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={part.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={isAssigning || part.quantity === 0}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  Available: <span className="font-medium">{part.quantity}</span> {part.unit || 'pieces'}
                </span>
              </div>
              {quantity > 0 && (
                <p className="text-xs text-muted-foreground">
                  After assignment: <span className="font-medium">{Math.max(0, part.quantity - quantity)}</span> {part.unit || 'pieces'} remaining
                </p>
              )}
            </div>

            <Button 
              onClick={handleAssignToInvoice}
              disabled={!invoiceNumber.trim() || quantity <= 0 || quantity > part.quantity || part.quantity === 0 || isAssigning}
              className="w-full"
            >
              {isAssigning ? 'Assigning...' : `Assign ${quantity} ${part.unit || 'pieces'}`}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Enter the full invoice ID and specify how many pieces to assign.
            </p>
          </div>

          {/* Part Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <strong>{part.name}</strong>
              {part.part_number && <span className="text-muted-foreground"> • Part #{part.part_number}</span>}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Stock: {part.quantity} • Price: ${part.price.toFixed(2)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignToInvoiceDialog;