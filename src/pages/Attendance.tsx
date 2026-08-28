
import React, { useState, useMemo } from 'react';
import { Attendance } from '@/types';
import { useDataContext } from '@/context/data/DataContext';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, CalendarPlus } from 'lucide-react';
import { CheckInDialog } from '@/components/attendance/CheckInDialog';
import { CheckOutDialog } from '@/components/attendance/CheckOutDialog';
import LeaveDialog from '@/components/attendance/LeaveDialog';
import { LeaveFormData } from '@/components/attendance/LeaveForm';
import AttendanceListItem from '@/components/attendance/AttendanceListItem';
import AttendanceSummary from '@/components/attendance/AttendanceSummary';
import AttendanceFilters from '@/components/attendance/AttendanceFilters';
import { hasPermission } from '@/utils/permissions';
import PageWrapper from '@/components/PageWrapper';
import { toast } from 'sonner';

const AttendancePage: React.FC = () => {
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [isCheckOutDialogOpen, setIsCheckOutDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [checkOutAttendance, setCheckOutAttendance] = useState<Attendance | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    date: '',
    mechanicId: 'all'
  });

  const {
    mechanics,
    attendanceRecords,
    addAttendance,
    updateAttendance,
    loadAttendance,
    loadMechanics
  } = useDataContext();
  const { currentUser } = useAuthContext();

  // Check permissions
  const canApprove = currentUser?.role === 'owner' ||
                    currentUser?.role === 'manager' ||
                    currentUser?.role === 'foreman';
  const userCanManageAttendance = hasPermission(currentUser, 'attendance', 'manage') || hasPermission(currentUser, 'attendance', 'create');

  // Filter attendance records based on current filters
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const isLeave = record.record_type === 'leave';
      const statusMatch =
        filters.status === 'all' ||
        (filters.status === 'leave' ? isLeave : !isLeave && record.status === filters.status);
      const dateMatch = !filters.date || record.date === filters.date;
      const mechanicMatch = filters.mechanicId === 'all' || record.mechanic_id === filters.mechanicId;

      return statusMatch && dateMatch && mechanicMatch;
    });
  }, [attendanceRecords, filters]);

  const handleCheckIn = async (attendanceData: Omit<Attendance, 'id'>) => {
    try {
      await addAttendance({ ...attendanceData, record_type: 'attendance' });
    } catch (error) {
      console.error('Error saving check-in in page:', error);
      throw error; // Re-throw so dialog knows not to close
    }
  };

  const handleAddLeave = async (data: LeaveFormData) => {
    try {
      await addAttendance({
        mechanic_id: data.mechanicId,
        date: data.startDate,
        leave_end_date: data.endDate,
        record_type: 'leave',
        leave_type: data.leaveType,
        status: 'pending',
        notes: data.notes,
        created_at: new Date().toISOString()
      } as Omit<Attendance, 'id'>);
      toast.success('Leave request submitted for approval');
    } catch (error) {
      console.error('Error saving leave:', error);
      throw error;
    }
  };

  const handleCheckOut = async (attendanceId: string, checkOutData: { check_out: string; notes?: string }) => {
    try {
      await updateAttendance(attendanceId, checkOutData);
    } catch (error) {
      console.error('Error saving check-out in page:', error);
      throw error;
    }
  };

  const handleOpenCheckOut = (record: Attendance) => {
    setCheckOutAttendance(record);
    setIsCheckOutDialogOpen(true);
  };

  const handleApproveAttendance = async (id: string) => {
    try {
      await updateAttendance(id, {
        status: 'approved' as const,
        approved_by: currentUser?.id
      });
    } catch (error) {
      console.error('Error approving attendance:', error);
    }
  };

  const handleRejectAttendance = async (id: string) => {
    try {
      await updateAttendance(id, {
        status: 'rejected' as const,
        approved_by: currentUser?.id
      });
    } catch (error) {
      console.error('Error rejecting attendance:', error);
    }
  };

  const pendingCount = attendanceRecords.filter(r => r.status === 'pending').length;

  const subtitle = `Track mechanic attendance, leave and working hours${canApprove && pendingCount > 0 ? ` • ${pendingCount} records pending approval` : ''}`;

  const headerActions = userCanManageAttendance ? (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setIsLeaveDialogOpen(true)}>
        <CalendarPlus className="h-4 w-4 mr-2" />
        Add Leave
      </Button>
      <Button onClick={() => setIsCheckInDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Check In
      </Button>
    </div>
  ) : undefined;

  return (
    <PageWrapper
      title="Attendance Records"
      subtitle={subtitle}
      headerActions={headerActions}
      loadData={async () => {
        // Mechanics are needed to label each record, so load them together
        await Promise.all([loadAttendance(), loadMechanics()]);
      }}
      loadingMessage="Loading attendance records..."
      className="p-6"
    >
      <div className="space-y-6">

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
              <Button onClick={() => setIsCheckInDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Check In First Attendance
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
                  mechanicsLoaded={mechanics.length > 0}
                  onApprove={handleApproveAttendance}
                  onReject={handleRejectAttendance}
                  onCheckOut={handleOpenCheckOut}
                />
              );
            })
        )}
      </div>

      <CheckInDialog
        open={isCheckInDialogOpen}
        onOpenChange={setIsCheckInDialogOpen}
        onSave={handleCheckIn}
      />

      <LeaveDialog
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
        onSave={handleAddLeave}
      />

      {checkOutAttendance && (
        <CheckOutDialog
          open={isCheckOutDialogOpen}
          onOpenChange={setIsCheckOutDialogOpen}
          attendance={checkOutAttendance}
          onSave={handleCheckOut}
        />
      )}
      </div>
    </PageWrapper>
  );
};

export default AttendancePage;
