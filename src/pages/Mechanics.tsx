
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Wrench } from "lucide-react";
import { toast } from "sonner";
import MechanicDialog from "@/components/mechanic/MechanicDialog";
import { mechanics } from "@/services/data-service";
import { Mechanic } from "@/types";

const Mechanics = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | undefined>(undefined);
  const [mechanicsList, setMechanicsList] = useState<Mechanic[]>(mechanics);

  const handleAddMechanic = () => {
    setSelectedMechanic(undefined);
    setIsDialogOpen(true);
  };

  const handleEditMechanic = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic);
    setIsDialogOpen(true);
  };

  const handleSaveMechanic = (mechanic: Mechanic) => {
    setMechanicsList(prev => {
      const index = prev.findIndex(m => m.id === mechanic.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = mechanic;
        return updated;
      } else {
        return [...prev, mechanic];
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Mechanics</h1>
        <Button onClick={handleAddMechanic}>
          <Plus className="mr-1 h-4 w-4" />
          Add Mechanic
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Mechanic Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mechanicsList.map((mechanic) => (
                <TableRow key={mechanic.id}>
                  <TableCell className="font-medium">{mechanic.name}</TableCell>
                  <TableCell>{mechanic.specialization}</TableCell>
                  <TableCell>${mechanic.hourlyRate.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        mechanic.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {mechanic.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMechanic(mechanic)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {mechanicsList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Wrench className="w-12 h-12 mb-2 text-muted-foreground/60" />
                      <p>No mechanics found</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={handleAddMechanic}
                      >
                        Add your first mechanic
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MechanicDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveMechanic}
        mechanic={selectedMechanic}
      />
    </div>
  );
};

export default Mechanics;
