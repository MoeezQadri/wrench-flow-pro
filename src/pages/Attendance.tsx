
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Calendar as CalendarIcon, 
  CheckCircle, 
  ClipboardCheck, 
  Clock, 
  Download, 
  Filter, 
  MoreVertical, 
  Plus, 
  XCircle 
} from "lucide-react";
import { 
  attendanceRecords, 
  approveAttendance, 
  getMechanicById, 
  getCurrentUser, 
  hasPermission,
  recordAttendance
} from "@/services/data-service";
import { Attendance } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { AttendanceDialog } from "@/components/attendance/AttendanceDialog";

const AttendancePage = () => {
  const [attendanceList, setAttendanceList] = useState<Attendance[]>(() => attendanceRecords);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const currentUser = getCurrentUser();
  
  // Format the selected date as YYYY-MM-DD for filtering
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  
  // Check if current user has permission to view attendance
  const canViewAttendance = hasPermission(currentUser, 'attendance', 'view');
  const canManageAttendance = hasPermission(currentUser, 'attendance', 'manage');
  const canApproveAttendance = hasPermission(currentUser, 'attendance', 'approve');
  
  if (!canViewAttendance) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-muted-foreground">You don't have permission to view attendance records.</p>
      </div>
    );
  }
  
  // Filter attendance records based on role
  const filteredAttendance = attendanceList.filter(record => {
    // If mechanic, only show their own records
    if (currentUser.role === 'mechanic') {
      return currentUser.mechanicId === record.mechanicId;
    }
    // Managers and owners can see all records
    return true;
  }).filter(record => record.date === formattedDate);

  const handleApprove = (id: string) => {
    if (!canApproveAttendance) {
      toast.error("You don't have permission to approve attendance records");
      return;
    }
    
    // Update attendance record in state
    setAttendanceList(prev => 
      prev.map(record => 
        record.id === id 
          ? { 
              ...record, 
              status: 'approved', 
              approvedBy: currentUser.id,
              notes: notes || record.notes
            } 
          : record
      )
    );
    
    // In a real app, this would call an API
    approveAttendance(id, currentUser.id);
    
    toast.success("Attendance approved");
    setNotes("");
  };

  const handleAddAttendance = async (attendanceData: Omit<Attendance, "id">) => {
    try {
      // In a real app, this would call an API
      const newAttendance = await recordAttendance(attendanceData);
      
      // Update local state
      setAttendanceList(prev => [...prev, newAttendance]);
      
      toast.success("Attendance record added successfully");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding attendance record:", error);
      toast.error("Failed to add attendance record");
    }
  };

  const getStatusBadgeClass = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] flex justify-between items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span>{format(selectedDate, "MMMM d, yyyy")}</span>
                <span className="sr-only">Open date picker</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Records</CardTitle>
            <div className="flex gap-2">
              {canManageAttendance && (
                <AttendanceDialog
                  trigger={
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Record
                    </Button>
                  }
                  onSave={handleAddAttendance}
                  open={isDialogOpen}
                  onOpenChange={setIsDialogOpen}
                />
              )}
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
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                {canApproveAttendance && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.map((record) => {
                const mechanic = getMechanicById(record.mechanicId);
                
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{mechanic?.name || "Unknown"}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.checkIn}</TableCell>
                    <TableCell>{record.checkOut || "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(record.status)}`}
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{record.notes || "—"}</TableCell>
                    {canApproveAttendance && (
                      <TableCell className="text-right">
                        {record.status === 'pending' ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                className="flex items-center text-green-600"
                                onClick={() => handleApprove(record.id)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <div className="p-2">
                                <Textarea
                                  placeholder="Add notes..."
                                  className="min-h-[80px] w-[200px]"
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                />
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {record.status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {filteredAttendance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canApproveAttendance ? 7 : 6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ClipboardCheck className="h-12 w-12 mb-2 opacity-20" />
                      <p>No attendance records found for this date</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;
