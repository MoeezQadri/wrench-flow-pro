
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mechanics } from "@/services/data-service";
import { Calendar, ChevronLeft, ChevronRight, Download, Filter } from "lucide-react";
import { Link } from "react-router-dom";

type AttendanceRecord = {
  id: string;
  mechanicId: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: "present" | "late" | "absent" | "half-day";
  hoursWorked: number;
};

// Sample attendance data
const attendanceData: AttendanceRecord[] = [
  { id: "1", mechanicId: "1", date: "2023-05-15", clockIn: "08:00", clockOut: "17:00", status: "present", hoursWorked: 8 },
  { id: "2", mechanicId: "2", date: "2023-05-15", clockIn: "08:30", clockOut: "17:00", status: "late", hoursWorked: 7.5 },
  { id: "3", mechanicId: "3", date: "2023-05-15", clockIn: "08:00", clockOut: "13:00", status: "half-day", hoursWorked: 4 },
  { id: "4", mechanicId: "1", date: "2023-05-16", clockIn: "08:00", clockOut: "17:00", status: "present", hoursWorked: 8 },
  { id: "5", mechanicId: "2", date: "2023-05-16", clockIn: "", clockOut: "", status: "absent", hoursWorked: 0 },
  { id: "6", mechanicId: "3", date: "2023-05-16", clockIn: "08:00", clockOut: "17:00", status: "present", hoursWorked: 8 },
];

const AttendanceReport = () => {
  const [selectedDate, setSelectedDate] = useState("2023-05-15");
  
  // Filter attendance for the selected date
  const filteredAttendance = attendanceData.filter(record => record.date === selectedDate);
  
  // Calculate statistics
  const totalPresent = filteredAttendance.filter(a => a.status === "present").length;
  const totalLate = filteredAttendance.filter(a => a.status === "late").length;
  const totalAbsent = filteredAttendance.filter(a => a.status === "absent").length;
  const totalHalfDay = filteredAttendance.filter(a => a.status === "half-day").length;
  const averageHours = filteredAttendance.reduce((sum, record) => sum + record.hoursWorked, 0) / 
                       (filteredAttendance.length || 1);

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/reports">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Reports
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Report</h1>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center border rounded-md px-3 py-1">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{selectedDate}</span>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPresent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLate}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAbsent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Half Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHalfDay}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageHours.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Daily Attendance</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mechanic</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.map((record) => {
                const mechanic = mechanics.find(m => m.id === record.mechanicId);
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{mechanic?.name || "Unknown"}</TableCell>
                    <TableCell>{record.clockIn || "N/A"}</TableCell>
                    <TableCell>{record.clockOut || "N/A"}</TableCell>
                    <TableCell>{record.hoursWorked}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${record.status === 'present' ? 'bg-green-100 text-green-800' : 
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 
                          record.status === 'absent' ? 'bg-red-100 text-red-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceReport;
