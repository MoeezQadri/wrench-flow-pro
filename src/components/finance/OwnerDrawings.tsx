import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useAuthContext } from '@/context/AuthContext';
import { formatOrgDate, orgToday, toOrgDateInputValue, toOrgDayStart } from '@/utils/datetime';
import { OwnerDrawing, totalDrawings } from '@/utils/owner-drawings';

const METHODS = [['cash', 'Cash'], ['bank-transfer', 'Bank transfer'], ['card', 'Card'], ['check', 'Check'], ['other', 'Other']];
const empty = () => ({ date: orgToday(), amount: '', owner_name: '', payment_method: 'cash', notes: '' });

const OwnerDrawings = () => {
  const { formatCurrency } = useOrganizationSettings();
  const { currentUser } = useAuthContext();
  const isAdmin = ['owner', 'admin'].includes(currentUser?.role ?? '');
  const [rows, setRows] = useState<OwnerDrawing[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OwnerDrawing | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await (supabase as any).from('owner_drawings').select('*').order('date', { ascending: false });
    if (!error) setRows(data || []);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);
  if (!isAdmin) return null;

  const startAdd = () => { setEditing(null); setForm(empty()); setOpen(true); };
  const startEdit = (r: OwnerDrawing) => {
    setEditing(r);
    setForm({ date: toOrgDateInputValue(r.date) || orgToday(), amount: String(r.amount), owner_name: r.owner_name, payment_method: r.payment_method || 'cash', notes: r.notes || '' });
    setOpen(true);
  };

  const save = async () => {
    const amount = parseFloat(form.amount);
    if (!form.owner_name.trim() || !(amount > 0)) { toast.error('Enter the owner name and an amount above 0.'); return; }
    setSaving(true);
    const payload = { date: toOrgDayStart(form.date), amount, owner_name: form.owner_name.trim(), payment_method: form.payment_method, notes: form.notes || null };
    const q = (supabase as any).from('owner_drawings');
    const { error } = editing ? await q.update(payload).eq('id', editing.id) : await q.insert(payload);
    setSaving(false);
    if (error) { toast.error('Could not save the owner drawing.'); return; }
    toast.success(editing ? 'Owner drawing updated.' : 'Owner drawing added.');
    setOpen(false);
    load();
  };

  const remove = async (r: OwnerDrawing) => {
    if (!confirm(`Delete the ${formatCurrency(r.amount)} drawing by ${r.owner_name}?`)) return;
    const { error } = await (supabase as any).from('owner_drawings').delete().eq('id', r.id);
    if (error) { toast.error('Could not delete it.'); return; }
    toast.success('Owner drawing deleted.');
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Owner drawings</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Money the owner takes out. Not an expense — profit is unchanged. Total: {formatCurrency(totalDrawings(rows))}</p>
        </div>
        <Button size="sm" onClick={startAdd}><Plus className="h-4 w-4 mr-1" />Add drawing</Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && <p className="text-center text-muted-foreground py-4">No owner drawings yet</p>}
        {rows.map(r => (
          <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">{r.owner_name}</p>
              <p className="text-sm text-muted-foreground">{formatOrgDate(r.date)}{r.payment_method ? ` · ${METHODS.find(m => m[0] === r.payment_method)?.[1] ?? r.payment_method}` : ''}{r.notes ? ` · ${r.notes}` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{formatCurrency(r.amount)}</span>
              <Button variant="ghost" size="icon" aria-label="Edit drawing" onClick={() => startEdit(r)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" aria-label="Delete drawing" onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit owner drawing' : 'Add owner drawing'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>Amount</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
            <div><Label>Owner name</Label><Input value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} /></div>
            <div><Label>Paid by</Label>
              <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{METHODS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Note</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OwnerDrawings;
