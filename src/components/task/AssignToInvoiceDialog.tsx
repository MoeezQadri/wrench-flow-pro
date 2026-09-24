import React, { useState, useEffect, useMemo } from 'react';
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
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";

const OPEN_STATUSES = ['open', 'in-progress', 'partial', 'completed'];

interface EligibleInvoice {
  id: string;
  status: string;
  date: string | null;
  customer: string;
  vehicle: string;
}

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
  const { formatCurrency } = useOrganizationSettings();
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState<EligibleInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    const load = async () => {
      setLoadingInvoices(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('id, status, date, customers(name), vehicles(make, model, license_plate)')
        .in('status', OPEN_STATUSES)
        .order('date', { ascending: false })
        .limit(200);
      if (error) {
        console.error('Error loading invoices:', error);
        toast.error('Could not load invoices');
      }
      setInvoices(((data as any[]) || []).map(row => ({
        id: row.id,
        status: row.status,
        date: row.date,
        customer: row.customers?.name || 'Unknown customer',
        vehicle: row.vehicles
          ? `${row.vehicles.make || ''} ${row.vehicles.model || ''} ${row.vehicles.license_plate ? `(${row.vehicles.license_plate})` : ''}`.trim()
          : '',
      })));
      setLoadingInvoices(false);
    };
    load();
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(inv =>
      inv.id.toLowerCase().includes(q) ||
      inv.customer.toLowerCase().includes(q) ||
      inv.vehicle.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  // Removes this job's line from an invoice (only when that invoice can still be changed)
  const removeLine = async (invoiceId: string) => {
    const { data: inv } = await supabase.from('invoices').select('status').eq('id', invoiceId).maybeSingle();
    if (inv && !OPEN_STATUSES.includes(inv.status)) {
      throw new Error(`Invoice #${invoiceId.substring(0, 8)} is ${inv.status}, so its lines can't be changed.`);
    }
    const { error } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId)
      .eq('task_id', task!.id);
    if (error) throw error;
  };

  const handleAssign = async (target: EligibleInvoice) => {
    if (!task) return;
    if (task.status !== 'completed') {
      toast.error('Only completed jobs can be added to an invoice');
      return;
    }
    if (task.invoiceId === target.id) {
      toast.info('This job is already on that invoice');
      return;
    }

    setIsAssigning(true);
    try {
      // A job can only be billed once
      const { data: billed } = await supabase
        .from('invoice_items')
        .select('invoice_id')
        .eq('task_id', task.id);
      const otherBilling = (billed || []).find((r: any) => r.invoice_id !== task.invoiceId);
      if (otherBilling) {
        toast.error(`This job is already billed on invoice #${String(otherBilling.invoice_id).substring(0, 8)}.`);
        return;
      }

      // Moving from another invoice: take the line off that one first
      if (task.invoiceId) {
        await removeLine(task.invoiceId);
      }

      const { error: itemError } = await supabase.from('invoice_items').insert({
        invoice_id: target.id,
        type: 'labor',
        description: task.title,
        quantity: 1,
        price: Number(task.price || 0),
        cost: 0,
        task_id: task.id,
        is_auto_added: false,
      } as any);
      if (itemError) throw itemError;

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ invoice_id: target.id, updated_at: new Date().toISOString() })
        .eq('id', task.id);
      if (updateError) throw updateError;

      await supabase.from('invoices').update({ updated_at: new Date().toISOString() }).eq('id', target.id);

      toast.success(`"${task.title}" added to invoice #${target.id.substring(0, 8)} for ${target.customer}`);
      onAssignmentComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning task to invoice:', error);
      toast.error(error?.message ? `Couldn't add the job: ${error.message}` : "Couldn't add the job to the invoice");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!task?.invoiceId) return;
    setIsAssigning(true);
    try {
      await removeLine(task.invoiceId);
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ invoice_id: null, updated_at: new Date().toISOString() })
        .eq('id', task.id);
      if (updateError) throw updateError;
      await supabase.from('invoices').update({ updated_at: new Date().toISOString() }).eq('id', task.invoiceId);

      toast.success(`Job removed from invoice #${task.invoiceId.substring(0, 8)}`);
      onAssignmentComplete();
    } catch (error: any) {
      console.error('Error removing task assignment:', error);
      toast.error(error?.message || "Couldn't remove the job from the invoice");
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
            Pick an invoice for "{task.title}". The job is added as a labor line and the invoice total updates.
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

          {/* Pick an invoice */}
          <div className="space-y-2">
            <Label htmlFor="invoiceSearch">
              {task.invoiceId ? 'Move to another invoice:' : 'Add to invoice:'}
            </Label>
            <Input
              id="invoiceSearch"
              placeholder="Search by customer, vehicle or invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isAssigning}
            />
            <div className="max-h-64 overflow-y-auto rounded-md border divide-y">
              {loadingInvoices ? (
                <p className="p-3 text-sm text-muted-foreground">Loading invoices...</p>
              ) : filtered.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No invoices found.</p>
              ) : (
                filtered.map(inv => (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => handleAssign(inv)}
                    disabled={isAssigning || task.status !== 'completed' || inv.id === task.invoiceId}
                    className="w-full text-left p-3 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">#{inv.id.substring(0, 8)} · {inv.customer}</span>
                      <Badge variant="outline" className="capitalize">{inv.status}</Badge>
                    </div>
                    {inv.vehicle && <div className="text-xs text-muted-foreground mt-1">{inv.vehicle}</div>}
                  </button>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Only Open, In progress, Partial and Completed invoices are listed. Paid, estimate and declined invoices can't take new work.
            </p>
            {task.status !== 'completed' && (
              <p className="text-xs text-destructive">
                Only completed jobs can be added to an invoice.
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
              Hours: {task.hoursEstimated || 'N/A'} estimated, {task.hoursSpent || 0} spent • Price: {formatCurrency(task.price || 0)}
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