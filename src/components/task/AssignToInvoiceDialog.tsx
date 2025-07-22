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
import { Task } from "@/types";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { X, FileText, Wrench } from "lucide-react";

interface AssignToInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onAssignmentComplete: () => void;
}

const AssignToInvoiceDialog: React.FC<AssignToInvoiceDialogProps> = ({
  open,
  onOpenChange,
  task,
  onAssignmentComplete
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      setInvoiceNumber('');
    }
  }, [open]);

  const handleAssignToInvoice = async () => {
    if (!task || !invoiceNumber.trim()) {
      toast.error('Please enter an invoice number');
      return;
    }

    if (task.status !== 'completed') {
      toast.error('Only completed tasks can be assigned to invoices');
      return;
    }

    setIsAssigning(true);
    try {
      // Check if invoice exists
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, status')
        .eq('id', invoiceNumber.trim())
        .single();

      if (invoiceError) {
        toast.error('Invoice not found. Please check the invoice number.');
        return;
      }

      if (invoice.status === 'paid' || invoice.status === 'completed') {
        toast.error('Cannot assign tasks to paid or completed invoices');
        return;
      }

      // Update task's invoice assignment
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          invoice_id: invoiceNumber.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (updateError) {
        throw updateError;
      }

      toast.success(`Task "${task.title}" assigned to invoice #${invoiceNumber.trim().substring(0, 8)}`);
      onAssignmentComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning task to invoice:', error);
      toast.error('Failed to assign task to invoice');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!task) return;

    setIsAssigning(true);
    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          invoice_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (updateError) {
        throw updateError;
      }

      toast.success(`Task removed from invoice #${task.invoiceId?.substring(0, 8)}`);
      onAssignmentComplete();
    } catch (error) {
      console.error('Error removing task assignment:', error);
      toast.error('Failed to remove task assignment');
    } finally {
      setIsAssigning(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Manage Invoice Assignment
          </DialogTitle>
          <DialogDescription>
            Assign "{task.title}" to a specific invoice. Tasks assigned to invoices will appear automatically when creating/editing those invoices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignment */}
          {task.invoiceId && (
            <div>
              <Label className="text-sm font-medium">Current Assignment:</Label>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  #{task.invoiceId.substring(0, 8)}
                  <button
                    onClick={handleRemoveAssignment}
                    disabled={isAssigning}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            </div>
          )}

          {/* Add New Assignment or Change Assignment */}
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">
              {task.invoiceId ? 'Change Assignment:' : 'Assign to Invoice:'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="invoiceNumber"
                placeholder="Enter invoice ID..."
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                disabled={isAssigning}
              />
              <Button 
                onClick={handleAssignToInvoice}
                disabled={!invoiceNumber.trim() || isAssigning}
              >
                {isAssigning ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the full invoice ID to assign this task to a specific invoice.
            </p>
            {task.status !== 'completed' && (
              <p className="text-xs text-amber-600">
                ⚠️ Only completed tasks can be assigned to invoices.
              </p>
            )}
          </div>

          {/* Task Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <strong>{task.title}</strong>
              <span className="text-muted-foreground"> • Status: {task.status}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Hours: {task.hoursEstimated || 'N/A'} estimated, {task.hoursSpent || 0} spent • Price: ${(task.price || 0).toFixed(2)}
            </div>
            {task.description && (
              <div className="text-xs text-muted-foreground mt-1">
                {task.description.substring(0, 100)}{task.description.length > 100 ? '...' : ''}
              </div>
            )}
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