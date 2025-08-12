
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BarChart } from "lucide-react";
import MechanicDialog from "@/components/mechanic/MechanicDialog";
import { Mechanic } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useDataContext } from "@/context/data/DataContext";
import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const Mechanics = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  const navigate = useNavigate();
  const {
    mechanics,
    addMechanic,
    updateMechanic,
  } = useDataContext();
  const { currentUser } = useAuthContext();
  const canManageMechanics = currentUser.role === 'manager' || currentUser.role === 'owner' || currentUser.role === 'foreman';

  const handleAddMechanic = () => {
    setSelectedMechanic(null);
    setIsDialogOpen(true);
  };

  const handleEditMechanic = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic);
    setIsDialogOpen(true);
  };

  const handleSaveMechanic = async (mechanic: Mechanic) => {
    try {
      if (selectedMechanic) {
        // Update existing mechanic
        await updateMechanic(selectedMechanic.id, mechanic);
      } else {
        // Add new mechanic
        await addMechanic(mechanic);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving mechanic:', error);
      // Error toast is already shown in DataContext
    }
  };

  const handleViewPerformance = (mechanic: Mechanic) => {
    navigate(`/mechanics/${mechanic.id}/performance`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Mechanics</h1>
        {canManageMechanics && (
          <Button onClick={handleAddMechanic}>
            <Plus className="h-4 w-4 mr-2" /> Add Mechanic
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mechanics.map((mechanic) => (
          <Card key={mechanic.id} className={mechanic.is_active ? "" : "opacity-60"}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>{mechanic.name}</CardTitle>
                <Badge variant={mechanic.is_active ? "default" : "outline"}>
                  {mechanic.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription className="flex items-center">
                {mechanic.specialization}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employment:</span>
                  <span className="font-medium">{mechanic.employment_type === 'fulltime' ? 'Full-time' : 'Contractor'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact:</span>
                  <span className="font-medium">{mechanic.phone}</span>
                </div>
                <div className="mt-4 flex justify-between">
                  {canManageMechanics && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditMechanic(mechanic)}
                    >
                      Details
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewPerformance(mechanic)}
                  >
                    <BarChart className="h-4 w-4 mr-2" />
                    Performance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {mechanics.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-64 border rounded-lg">
            <div className="text-center">
              <p className="text-muted-foreground">No mechanics found</p>
              {canManageMechanics && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleAddMechanic}
                >
                  Add your first mechanic
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <MechanicDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mechanic={selectedMechanic}
        onSave={handleSaveMechanic}
      />
    </div>
  );
};

export default Mechanics;
