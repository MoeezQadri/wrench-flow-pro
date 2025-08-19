
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BarChart, MoreHorizontal, Edit, Archive, ArchiveRestore, Trash2, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MechanicDialog from "@/components/mechanic/MechanicDialog";
import { Mechanic } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useDataContext } from "@/context/data/DataContext";
import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { canManageMechanics } from "@/utils/permissions";
import { toast } from "sonner";

const Mechanics = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [mechanicToDelete, setMechanicToDelete] = useState<Mechanic | null>(null);
  const [mechanicToArchive, setMechanicToArchive] = useState<Mechanic | null>(null);
  const navigate = useNavigate();
  const {
    mechanics,
    addMechanic,
    updateMechanic,
    removeMechanic,
  } = useDataContext();
  const { currentUser } = useAuthContext();
  const userCanManageMechanics = canManageMechanics(currentUser);

  // Filter mechanics based on active status
  const filteredMechanics = showActiveOnly 
    ? mechanics.filter(mechanic => mechanic.is_active)
    : mechanics;

  const activeMechanicsCount = mechanics.filter(m => m.is_active).length;
  const totalMechanicsCount = mechanics.length;

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

  const handleArchiveMechanic = (mechanic: Mechanic) => {
    setMechanicToArchive(mechanic);
    setArchiveDialogOpen(true);
  };

  const handleDeleteMechanic = (mechanic: Mechanic) => {
    setMechanicToDelete(mechanic);
    setDeleteDialogOpen(true);
  };

  const confirmArchive = async () => {
    if (!mechanicToArchive) return;
    
    try {
      await updateMechanic(mechanicToArchive.id, {
        ...mechanicToArchive,
        is_active: !mechanicToArchive.is_active
      });
      toast.success(
        mechanicToArchive.is_active 
          ? "Mechanic archived successfully" 
          : "Mechanic restored successfully"
      );
    } catch (error) {
      toast.error("Failed to update mechanic status");
    } finally {
      setArchiveDialogOpen(false);
      setMechanicToArchive(null);
    }
  };

  const confirmDelete = async () => {
    if (!mechanicToDelete) return;
    
    try {
      await removeMechanic(mechanicToDelete.id);
      toast.success("Mechanic deleted permanently");
    } catch (error) {
      toast.error("Failed to delete mechanic");
    } finally {
      setDeleteDialogOpen(false);
      setMechanicToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mechanics</h1>
          <p className="text-muted-foreground">
            Showing {filteredMechanics.length} of {totalMechanicsCount} mechanics
            {showActiveOnly && ` (${activeMechanicsCount} active)`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showActiveOnly ? "Show All" : "Show Active Only"}
          </Button>
          {userCanManageMechanics && (
            <Button onClick={handleAddMechanic}>
              <Plus className="h-4 w-4 mr-2" /> Add Mechanic
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMechanics.map((mechanic) => (
          <Card key={mechanic.id} className={mechanic.is_active ? "" : "opacity-60"}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>{mechanic.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={mechanic.is_active ? "default" : "outline"}>
                    {mechanic.is_active ? "Active" : "Archived"}
                  </Badge>
                  {userCanManageMechanics && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditMechanic(mechanic)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleArchiveMechanic(mechanic)}
                          className="text-amber-600 dark:text-amber-400"
                        >
                          {mechanic.is_active ? (
                            <>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </>
                          ) : (
                            <>
                              <ArchiveRestore className="h-4 w-4 mr-2" />
                              Restore
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMechanic(mechanic)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
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
                <div className="mt-4 flex justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewPerformance(mechanic)}
                    className="w-full"
                  >
                    <BarChart className="h-4 w-4 mr-2" />
                    View Performance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredMechanics.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-64 border rounded-lg">
            <div className="text-center">
              <p className="text-muted-foreground">
                {showActiveOnly 
                  ? (mechanics.length === 0 ? "No mechanics found" : "No active mechanics found")
                  : "No mechanics found"
                }
              </p>
              {userCanManageMechanics && mechanics.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleAddMechanic}
                >
                  Add your first mechanic
                </Button>
              )}
              {showActiveOnly && mechanics.length > 0 && filteredMechanics.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowActiveOnly(false)}
                >
                  Show all mechanics
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

      {/* Archive/Restore Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {mechanicToArchive?.is_active ? "Archive Mechanic" : "Restore Mechanic"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {mechanicToArchive?.is_active 
                ? `Are you sure you want to archive "${mechanicToArchive?.name}"? This will hide them from the active mechanics list but keep their data.`
                : `Are you sure you want to restore "${mechanicToArchive?.name}"? This will make them active again.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>
              {mechanicToArchive?.is_active ? "Archive" : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mechanic Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{mechanicToDelete?.name}"? 
              This action cannot be undone and will remove all their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Mechanics;
