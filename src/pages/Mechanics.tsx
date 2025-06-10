import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays, ChevronDown, BarChart } from "lucide-react";
import MechanicDialog from "@/components/mechanic/MechanicDialog";
import { Mechanic } from "@/types";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MechanicPerformance from "@/components/mechanic/MechanicPerformance";
import { useDataContext } from "@/context/data/DataContext";
import { useAuthContext } from "@/context/AuthContext";

const Mechanics = () => {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    mechanics: mechanics_,
    tasks
  } = useDataContext()
  const { currentUser } = useAuthContext();
  const canManageMechanics = currentUser.role === 'manager' || currentUser.role === 'owner' || currentUser.role === 'foreman';

  // Load mechanics
  useEffect(() => {
    const loadMechanics = async () => {
      try {
        const data = mechanics_;
        setMechanics(data);
      } catch (error) {
        console.error("Failed to load mechanics:", error);
        toast.error("Failed to load mechanics");
        // Fallback to mock data
        setMechanics([]);
      } finally {
        setLoading(false);
      }
    };

    loadMechanics();
  }, []);

  const handleAddMechanic = () => {
    setSelectedMechanic(null);
    setIsDialogOpen(true);
  };

  const handleEditMechanic = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic);
    setIsDialogOpen(true);
  };

  const handleSaveMechanic = (mechanic: Mechanic) => {
    if (selectedMechanic) {
      // Update existing mechanic
      setMechanics(prev =>
        prev.map(m => m.id === mechanic.id ? mechanic : m)
      );
      toast.success("Mechanic updated successfully");
    } else {
      // Add new mechanic
      setMechanics(prev => [...prev, mechanic]);
      toast.success("Mechanic added successfully");
    }

    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        <BarChart className="h-4 w-4 mr-2" />
                        Performance
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[90vw] sm:w-[540px] md:w-[740px]" side="right">
                      <SheetHeader>
                        <SheetTitle>Performance Metrics: {mechanic.name}</SheetTitle>
                        <SheetDescription>
                          Detailed performance analysis and task history
                        </SheetDescription>
                      </SheetHeader>

                      <div className="py-4">
                        <Tabs defaultValue="metrics">
                          <TabsList>
                            <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
                            <TabsTrigger value="attendance">Attendance</TabsTrigger>
                          </TabsList>

                          <TabsContent value="metrics" className="py-4">
                            <MechanicPerformance
                              mechanic={mechanic}
                              tasks={tasks.filter(task => task.mechanicId === mechanic.id)}
                            />
                          </TabsContent>

                          <TabsContent value="attendance">
                            <div className="flex items-center justify-center h-64">
                              <div className="text-center">
                                <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                  Attendance records can be viewed in the Attendance page
                                </p>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </SheetContent>
                  </Sheet>
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
