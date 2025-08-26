import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { assignMechanicToInvoiceTask } from "@/services/inventory-sync-service";
import { useDataContext } from "@/context/data/DataContext";
import { UserPlus } from "lucide-react";

interface MechanicAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  currentMechanicId?: string;
  taskTitle: string;
  onAssignmentComplete?: () => void;
}

const MechanicAssignmentDialog: React.FC<MechanicAssignmentDialogProps> = ({
  open,
  onOpenChange,
  taskId,
  currentMechanicId,
  taskTitle,
  onAssignmentComplete
}) => {
  const [selectedMechanicId, setSelectedMechanicId] = useState(currentMechanicId || "");
  const [isAssigning, setIsAssigning] = useState(false);
  const { mechanics } = useDataContext();

  useEffect(() => {
    setSelectedMechanicId(currentMechanicId || "");
  }, [currentMechanicId]);

  const handleAssignment = async () => {
    if (!selectedMechanicId) {
      toast.error("Please select a mechanic");
      return;
    }

    setIsAssigning(true);
    
    try {
      await assignMechanicToInvoiceTask(taskId, selectedMechanicId);
      toast.success("Mechanic assigned successfully");
      
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning mechanic:", error);
      toast.error("Failed to assign mechanic. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  const availableMechanics = mechanics.filter(mechanic => mechanic.is_active);
  const selectedMechanic = mechanics.find(m => m.id === selectedMechanicId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Mechanic to Task
          </DialogTitle>
          <DialogDescription>
            Select a mechanic to assign to: {taskTitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div>
            <Select value={selectedMechanicId} onValueChange={setSelectedMechanicId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a mechanic" />
              </SelectTrigger>
              <SelectContent>
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
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Selected: {selectedMechanic.name}</p>
              {selectedMechanic.specialization && (
                <p>Specialization: {selectedMechanic.specialization}</p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignment}
              disabled={isAssigning || !selectedMechanicId || selectedMechanicId === currentMechanicId}
              className="flex-1"
            >
              {isAssigning ? "Assigning..." : currentMechanicId ? "Update Assignment" : "Assign Mechanic"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MechanicAssignmentDialog;