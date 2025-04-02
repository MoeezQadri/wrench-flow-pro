
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Calendar, CalendarCheck, Tag } from "lucide-react";
import { toast } from "sonner";
import TaskDialog from "@/components/task/TaskDialog";
import TaskCheckInOut from "@/components/task/TaskCheckInOut";
import { 
  tasks, 
  mechanics, 
  getMechanicById, 
  getCurrentUser, 
  hasPermission,
  getInvoiceById 
} from "@/services/data-service";
import { Task } from "@/types";

const Tasks = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [tasksList, setTasksList] = useState<Task[]>(tasks);
  const [selectedTaskForTimeTracking, setSelectedTaskForTimeTracking] = useState<Task | null>(null);
  const currentUser = getCurrentUser();

  // Check permissions
  const canViewTasks = hasPermission(currentUser, 'tasks', 'view');
  const canManageTasks = hasPermission(currentUser, 'tasks', 'manage');
  
  // For mechanics, filter tasks to only show their own
  const filteredTasks = currentUser.role === 'mechanic' && currentUser.mechanicId 
    ? tasksList.filter(task => task.mechanicId === currentUser.mechanicId)
    : tasksList;

  if (!canViewTasks) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-muted-foreground">You don't have permission to view tasks.</p>
      </div>
    );
  }

  const handleAddTask = () => {
    if (!canManageTasks && currentUser.role !== 'mechanic') {
      toast.error("You don't have permission to add tasks");
      return;
    }
    
    setSelectedTask(undefined);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    // Mechanics can only edit their own tasks
    if (currentUser.role === 'mechanic' && task.mechanicId !== currentUser.mechanicId) {
      toast.error("You can only edit your own tasks");
      return;
    }
    
    // Managers and owners can edit any task
    if (currentUser.role !== 'mechanic' && !canManageTasks) {
      toast.error("You don't have permission to edit tasks");
      return;
    }
    
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleSaveTask = (task: Task) => {
    setTasksList(prev => {
      const index = prev.findIndex(t => t.id === task.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = task;
        return updated;
      } else {
        return [...prev, task];
      }
    });
  };

  const handleTimeTrackingUpdate = (updatedTask: Task) => {
    setTasksList(prev => 
      prev.map(task => task.id === updatedTask.id ? updatedTask : task)
    );
    setSelectedTaskForTimeTracking(null);
  };

  const getStatusBadgeClass = (status: 'pending' | 'in-progress' | 'completed') => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getInvoiceInfo = (task: Task) => {
    if (!task.invoiceId) return null;
    
    const invoice = getInvoiceById(task.invoiceId);
    if (!invoice) return null;
    
    return {
      id: invoice.id,
      status: invoice.status,
      vehicle: `${invoice.vehicleInfo.make} ${invoice.vehicleInfo.model}`
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        {(canManageTasks || currentUser.role === 'mechanic') && (
          <Button onClick={handleAddTask}>
            <Plus className="mr-1 h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>

      {selectedTaskForTimeTracking && (
        <TaskCheckInOut 
          task={selectedTaskForTimeTracking}
          onUpdate={handleTimeTrackingUpdate}
        />
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Mechanic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Est. Hours</TableHead>
                <TableHead>Hours Spent</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const mechanic = getMechanicById(task.mechanicId);
                const invoiceInfo = getInvoiceInfo(task);
                
                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      <div>{task.title}</div>
                      <div className="text-xs text-muted-foreground">{task.description.substring(0, 60)}{task.description.length > 60 ? '...' : ''}</div>
                    </TableCell>
                    <TableCell>{mechanic?.name || "Unknown"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(task.status)}`}
                      >
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{task.hoursEstimated}</TableCell>
                    <TableCell>{task.hoursSpent || "—"}</TableCell>
                    <TableCell>
                      {invoiceInfo ? (
                        <div className="flex items-center">
                          <Tag className="h-3 w-3 mr-1 text-blue-500" />
                          <span className="text-xs">
                            {invoiceInfo.id.substring(0, 8)}...
                            <span className="ml-1 text-muted-foreground">
                              ({invoiceInfo.vehicle})
                            </span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        {/* Time tracking button for mechanics */}
                        {currentUser.role === 'mechanic' && currentUser.mechanicId === task.mechanicId && task.status !== 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTaskForTimeTracking(task)}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Edit button */}
                        {((canManageTasks) || (currentUser.role === 'mechanic' && currentUser.mechanicId === task.mechanicId)) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTask(task)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <CalendarCheck className="w-12 h-12 mb-2 text-muted-foreground/60" />
                      <p>No tasks found</p>
                      {(canManageTasks || currentUser.role === 'mechanic') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={handleAddTask}
                        >
                          Add your first task
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveTask}
        task={selectedTask}
      />
    </div>
  );
};

export default Tasks;
