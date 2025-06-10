
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, Filter, Search } from 'lucide-react';

interface AttendanceFiltersProps {
  onStatusFilter: (status: string) => void;
  onDateFilter: (date: string) => void;
  onMechanicFilter: (mechanicId: string) => void;
  mechanics: Array<{ id: string; name: string }>;
  currentFilters: {
    status: string;
    date: string;
    mechanicId: string;
  };
}

const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
  onStatusFilter,
  onDateFilter,
  onMechanicFilter,
  mechanics,
  currentFilters
}) => {
  const clearFilters = () => {
    onStatusFilter('all');
    onDateFilter('');
    onMechanicFilter('all');
  };

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-muted/20 rounded-lg mb-6">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters:</span>
      </div>
      
      <Select value={currentFilters.status} onValueChange={onStatusFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="present">Present</SelectItem>
          <SelectItem value="late">Late</SelectItem>
          <SelectItem value="absent">Absent</SelectItem>
          <SelectItem value="half-day">Half Day</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={currentFilters.mechanicId} onValueChange={onMechanicFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select Mechanic" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Mechanics</SelectItem>
          {mechanics.map((mechanic) => (
            <SelectItem key={mechanic.id} value={mechanic.id}>
              {mechanic.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          value={currentFilters.date}
          onChange={(e) => onDateFilter(e.target.value)}
          className="w-40"
        />
      </div>
      
      <Button variant="outline" size="sm" onClick={clearFilters}>
        Clear Filters
      </Button>
    </div>
  );
};

export default AttendanceFilters;
