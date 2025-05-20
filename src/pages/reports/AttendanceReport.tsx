
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAttendance, getMechanics } from "@/services/data-service";
import { ChevronLeft, Download, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import DateRangeDropdown from "@/components/DateRangeDropdown";
import { Attendance } from "@/types";
import { isWithinInterval, parseISO, format } from "date-fns";

const AttendanceReport = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load attendance data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const attendance = await getAttendance();
        const mechanicsData = await getMechanics();
        
        setAttendanceData(attendance);
        setMechanics(mechanicsData);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter attendance for the selected date range
  const filteredAttendance = attendanceData.filter(record => {
    try {
      const recordDate = parseISO(record.date);
      return isWithinInterval(recordDate, { start: startDate, end: endDate });
    } catch (e) {
      // Handle parsing errors (invalid dates)
      return false;
    }
  });
  
  // Calculate statistics
  const totalPresent = filteredAttendance.filter(a => a.status === "approved" && a.checkIn && a.checkOut).length;
  const totalLate = filteredAttendance.filter(a => a.status === "approved" && a.notes?.toLowerCase().includes("late")).length;
  const totalAbsent = filteredAttendance.filter(a => a.status === "rejected" || (!a.checkIn && !a.checkOut)).length;
  const totalHalfDay = filteredAttendance.filter(a => 
    a.status === "approved" && a.notes?.toLowerCase().includes("half-day")).length;
  
  // Calculate hours worked
  const calculateHoursWorked = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    
    const [inHours, inMinutes] = checkIn.split(':').map(Number);
    const [outHours, outMinutes] = checkOut.split(':').map(Number);
    
    const inTime = inHours * 60 + inMinutes;
    const outTime = outHours * 60 + outMinutes;
    
    return Math.max(0, (outTime - inTime) / 60);
  };
  
  const totalHours = filteredAttendance
    .filter(a => a.checkIn && a.checkOut)
    .reduce((sum, record) => sum + calculateHoursWorked(record.checkIn, record.checkOut || ""), 0);
    
  const averageHours = filteredAttendance.length > 0 
    ? totalHours / filteredAttendance.length 
    : 0;
  
  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading attendance data...</div>;
  }

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
        <div className="mt-4 sm:mt-0">
          <DateRangeDropdown 
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleDateRangeChange}
          />
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
                <TableHead>Date</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No attendance records found for the selected date range
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendance.map((record) => {
                  const mechanic = mechanics.find(m => m.id === record.mechanicId);
                  const hoursWorked = calculateHoursWorked(record.checkIn, record.checkOut || "");
                  
                  // Derive status display from record
                  let statusDisplay = "Present";
                  let statusClass = "bg-green-100 text-green-800";
                  
                  if (record.status === "rejected" || (!record.checkIn && !record.checkOut)) {
                    statusDisplay = "Absent";
                    statusClass = "bg-red-100 text-red-800";
                  } else if (record.notes?.toLowerCase().includes("late")) {
                    statusDisplay = "Late";
                    statusClass = "bg-yellow-100 text-yellow-800";
                  } else if (record.notes?.toLowerCase().includes("half-day")) {
                    statusDisplay = "Half-day";
                    statusClass = "bg-blue-100 text-blue-800";
                  }
                  
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{mechanic?.name || "Unknown"}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.checkIn || "N/A"}</TableCell>
                      <TableCell>{record.checkOut || "N/A"}</TableCell>
                      <TableCell>{hoursWorked.toFixed(1)}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                          {statusDisplay}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceReport;
