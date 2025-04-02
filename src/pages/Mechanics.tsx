
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Wrench, IdCard, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import MechanicDialog from "@/components/mechanic/MechanicDialog";
import { mechanics } from "@/services/data-service";
import { Mechanic } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
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
                <TableHead>Mechanic</TableHead>
                <TableHead>Contact Information</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Employment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mechanicsList.map((mechanic) => (
                <TableRow key={mechanic.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={mechanic.idCardImage} alt={mechanic.name} />
                        <AvatarFallback>{getInitials(mechanic.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{mechanic.name}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <IdCard className="h-3 w-3 mr-1" />
                          {mechanic.idCardImage ? "ID Card Available" : "No ID Card"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        {mechanic.phone}
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        {mechanic.address.length > 25 
                          ? `${mechanic.address.substring(0, 25)}...` 
                          : mechanic.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{mechanic.specialization}</TableCell>
                  <TableCell>
                    <div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        mechanic.employmentType === 'fulltime'
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {mechanic.employmentType === 'fulltime' ? 'Full-Time' : 'Contractor'}
                      </span>
                    </div>
                  </TableCell>
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
                  <TableCell colSpan={6} className="text-center py-6">
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
