
import React, { useState, useEffect } from 'react';
import { fetchAttendance } from '@/services/data-service';
import { Attendance, Mechanic } from '@/types';
import { toast } from 'sonner';
import { useDataContext } from '@/context/data/DataContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AttendanceDialog } from '@/components/attendance/AttendanceDialog';

const AttendancePage: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { mechanics } = useDataContext();

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

  const handleSaveAttendance = async (attendanceData: Omit<Attendance, 'id'>) => {
    try {
      // Add the new attendance record to the list
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Records</h1>
          <p className="text-muted-foreground">Track mechanic attendance and working hours</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Attendance
        </Button>
      </div>

      <div className="grid gap-4">
        {attendanceRecords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No attendance records found</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record First Attendance
            </Button>
          </div>
        ) : (
          attendanceRecords.map((record) => {
            const mechanic = mechanics.find(m => m.id === record.mechanic_id);
            return (
              <div key={record.id} className="bg-card p-4 rounded-lg shadow border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{mechanic?.name || 'Unknown Mechanic'}</h3>
                    <p className="text-sm text-muted-foreground">{record.date}</p>
                    <p className="text-sm">Check-in: {record.check_in}</p>
                    {record.check_out && (
                      <p className="text-sm">Check-out: {record.check_out}</p>
                    )}
                    {record.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{record.notes}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    record.status === 'approved' ? 'bg-green-100 text-green-800' :
                    record.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
              </div>
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
