
import React, { useState, useEffect, useMemo } from 'react';
import { fetchAttendance } from '@/services/data-service';
import { Attendance, Mechanic } from '@/types';
import { toast } from 'sonner';
import { useDataContext } from '@/context/data/DataContext';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { AttendanceDialog } from '@/components/attendance/AttendanceDialog';
import AttendanceListItem from '@/components/attendance/AttendanceListItem';
import AttendanceSummary from '@/components/attendance/AttendanceSummary';
import AttendanceFilters from '@/components/attendance/AttendanceFilters';
import { hasPermission } from '@/utils/permissions';

const AttendancePage: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    date: '',
    mechanicId: 'all'
  });
  
  const { mechanics } = useDataContext();
  const { currentUser } = useAuthContext();

  // Check permissions
  const canApprove = currentUser?.role === 'owner' || 
                    currentUser?.role === 'manager' || 
                    currentUser?.role === 'foreman';
  const userCanManageAttendance = hasPermission(currentUser, 'attendance', 'manage') || hasPermission(currentUser, 'attendance', 'create');
  const userCanViewAttendance = hasPermission(currentUser, 'attendance', 'view');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const attendanceData = await fetchAttendance();
        setAttendanceRecords(attendanceData);
      } catch (error) {
        console.error('Error loading attendance data:', error);
        toast.error('Failed to load attendance records.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter attendance records based on current filters
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const statusMatch = filters.status === 'all' || record.status === filters.status;
      const dateMatch = !filters.date || record.date === filters.date;
      const mechanicMatch = filters.mechanicId === 'all' || record.mechanic_id === filters.mechanicId;
      
      return statusMatch && dateMatch && mechanicMatch;
    });
  }, [attendanceRecords, filters]);

  const handleSaveAttendance = async (attendanceData: Omit<Attendance, 'id'>) => {
    try {
      const newRecord: Attendance = {
        ...attendanceData,
        id: `temp-${Date.now()}`
      };
      setAttendanceRecords(prev => [newRecord, ...prev]);
      setIsDialogOpen(false);
      toast.success('Attendance recorded successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance record.');
    }
  };

  const handleApproveAttendance = async (id: string) => {
    try {
      // In a real app, this would make an API call to update the record
      setAttendanceRecords(prev => prev.map(record => 
        record.id === id 
          ? { ...record, status: 'approved' as const, approved_by: currentUser?.id }
          : record
      ));
      toast.success('Attendance record approved successfully!');
    } catch (error) {
      console.error('Error approving attendance:', error);
      toast.error('Failed to approve attendance record.');
    }
  };

  const handleRejectAttendance = async (id: string) => {
    try {
      // In a real app, this would make an API call to update the record
      setAttendanceRecords(prev => prev.map(record => 
        record.id === id 
          ? { ...record, status: 'rejected' as const, approved_by: currentUser?.id }
          : record
      ));
      toast.success('Attendance record rejected.');
    } catch (error) {
      console.error('Error rejecting attendance:', error);
      toast.error('Failed to reject attendance record.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  const pendingCount = attendanceRecords.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Records</h1>
          <p className="text-muted-foreground">Track mechanic attendance and working hours</p>
          {canApprove && pendingCount > 0 && (
            <div className="flex items-center gap-2 mt-2 text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{pendingCount} records pending approval</span>
            </div>
          )}
        </div>
        {userCanManageAttendance && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Attendance
          </Button>
        )}
      </div>

      <AttendanceSummary records={filteredRecords} />

      <AttendanceFilters
        onStatusFilter={(status) => setFilters(prev => ({ ...prev, status }))}
        onDateFilter={(date) => setFilters(prev => ({ ...prev, date }))}
        onMechanicFilter={(mechanicId) => setFilters(prev => ({ ...prev, mechanicId }))}
        mechanics={mechanics.map(m => ({ id: m.id, name: m.name }))}
        currentFilters={filters}
      />

      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {attendanceRecords.length === 0 
                ? "No attendance records found" 
                : "No records match the current filters"
              }
            </p>
            {attendanceRecords.length === 0 && userCanManageAttendance && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record First Attendance
              </Button>
            )}
          </div>
        ) : (
          filteredRecords
            .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
            .map((record) => {
              const mechanic = mechanics.find(m => m.id === record.mechanic_id);
              return (
                <AttendanceListItem
                  key={record.id}
                  record={record}
                  mechanic={mechanic}
                  onApprove={handleApproveAttendance}
                  onReject={handleRejectAttendance}
                />
              );
            })
        )}
      </div>

      <AttendanceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveAttendance}
      />
    </div>
  );
};

export default AttendancePage;
