
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, User } from 'lucide-react';
import { Attendance, Mechanic } from '@/types';
import { useAuthContext } from '@/context/AuthContext';

interface AttendanceListItemProps {
  record: Attendance;
  mechanic: Mechanic | undefined;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCheckOut?: (record: Attendance) => void;
}

const AttendanceListItem: React.FC<AttendanceListItemProps> = ({
  record,
  mechanic,
  onApprove,
  onReject,
  onCheckOut
}) => {
  const { currentUser } = useAuthContext();

  // Check if user can approve attendance (owner, manager, foreman)
  const canApprove = currentUser?.role === 'owner' || 
                    currentUser?.role === 'manager' || 
                    currentUser?.role === 'foreman';

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      present: 'bg-blue-100 text-blue-800 border-blue-200',
      late: 'bg-orange-100 text-orange-800 border-orange-200',
      absent: 'bg-gray-100 text-gray-800 border-gray-200',
      'half-day': 'bg-purple-100 text-purple-800 border-purple-200'
    };

    return (
      <Badge 
        variant="outline" 
        className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
      >
        {status === 'half-day' ? 'Half Day' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const calculateWorkingHours = () => {
    if (!record.check_out) return 'Ongoing';
    
    const checkIn = new Date(`1970-01-01T${record.check_in}`);
    const checkOut = new Date(`1970-01-01T${record.check_out}`);
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{mechanic?.name || 'Unknown Mechanic'}</span>
              {getStatusBadge(record.status)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Date:</span> {record.date}
              </div>
              <div>
                <span className="font-medium">Check-in:</span> {record.check_in}
              </div>
              <div>
                <span className="font-medium">Check-out:</span> {record.check_out || 'Not checked out'}
              </div>
            </div>
            
            <div className="mt-2 text-sm">
              <span className="font-medium">Working Hours:</span> {calculateWorkingHours()}
            </div>
            
            {record.notes && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Notes:</span> {record.notes}
              </div>
            )}
          </div>
          
          <div className="flex gap-2 ml-4">
            {/* Check-out button for ongoing attendance */}
            {!record.check_out && onCheckOut && (
              <Button
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => onCheckOut(record)}
              >
                <Clock className="h-4 w-4 mr-1" />
                Check Out
              </Button>
            )}
            
            {/* Approval buttons for pending records */}
            {canApprove && record.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => onApprove(record.id)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => onReject(record.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
          </div>
          
          {record.status !== 'pending' && record.approved_by && (
            <div className="text-xs text-muted-foreground ml-4">
              <Clock className="h-3 w-3 inline mr-1" />
              {record.status === 'approved' ? 'Approved' : 'Rejected'} by Admin
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceListItem;
