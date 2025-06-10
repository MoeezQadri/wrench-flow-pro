
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { assignMechanicToInvoiceTask } from "@/services/inventory-sync-service";
import { useDataContext } from "@/context/data/DataContext";
import { useAuthContext } from "@/context/AuthContext";
import { UserPlus } from "lucide-react";

interface TaskMechanicAssignmentProps {
  taskId: string;
  currentMechanicId?: string;
  taskTitle: string;
  onAssignmentComplete?: () => void;
}

const TaskMechanicAssignment: React.FC<TaskMechanicAssignmentProps> = ({
  taskId,
  currentMechanicId,
  taskTitle,
  onAssignmentComplete
}) => {
  const [selectedMechanicId, setSelectedMechanicId] = useState(currentMechanicId || "");
  const [isAssigning, setIsAssigning] = useState(false);
  const { mechanics } = useDataContext();
  const { currentUser } = useAuthContext();

  // Only allow managers and foremen to assign mechanics
  const canAssignMechanics = currentUser?.role === 'manager' || 
                            currentUser?.role === 'owner' || 
                            currentUser?.role === 'foreman';

  useEffect(() => {
    setSelectedMechanicId(currentMechanicId || "");
  }, [currentMechanicId]);

  if (!canAssignMechanics) {
    return null;
  }

  const handleAssignment = async () => {
    if (!selectedMechanicId || selectedMechanicId === "unassigned") {
      toast.error("Please select a mechanic");
      return;
    }

    setIsAssigning(true);
    
    try {
      await assignMechanicToInvoiceTask(taskId, selectedMechanicId);
      
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    } catch (error) {
      console.error("Error assigning mechanic:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const availableMechanics = mechanics.filter(mechanic => mechanic.is_active);
  const selectedMechanic = mechanics.find(m => m.id === selectedMechanicId);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Assign Mechanic to Task
        </CardTitle>
        <p className="text-xs text-muted-foreground">{taskTitle}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Select value={selectedMechanicId} onValueChange={setSelectedMechanicId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a mechanic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {availableMechanics.map((mechanic) => (
                <SelectItem key={mechanic.id} value={mechanic.id}>
                  {mechanic.name}
                  {mechanic.specialization && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({mechanic.specialization})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedMechanic && (
          <div className="text-xs text-muted-foreground">
            <p>Current assignment: {selectedMechanic.name}</p>
            {selectedMechanic.specialization && (
              <p>Specialization: {selectedMechanic.specialization}</p>
            )}
          </div>
        )}

        <Button 
          onClick={handleAssignment}
          disabled={isAssigning || !selectedMechanicId || selectedMechanicId === currentMechanicId}
          className="w-full"
          size="sm"
        >
          {isAssigning ? "Assigning..." : "Assign Mechanic"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TaskMechanicAssignment;
