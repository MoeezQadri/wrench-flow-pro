
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MechanicPerformance from "@/components/mechanic/MechanicPerformance";
import { useDataContext } from "@/context/data/DataContext";

const MechanicPerformancePage = () => {
  const { mechanicId } = useParams<{ mechanicId: string }>();
  const navigate = useNavigate();
  const { mechanics, tasks } = useDataContext();

  const mechanic = mechanics.find(m => m.id === mechanicId);

  if (!mechanic) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h1 className="text-2xl font-bold mb-4">Mechanic Not Found</h1>
        <Button onClick={() => navigate('/mechanics')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Mechanics
        </Button>
      </div>
    );
  }

  const mechanicTasks = tasks.filter(task => task.mechanicId === mechanic.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/mechanics')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Mechanics
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Metrics</h1>
          <p className="text-muted-foreground">Detailed performance analysis for {mechanic.name}</p>
        </div>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="py-4">
          <MechanicPerformance
            mechanic={mechanic}
            tasks={mechanicTasks}
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
  );
};

export default MechanicPerformancePage;
