
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Calendar, 
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
  attendance, 
  approveAttendance, 
  getMechanicById, 
  getCurrentUser, 
  hasPermission,
  Attendance
} from "@/services/data-service";
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
import { toast } from "sonner";

const AttendancePage = () => {
  // Changed to use the Attendance type from data-service
  const [attendanceList, setAttendanceList] = useState<Attendance[]>(() => attendance);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>("");
  const currentUser = getCurrentUser();
  
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
  });

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

  const handleApprove = (id: string, status: 'approved' | 'rejected') => {
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
              status, 
              approvedBy: currentUser.id,
              notes: notes || record.notes
            } 
          : record
      )
    );
    
    // In a real app, this would call an API
    approveAttendance(id, currentUser.id, status, notes);
    
    toast.success(`Attendance ${status}`);
    setNotes("");
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
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <Calendar className="h-4 w-4" />
          </Button>
          <div className="flex items-center border rounded-md px-3 py-1">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{selectedDate}</span>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Records</CardTitle>
            <div className="flex gap-2">
              {canManageAttendance && (
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Record
                </Button>
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
                                className="text-green-600 cursor-pointer"
                                onClick={() => handleApprove(record.id, 'approved')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 cursor-pointer"
                                onClick={() => handleApprove(record.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <Popover>
                                <PopoverTrigger asChild>
                                  <DropdownMenuItem 
                                    className="cursor-pointer"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <ClipboardCheck className="h-4 w-4 mr-2" />
                                    Add Notes
                                  </DropdownMenuItem>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Attendance Notes</h4>
                                    <Textarea 
                                      placeholder="Add notes about this attendance record"
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                    />
                                    <div className="flex justify-end space-x-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setNotes("")}
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        size="sm"
                                        onClick={() => {
                                          handleApprove(record.id, 'approved');
                                        }}
                                      >
                                        Save & Approve
                                      </Button>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {record.status === 'approved' ? (
                              <span className="flex items-center justify-end">
                                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                Approved
                              </span>
                            ) : (
                              <span className="flex items-center justify-end">
                                <XCircle className="h-4 w-4 mr-1 text-red-500" />
                                Rejected
                              </span>
                            )}
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {filteredAttendance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canApproveAttendance ? 7 : 6} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Clock className="w-12 h-12 mb-2 text-muted-foreground/60" />
                      <p>No attendance records found</p>
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
