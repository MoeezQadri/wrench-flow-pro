import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { LeaveType } from '@/types';
import { useDataContext } from '@/context/data/DataContext';

export interface LeaveFormData {
  mechanicId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  notes?: string;
}

interface LeaveFormProps {
  onSubmit: (data: LeaveFormData) => Promise<void>;
}

const LeaveForm: React.FC<LeaveFormProps> = ({ onSubmit }) => {
  const { mechanics } = useDataContext();
  const today = new Date().toISOString().slice(0, 10);

  const [mechanicId, setMechanicId] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mechanicId) {
      toast.error('Please select a mechanic');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please provide the leave start and end dates');
      return;
    }
    if (endDate < startDate) {
      toast.error('End date cannot be before the start date');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ mechanicId, leaveType, startDate, endDate, notes: notes || undefined });
      setMechanicId('');
      setLeaveType('annual');
      setStartDate(today);
      setEndDate(today);
      setNotes('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Mechanic *</Label>
        <Select value={mechanicId} onValueChange={setMechanicId}>
          <SelectTrigger>
            <SelectValue placeholder={mechanics.length === 0 ? 'No mechanics available' : 'Select a mechanic'} />
          </SelectTrigger>
          <SelectContent>
            {mechanics.map((mechanic) => (
              <SelectItem key={mechanic.id} value={mechanic.id}>
                {mechanic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Leave Type *</Label>
        <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="annual">Annual Leave</SelectItem>
            <SelectItem value="sick">Sick Leave</SelectItem>
            <SelectItem value="unpaid">Unpaid Leave</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="leaveStart">Start Date *</Label>
          <Input
            id="leaveStart"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="leaveEnd">End Date *</Label>
          <Input
            id="leaveEnd"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="leaveNotes">Notes (Optional)</Label>
        <Textarea
          id="leaveNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reason or additional details"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Submitting...' : 'Submit Leave Request'}
        </Button>
      </div>
    </form>
  );
};

export default LeaveForm;
