
import React, { useState, useMemo } from 'react';
import { Attendance, Mechanic } from '@/types';
import { useDataContext } from '@/context/data/DataContext';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { CheckInDialog } from '@/components/attendance/CheckInDialog';
import { CheckOutDialog } from '@/components/attendance/CheckOutDialog';
import AttendanceListItem from '@/components/attendance/AttendanceListItem';
import AttendanceSummary from '@/components/attendance/AttendanceSummary';
import AttendanceFilters from '@/components/attendance/AttendanceFilters';
import { hasPermission } from '@/utils/permissions';
import PageWrapper from '@/components/PageWrapper';

const AttendancePage: React.FC = () => {
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [isCheckOutDialogOpen, setIsCheckOutDialogOpen] = useState(false);
  const [checkOutAttendance, setCheckOutAttendance] = useState<Attendance | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    date: '',
    mechanicId: 'all'
  });
  
  const { 
    mechanics,
    attendanceRecords,
    attendanceLoading: loading,
    addAttendance,
    updateAttendance
  } = useDataContext();
  const { currentUser } = useAuthContext();

  // Check permissions
  const canApprove = currentUser?.role === 'owner' || 
                    currentUser?.role === 'manager' || 
                    currentUser?.role === 'foreman';
  const userCanManageAttendance = hasPermission(currentUser, 'attendance', 'manage') || hasPermission(currentUser, 'attendance', 'create');
  const userCanViewAttendance = hasPermission(currentUser, 'attendance', 'view');


  // Filter attendance records based on current filters
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const statusMatch = filters.status === 'all' || record.status === filters.status;
      const dateMatch = !filters.date || record.date === filters.date;
      const mechanicMatch = filters.mechanicId === 'all' || record.mechanic_id === filters.mechanicId;
      
      return statusMatch && dateMatch && mechanicMatch;
    });
  }, [attendanceRecords, filters]);

  const handleCheckIn = async (attendanceData: Omit<Attendance, 'id'>) => {
    console.log("Attendance page handleCheckIn called with:", attendanceData);
    try {
      console.log("Calling addAttendance...");
      await addAttendance(attendanceData);
      console.log("addAttendance completed successfully");
      // Dialog will be closed by CheckInDialog component on success
    } catch (error) {
      console.error('Error saving check-in in page:', error);
      // Error is already handled in the hook and form, just log it here
      throw error; // Re-throw so dialog knows not to close
    }
  };

  const handleCheckOut = async (attendanceId: string, checkOutData: { check_out: string; notes?: string }) => {
    console.log("Attendance page handleCheckOut called with:", attendanceId, checkOutData);
    try {
      console.log("Calling updateAttendance...");
      await updateAttendance(attendanceId, checkOutData);
      console.log("updateAttendance completed successfully");
      // Dialog will be closed by CheckOutDialog component on success
    } catch (error) {
      console.error('Error saving check-out in page:', error);
      // Error is already handled in the hook, just log it here
      throw error; // Re-throw so dialog knows not to close
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

  const subtitle = `Track mechanic attendance and working hours${canApprove && pendingCount > 0 ? ` • ${pendingCount} records pending approval` : ''}`;

  const headerActions = userCanManageAttendance ? (
    <Button onClick={() => setIsCheckInDialogOpen(true)}>
      <Plus className="h-4 w-4 mr-2" />
      Check In
    </Button>
  ) : undefined;

  return (
    <PageWrapper
      title="Attendance Records"
      subtitle={subtitle}
      headerActions={headerActions}
      loadData={async () => {
        // Data is loaded via DataContext, no explicit loading needed  
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
