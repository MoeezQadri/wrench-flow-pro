
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Calendar, CalendarCheck, Tag, Car, MapPin, Filter, UserPlus, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import TaskDialog from "@/components/task/TaskDialog";
import TaskCheckInOut from "@/components/task/TaskCheckInOut";
import TaskMechanicAssignment from "@/components/task/TaskMechanicAssignment";
import AssignToInvoiceDialog from "@/components/task/AssignToInvoiceDialog";
import {
  hasPermission,
} from "@/services/data-service";
import { Task, TaskLocation, Invoice, Vehicle, Mechanic, Customer, TaskStatus } from "@/types";
import { resolvePromiseAndSetState } from "@/utils/async-helpers";
import { useDataContext } from "@/context/data/DataContext";
import { useAuthContext } from "@/context/AuthContext";

const Tasks = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [selectedTaskForTimeTracking, setSelectedTaskForTimeTracking] = useState<Task | null>(null);
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<Task | null>(null);
  const [selectedTaskForInvoiceAssignment, setSelectedTaskForInvoiceAssignment] = useState<Task | null>(null);
  const [showInvoiceAssignDialog, setShowInvoiceAssignDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState<TaskLocation | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [mechanicFilter, setMechanicFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const {
    tasks,
    mechanics,
    getMechanicById,
    getInvoiceById,
    getVehicleById,
    getCustomerById,
  } = useDataContext()
  const { currentUser: user } = useAuthContext()
  const currentUser: any = user;
  
  // Check permissions
  const canViewTasks = hasPermission(currentUser, 'tasks', 'view');
  const canManageTasks = currentUser?.role === 'manager' || currentUser?.role === 'owner';
  const isForeman = currentUser?.role === 'foreman';

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        setTasksList(tasks);
      } catch (error) {
        console.error("Error loading tasks:", error);
        toast.error("Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Apply filters to tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasksList;

    // Filter by mechanic for mechanic users
    if (currentUser?.role === 'mechanic' && currentUser?.mechanicId) {
      filtered = filtered.filter(task => task.mechanicId === currentUser?.mechanicId);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply location filter if not set to 'all'
    if (locationFilter !== 'all') {
      filtered = filtered.filter(task => task.location === locationFilter);
    }

    // Apply status filter if not set to 'all'
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Apply mechanic filter if not set to 'all'
    if (mechanicFilter !== 'all') {
      filtered = filtered.filter(task => task.mechanicId === mechanicFilter);
    }

    return filtered;
  }, [tasksList, currentUser?.role, currentUser?.mechanicId, searchTerm, locationFilter, statusFilter, mechanicFilter]);

  const handleAssignmentComplete = () => {
    setSelectedTaskForAssignment(null);
    // Refresh tasks list
    const loadTasks = async () => {
      try {
        setTasksList(tasks);
      } catch (error) {
        console.error("Error reloading tasks:", error);
        toast.error("Failed to reload tasks");
      }
    };
    loadTasks();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('all');
    setStatusFilter('all');
    setMechanicFilter('all');
  };

  if (!canViewTasks) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-muted-foreground">You don't have permission to view tasks.</p>
      </div>
    );
  }

  const handleAddTask = () => {
    if (!canManageTasks && currentUser?.role !== 'mechanic') {
      toast.error("You don't have permission to add tasks");
      return;
    }

    setSelectedTask(undefined);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    // Mechanics can only edit their own tasks
    if (currentUser?.role === 'mechanic' && task.mechanicId !== currentUser?.mechanicId) {
      toast.error("You can only edit your own tasks");
      return;
    }

    // Managers, owners, and foremen can edit any task
    if (currentUser?.role !== 'mechanic' && currentUser?.role !== 'foreman' && !canManageTasks) {
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

  const handleAssignToInvoice = (task: Task) => {
    setSelectedTaskForInvoiceAssignment(task);
    setShowInvoiceAssignDialog(true);
  };

  const handleInvoiceAssignmentComplete = () => {
    // Refresh the tasks list
    const loadTasks = async () => {
      try {
        setTasksList(tasks);
      } catch (error) {
        console.error("Error reloading tasks:", error);
        toast.error("Failed to reload tasks");
      }
    };
    
    loadTasks();
    setShowInvoiceAssignDialog(false);
    setSelectedTaskForInvoiceAssignment(null);
  };

  const getStatusBadgeClass = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLocationBadgeClass = (location?: TaskLocation) => {
    switch (location) {
      case 'workshop':
        return 'bg-blue-100 text-blue-800';
      case 'onsite':
        return 'bg-purple-100 text-purple-800';
      case 'remote':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvoiceInfo = async (task: Task) => {
    if (!task.invoiceId) return null;

    let invoice: Invoice | null = null;
    const resp = getInvoiceById(task.invoiceId);
    invoice = resp;

    if (!invoice) return null;

    return {
      id: invoice.id,
      status: invoice.status,
      vehicle: `${invoice.vehicleInfo.make} ${invoice.vehicleInfo.model}`,
      vehicleId: invoice.vehicle_id,
      customerId: invoice.customer_id
    };
  };

  const getVehicleInfo = async (vehicleId?: string) => {
    if (!vehicleId) return null;

    let vehicle: Vehicle | null = null;
    const resp = getVehicleById(vehicleId);

    vehicle = resp;

    if (!vehicle) return null;

    return {
      vehicleId: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      license_plate: vehicle.license_plate,
      customerId: vehicle.customer_id
    };
  };

  const getCustomerInfo = async (customerId: string) => {
    let customerName = "Unknown Customer";
    const resp = await getCustomerById(customerId);
    customerName = resp?.name || "Unknown Customer";

    return customerName;
  };

  const [vehicleInfoCache, setVehicleInfoCache] = useState<Record<string, any>>({});
  const [invoiceInfoCache, setInvoiceInfoCache] = useState<Record<string, any>>({});
  const [customerInfoCache, setCustomerInfoCache] = useState<Record<string, any>>({});
  const [mechanicInfoCache, setMechanicInfoCache] = useState<Record<string, Mechanic | null>>({});

  // Prefetch data for displaying in the table
  useEffect(() => {
    const prefetchData = async () => {
      // Prefetch mechanic data
      for (const task of tasksList) {
        if (task.mechanicId && !mechanicInfoCache[task.mechanicId]) {
          const resp = getMechanicById(task.mechanicId);
          setMechanicInfoCache(prev => ({
            ...prev,
            [task.mechanicId]: resp
          }));
        }

        // Prefetch vehicle data
        if (task.vehicleId && !vehicleInfoCache[task.vehicleId]) {
          const vehicleInfo = await getVehicleInfo(task.vehicleId);
          if (vehicleInfo) {
            setVehicleInfoCache(prev => ({
              ...prev,
              [vehicleInfo.vehicleId!]: vehicleInfo
            }));

            // Prefetch customer data
            if (!customerInfoCache[vehicleInfo.customerId]) {
              const customerName = await getCustomerInfo(vehicleInfo.customerId);
              setCustomerInfoCache(prev => ({
                ...prev,
                [vehicleInfo.customerId]: customerName
              }));
            }
          }
        }

        // Prefetch invoice data
        if (task.invoiceId && !invoiceInfoCache[task.invoiceId]) {
          const invoiceInfo = await getInvoiceInfo(task);
          if (invoiceInfo) {
            setInvoiceInfoCache(prev => ({
              ...prev,
              [invoiceInfo.id!]: invoiceInfo
            }));

            // Prefetch customer data
            if (!customerInfoCache[invoiceInfo.customerId]) {
              const customerName = await getCustomerInfo(invoiceInfo.customerId);
              setCustomerInfoCache(prev => ({
                ...prev,
                [invoiceInfo.customerId]: customerName
              }));
            }
          }
        }
      }
    };

    if (tasksList.length > 0 && !isLoading) {
      prefetchData();
    }
  }, [tasksList, isLoading]);

  const shouldShowVehicleColumn = isForeman || currentUser?.role === 'manager' || currentUser?.role === 'owner';
  const shouldShowAssignmentColumn = isForeman || currentUser?.role === 'manager' || currentUser?.role === 'owner';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        {(canManageTasks || currentUser?.role === 'mechanic' || isForeman) && (
          <Button onClick={handleAddTask}>
            <Plus className="mr-1 h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>

      {selectedTaskForTimeTracking && (
        <TaskCheckInOut
          task={selectedTaskForTimeTracking}
          onTaskUpdate={handleTimeTrackingUpdate}
        />
      )}

      {selectedTaskForAssignment && (
        <TaskMechanicAssignment
          taskId={selectedTaskForAssignment.id}
          currentMechanicId={selectedTaskForAssignment.mechanicId || undefined}
          taskTitle={selectedTaskForAssignment.title}
          onAssignmentComplete={handleAssignmentComplete}
        />
      )}

      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={locationFilter} onValueChange={(value) => setLocationFilter(value as TaskLocation | 'all')}>
          <SelectTrigger>
            <MapPin className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="workshop">Workshop</SelectItem>
            <SelectItem value="onsite">Onsite</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}>
          <SelectTrigger>
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>

        {shouldShowAssignmentColumn && (
          <Select value={mechanicFilter} onValueChange={setMechanicFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Mechanic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Mechanics</SelectItem>
              {mechanics.map(mechanic => (
                <SelectItem key={mechanic.id} value={mechanic.id}>
                  {mechanic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button variant="outline" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredTasks.length} of {tasksList.length} tasks
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Mechanic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Est. Hours</TableHead>
                <TableHead>Hours Spent</TableHead>
                {shouldShowVehicleColumn && <TableHead>Vehicle/Customer</TableHead>}
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const mechanic = mechanicInfoCache[task.mechanicId || ""] || null;
                const vehicleInfo = task.vehicleId ? vehicleInfoCache[task.vehicleId] : null;
                const invoiceInfo = task.invoiceId ? invoiceInfoCache[task.invoiceId] : null;

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
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getLocationBadgeClass(task.location)}`}
                      >
                        {task.location?.charAt(0).toUpperCase() + task.location?.slice(1) || "Workshop"}
                      </span>
                    </TableCell>
                    <TableCell>{task.hoursEstimated}</TableCell>
                    <TableCell>{task.hoursSpent || "—"}</TableCell>
                    {shouldShowVehicleColumn && (
                      <TableCell>
                        {vehicleInfo ? (
                          <div className="flex flex-col">
                            <span className="text-xs flex items-center">
                              <Car className="h-3 w-3 mr-1 text-blue-500" />
                              {vehicleInfo.make} {vehicleInfo.model} ({vehicleInfo.license_plate})
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {customerInfoCache[vehicleInfo.customerId] || "Unknown Customer"}
                            </span>
                          </div>
                        ) : invoiceInfo ? (
                          <div className="flex flex-col">
                            <span className="text-xs flex items-center">
                              <Car className="h-3 w-3 mr-1 text-blue-500" />
                              {invoiceInfo.vehicle}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {customerInfoCache[invoiceInfo.customerId] || "Unknown Customer"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {invoiceInfo ? (
                        <div className="flex items-center">
                          <Tag className="h-3 w-3 mr-1 text-blue-500" />
                          <span className="text-xs">
                            {invoiceInfo.id.substring(0, 8)}...
                            <span className="ml-1 text-muted-foreground">
                              ({invoiceInfo.status})
                            </span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        {/* Invoice assignment button for completed tasks */}
                        {task.status === 'completed' && (canManageTasks || isForeman) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignToInvoice(task)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        )}

                        {/* Mechanic assignment button for managers/foremen */}
                        {shouldShowAssignmentColumn && !task.mechanicId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTaskForAssignment(task)}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Time tracking button for mechanics */}
                        {currentUser?.role === 'mechanic' && currentUser?.mechanicId === task.mechanicId && task.status !== 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTaskForTimeTracking(task)}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Edit button */}
                        {((canManageTasks) || (currentUser?.role === 'mechanic' && currentUser?.mechanicId === task.mechanicId) || isForeman) && (
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
                  <TableCell colSpan={shouldShowVehicleColumn ? 9 : 8} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <CalendarCheck className="w-12 h-12 mb-2 text-muted-foreground/60" />
                      <p>
                        {tasksList.length === 0 ? "No tasks found" : "No tasks match your search criteria"}
                      </p>
                      {(canManageTasks || currentUser?.role === 'mechanic' || isForeman) && tasksList.length === 0 && (
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

      <AssignToInvoiceDialog
        open={showInvoiceAssignDialog}
        onOpenChange={setShowInvoiceAssignDialog}
        task={selectedTaskForInvoiceAssignment}
        onAssignmentComplete={handleInvoiceAssignmentComplete}
      />
    </div>
  );
};

export default Tasks;
