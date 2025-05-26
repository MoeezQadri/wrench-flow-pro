import React, { useState, useEffect } from 'react';
import { fetchAttendance, getMechanics } from '@/services/data-service';
import { Attendance, Mechanic } from '@/types';
import { toast } from 'sonner';

const AttendancePage: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const attendanceData = await fetchAttendance();
        setAttendanceRecords(attendanceData);

        const mechanicsData = await getMechanics();
        setMechanics(mechanicsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load attendance records and mechanics.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading attendance records...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Attendance Records</h1>
      <div className="grid gap-4">
      {attendanceRecords.map((record) => {
        const mechanic = mechanics.find(m => m.id === record.mechanic_id);
        return (
          <div key={record.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{mechanic?.name || 'Unknown Mechanic'}</h3>
                <p className="text-sm text-gray-600">{record.date}</p>
                <p className="text-sm">Check-in: {record.check_in}</p>
                {record.check_out && (
                  <p className="text-sm">Check-out: {record.check_out}</p>
                )}
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                record.status === 'approved' ? 'bg-green-100 text-green-800' :
                record.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {record.status}
              </span>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default AttendancePage;
