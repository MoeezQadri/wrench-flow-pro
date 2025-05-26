import { faker } from '@faker-js/faker';
import {
  User,
  UserRole,
  Customer,
  Vehicle,
  Mechanic,
  Task,
  Invoice,
  Part,
  Expense,
  Attendance,
  Permission,
  RolePermissionMap,
  Organization,
} from '@/types';

// Function to generate a unique ID
export const generateId = (prefix: string): string => {
  return `${prefix}-${faker.string.uuid()}`;
};

// Function to generate a random date within a specified range
const getRandomDate = (start: Date, end: Date): string => {
  return faker.date.between({ from: start, to: end }).toISOString().split('T')[0];
};

// Function to generate a random amount within a specified range
const getRandomAmount = (min: number, max: number): number => {
  return faker.number.float({ min, max });
};

// Function to generate a random phone number
const getRandomPhoneNumber = (): string => {
  return faker.phone.number();
};

// Function to generate a random boolean value
const getRandomBoolean = (): boolean => {
  return faker.datatype.boolean();
};

// Function to generate a random integer within a specified range
const getRandomInteger = (min: number, max: number): number => {
  return faker.number.int({ min, max });
};

// Function to generate a random item from an array
const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Function to generate a random name
const getRandomName = (): string => {
  return faker.person.fullName();
};

// Function to generate a random email
const getRandomEmail = (): string => {
  return faker.internet.email();
};

// Function to generate a random address
const getRandomAddress = (): string => {
  return faker.location.streetAddress();
};

// Function to generate a random vehicle make
const getRandomVehicleMake = (): string => {
  return faker.vehicle.manufacturer();
};

// Function to generate a random vehicle model
const getRandomVehicleModel = (): string => {
  return faker.vehicle.model();
};

// Function to generate a random vehicle year
const getRandomVehicleYear = (): number => {
  return faker.number.int({ min: 2000, max: new Date().getFullYear() });
};

// Function to generate a random vehicle license plate
const getRandomVehicleLicensePlate = (): string => {
  return faker.string.alphanumeric({ length: 8 }).toUpperCase();
};

// Function to generate a random vehicle VIN
const getRandomVehicleVIN = (): string => {
  return faker.vehicle.vin();
};

// Function to generate a random vehicle color
const getRandomVehicleColor = (): string => {
  return faker.vehicle.color();
};

// Function to generate a random mechanic specialization
const getRandomMechanicSpecialization = (): string => {
  const specializations = ['Engine', 'Brakes', 'Transmission', 'Electrical', 'Suspension'];
  return getRandomItem(specializations);
};

// Function to generate a random task status
const getRandomTaskStatus = (): Task['status'] => {
  const statuses: Task['status'][] = ['pending', 'in-progress', 'completed'];
  return getRandomItem(statuses);
};

// Function to generate a random task location
const getRandomTaskLocation = (): Task['location'] => {
  const locations: Task['location'][] = ['workshop', 'onsite', 'remote'];
  return getRandomItem(locations);
};

// Function to generate a random invoice status
const getRandomInvoiceStatus = (): Invoice['status'] => {
  const statuses: Invoice['status'][] = ['open', 'in-progress', 'pending', 'paid', 'canceled'];
  return getRandomItem(statuses);
};

// Function to generate a random part type
const getRandomPartType = (): Part['type'] => {
  const types: Part['type'][] = ['mechanical', 'electrical', 'body', 'other'];
  return getRandomItem(types);
};

// Function to generate a random expense category
const getRandomExpenseCategory = (): Expense['category'] => {
  const categories: Expense['category'][] = ['fuel', 'parts', 'supplies', 'rent', 'utilities', 'other'];
  return getRandomItem(categories);
};

// Function to generate a random payment method
const getRandomPaymentMethod = (): Expense['payment_method'] => {
  const methods: Expense['payment_method'][] = ['cash', 'card', 'bank-transfer'];
  return getRandomItem(methods);
};

// Function to generate a random attendance status
const getRandomAttendanceStatus = (): Attendance['status'] => {
  const statuses: Attendance['status'][] = ['pending', 'approved', 'rejected'];
  return getRandomItem(statuses);
};

// Function to generate a random user role
const getRandomUserRole = (): UserRole => {
  const roles: UserRole[] = ['owner', 'manager', 'foreman', 'mechanic', 'customer', 'superuser'];
  return getRandomItem(roles);
};

// Function to generate a random permission action
const getRandomPermissionAction = (): string => {
  const actions = ['view', 'create', 'edit', 'delete', 'manage'];
  return getRandomItem(actions);
};

// Function to generate a random organization type
const getRandomOrganizationType = (): Organization['type'] => {
  const types: Organization['type'][] = ['sole-proprietorship', 'partnership', 'corporation', 'limited-liability-company', 'nonprofit'];
  return getRandomItem(types);
};

// Mock data for users
const users: User[] = [
  {
    id: generateId('user'),
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'owner',
    isActive: true,
    lastLogin: new Date().toISOString(),
  },
  {
    id: generateId('user'),
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'manager',
    isActive: true,
    lastLogin: new Date().toISOString(),
  },
  {
    id: generateId('user'),
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    role: 'foreman',
    isActive: true,
    lastLogin: new Date().toISOString(),
  },
  {
    id: generateId('user'),
    name: 'Emily Brown',
    email: 'emily.brown@example.com',
    role: 'mechanic',
    isActive: true,
    lastLogin: new Date().toISOString(),
  },
  {
    id: generateId('user'),
    name: 'Chris Williams',
    email: 'chris.williams@example.com',
    role: 'customer',
    isActive: true,
    lastLogin: new Date().toISOString(),
  },
  {
    id: generateId('user'),
    name: 'Super User',
    email: 'super.user@example.com',
    role: 'superuser',
    isActive: true,
    lastLogin: new Date().toISOString(),
  },
];

// Mock data for customers
const customers: Customer[] = Array.from({ length: 10 }, () => ({
  id: generateId('customer'),
  name: getRandomName(),
  email: getRandomEmail(),
  phone: getRandomPhoneNumber(),
  address: getRandomAddress(),
  total_visits: getRandomInteger(1, 10),
  lifetime_value: getRandomAmount(100, 1000),
  last_visit: getRandomDate(new Date(2023, 0, 1), new Date()),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

// Mock data for vehicles
const vehicles: Vehicle[] = customers.flatMap(customer =>
  Array.from({ length: getRandomInteger(1, 3) }, () => ({
    id: generateId('vehicle'),
    customer_id: customer.id,
    make: getRandomVehicleMake(),
    model: getRandomVehicleModel(),
    year: getRandomVehicleYear(),
    license_plate: getRandomVehicleLicensePlate(),
    vin: getRandomVehicleVIN(),
    color: getRandomVehicleColor(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
);

// Mock data for mechanics
const mechanics: Mechanic[] = Array.from({ length: 5 }, () => ({
  id: generateId('mechanic'),
  name: getRandomName(),
  specialization: getRandomMechanicSpecialization(),
  address: getRandomAddress(),
  phone: getRandomPhoneNumber(),
  id_card_image: faker.image.url(),
  employment_type: getRandomItem(['fulltime', 'contractor']),
  is_active: getRandomBoolean(),
}));

// Mock data for tasks
const tasks: Task[] = Array.from({ length: 20 }, () => {
  const mechanic = getRandomItem(mechanics);
  const vehicle = getRandomItem(vehicles);
  return {
    id: generateId('task'),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    mechanic_id: mechanic.id,
    status: getRandomTaskStatus(),
    hours_estimated: getRandomAmount(1, 8),
    hours_spent: getRandomAmount(0, 8),
    invoice_id: generateId('invoice'),
	vehicle_id: vehicle.id,
    location: getRandomTaskLocation(),
    price: getRandomAmount(50, 500),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    completed_by: generateId('user'),
    completed_at: new Date().toISOString(),
  };
});

// Mock data for invoices
const invoices: Invoice[] = Array.from({ length: 10 }, () => {
  const vehicle = getRandomItem(vehicles);
  const customer = customers.find(c => c.id === vehicle.customer_id);
  return {
    id: generateId('invoice'),
    customer_id: vehicle.customer_id,
    vehicle_id: vehicle.id,
    date: getRandomDate(new Date(2023, 0, 1), new Date()),
    status: getRandomInvoiceStatus(),
    total_amount: getRandomAmount(100, 1000),
    discount: getRandomAmount(0, 50),
    tax: getRandomAmount(0, 50),
    notes: faker.lorem.paragraph(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    vehicleInfo: {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.license_plate,
    },
    customerInfo: {
      name: customer?.name || 'Unknown Customer',
      email: customer?.email || 'unknown@example.com',
      phone: customer?.phone || 'N/A',
    },
    items: [],
  };
});

// Mock data for parts
const parts: Part[] = Array.from({ length: 30 }, () => ({
  id: generateId('part'),
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  type: getRandomPartType(),
  price: getRandomAmount(10, 200),
  quantity: getRandomInteger(1, 10),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  invoice_ids: [generateId('invoice')],
}));

// Mock data for expenses
const expenses: Expense[] = Array.from({ length: 15 }, () => ({
  id: generateId('expense'),
  date: getRandomDate(new Date(2023, 0, 1), new Date()),
  category: getRandomExpenseCategory(),
  amount: getRandomAmount(10, 100),
  description: faker.lorem.sentence(),
  payment_method: getRandomPaymentMethod(),
  payment_status: getRandomItem(['pending', 'paid']),
  vendor_id: generateId('vendor'),
  vendor_name: faker.company.name(),
}));

// Mock data for attendance
const attendance: Attendance[] = Array.from({ length: 10 }, () => ({
  id: generateId('attendance'),
  mechanic_id: getRandomItem(mechanics).id,
  date: getRandomDate(new Date(2023, 0, 1), new Date()),
  check_in: faker.date.recent().toISOString(),
  check_out: faker.date.recent().toISOString(),
  status: getRandomAttendanceStatus(),
  notes: faker.lorem.sentence(),
  approved_by: generateId('user'),
  created_at: new Date().toISOString(),
}));

// Mock data for permissions
const permissions: Permission[] = [
  { id: generateId('permission'), name: 'view_dashboard', description: 'View dashboard' },
  { id: generateId('permission'), name: 'manage_users', description: 'Manage users' },
  { id: generateId('permission'), name: 'manage_customers', description: 'Manage customers' },
  { id: generateId('permission'), name: 'manage_vehicles', description: 'Manage vehicles' },
  { id: generateId('permission'), name: 'manage_invoices', description: 'Manage invoices' },
  { id: generateId('permission'), name: 'manage_tasks', description: 'Manage tasks' },
  { id: generateId('permission'), name: 'manage_mechanics', description: 'Manage mechanics' },
  { id: generateId('permission'), name: 'manage_parts', description: 'Manage parts' },
  { id: generateId('permission'), name: 'manage_expenses', description: 'Manage expenses' },
  { id: generateId('permission'), name: 'view_reports', description: 'View reports' },
];

// Mock data for organizations
const organizations: Organization[] = Array.from({ length: 5 }, () => ({
  id: generateId('organization'),
  name: faker.company.name(),
  type: getRandomOrganizationType(),
  address: faker.location.streetAddress(),
  phone: getRandomPhoneNumber(),
  email: faker.internet.email(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

// In-memory data store
let currentUsers = [...users];
let currentCustomers = [...customers];
let currentVehicles = [...vehicles];
let currentMechanics = [...mechanics];
let currentTasks = [...tasks];
let currentInvoices = [...invoices];
let currentParts = [...parts];
let currentExpenses = [...expenses];
let currentAttendance = [...attendance];
let currentPermissions = [...permissions];
let currentOrganizations = [...organizations];

// Function to get all users
export const getUsers = async (): Promise<User[]> => {
  return currentUsers;
};

// Function to get a user by ID
export const getUserById = async (id: string): Promise<User | undefined> => {
  return currentUsers.find(user => user.id === id);
};

// Function to create a new user
export const createUser = async (user: User): Promise<User> => {
  currentUsers = [...currentUsers, user];
  return user;
};

// Function to update an existing user
export const updateUser = async (user: User): Promise<void> => {
  currentUsers = currentUsers.map(u => u.id === user.id ? user : u);
};

// Function to delete a user
export const deleteUser = async (id: string): Promise<void> => {
  currentUsers = currentUsers.filter(user => user.id !== id);
};

// Function to get all customers
export const getCustomers = async (): Promise<Customer[]> => {
  return currentCustomers;
};

// Function to get a customer by ID
export const getCustomerById = async (id: string): Promise<Customer | undefined> => {
  return currentCustomers.find(customer => customer.id === id);
};

// Function to create a new customer
export const createCustomer = async (customer: Customer): Promise<Customer> => {
  currentCustomers = [...currentCustomers, customer];
  return customer;
};

// Function to update an existing customer
export const updateCustomer = async (customer: Customer): Promise<void> => {
  currentCustomers = currentCustomers.map(c => c.id === customer.id ? customer : c);
};

// Function to delete a customer
export const deleteCustomer = async (id: string): Promise<void> => {
  currentCustomers = currentCustomers.filter(customer => customer.id !== id);
};

// Function to get all vehicles
export const getVehicles = async (): Promise<Vehicle[]> => {
  return currentVehicles;
};

// Function to get vehicles by customer ID
export const getVehiclesByCustomerId = async (customerId: string): Promise<Vehicle[]> => {
  return currentVehicles.filter(vehicle => vehicle.customer_id === customerId);
};

// Function to create a new vehicle
export const createVehicle = async (vehicle: Vehicle): Promise<Vehicle> => {
  currentVehicles = [...currentVehicles, vehicle];
  return vehicle;
};

// Function to update an existing vehicle
export const updateVehicle = async (vehicle: Vehicle): Promise<void> => {
  currentVehicles = currentVehicles.map(v => v.id === vehicle.id ? vehicle : v);
};

// Function to delete a vehicle
export const deleteVehicle = async (id: string): Promise<void> => {
  currentVehicles = currentVehicles.filter(vehicle => vehicle.id !== id);
};

// Function to get all mechanics
export const getMechanics = async (): Promise<Mechanic[]> => {
  return currentMechanics;
};

// Function to get a mechanic by ID
export const getMechanicById = async (id: string): Promise<Mechanic | null> => {
  return mechanics.find(m => m.id === id) || null;
};

// Function to create a new mechanic
export const createMechanic = async (mechanic: Mechanic): Promise<Mechanic> => {
  currentMechanics = [...currentMechanics, mechanic];
  return mechanic;
};

// Function to update an existing mechanic
export const updateMechanic = async (mechanic: Mechanic): Promise<void> => {
  currentMechanics = currentMechanics.map(m => m.id === mechanic.id ? mechanic : m);
};

// Function to delete a mechanic
export const deleteMechanic = async (id: string): Promise<void> => {
  currentMechanics = currentMechanics.filter(mechanic => mechanic.id !== id);
};

// Function to get all tasks
export const getTasks = async (): Promise<Task[]> => {
  return currentTasks;
};

// Function to get a task by ID
export const getTaskById = async (id: string): Promise<Task | undefined> => {
  return currentTasks.find(task => task.id === id);
};

// Function to create a new task
export const createTask = async (task: Task): Promise<Task> => {
  currentTasks = [...currentTasks, task];
  return task;
};

// Function to update an existing task
export const updateTask = async (task: Task): Promise<void> => {
  currentTasks = currentTasks.map(t => t.id === task.id ? task : t);
};

// Function to delete a task
export const deleteTask = async (id: string): Promise<void> => {
  currentTasks = currentTasks.filter(task => task.id !== id);
};

// Function to get all invoices
export const getInvoices = async (): Promise<Invoice[]> => {
  return currentInvoices;
};

// Function to get an invoice by ID
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  return invoices.find(i => i.id === id) || null;
};

// Function to create a new invoice
export const createInvoice = async (invoice: Invoice): Promise<Invoice> => {
  currentInvoices = [...currentInvoices, invoice];
  return invoice;
};

// Function to update an existing invoice
export const updateInvoice = async (invoice: Invoice): Promise<void> => {
  currentInvoices = currentInvoices.map(i => i.id === invoice.id ? invoice : i);
};

// Function to delete an invoice
export const deleteInvoice = async (id: string): Promise<void> => {
  currentInvoices = currentInvoices.filter(invoice => invoice.id !== id);
};

// Function to get all parts
export const getParts = async (): Promise<Part[]> => {
  return currentParts;
};

// Function to get a part by ID
export const getPartById = async (id: string): Promise<Part | undefined> => {
  return currentParts.find(part => part.id === id);
};

// Function to create a new part
export const createPart = async (part: Part): Promise<Part> => {
  currentParts = [...currentParts, part];
  return part;
};

// Function to update an existing part
export const updatePart = async (part: Part): Promise<void> => {
  currentParts = currentParts.map(p => p.id === part.id ? part : p);
};

// Function to delete a part
export const deletePart = async (id: string): Promise<void> => {
  currentParts = currentParts.filter(part => part.id !== id);
};

// Function to get all expenses
export const getExpenses = async (): Promise<Expense[]> => {
  return currentExpenses;
};

// Function to get an expense by ID
export const getExpenseById = async (id: string): Promise<Expense | undefined> => {
  return currentExpenses.find(expense => expense.id === id);
};

// Function to create a new expense
export const createExpense = async (expense: Expense): Promise<Expense> => {
  currentExpenses = [...currentExpenses, expense];
  return expense;
};

// Function to update an existing expense
export const updateExpense = async (expense: Expense): Promise<void> => {
  currentExpenses = currentExpenses.map(e => e.id === expense.id ? expense : e);
};

// Function to delete an expense
export const deleteExpense = async (id: string): Promise<void> => {
  currentExpenses = currentExpenses.filter(expense => expense.id !== id);
};

// Function to get all attendance records
export const getAttendanceRecords = async (): Promise<Attendance[]> => {
  return currentAttendance;
};

// Function to get an attendance record by ID
export const getAttendanceRecordById = async (id: string): Promise<Attendance | undefined> => {
  return currentAttendance.find(attendance => attendance.id === id);
};

// Function to create a new attendance record
export const createAttendanceRecord = async (attendance: Attendance): Promise<Attendance> => {
  currentAttendance = [...currentAttendance, attendance];
  return attendance;
};

// Function to update an existing attendance record
export const updateAttendanceRecord = async (attendance: Attendance): Promise<void> => {
  currentAttendance = currentAttendance.map(a => a.id === attendance.id ? attendance : a);
};

// Function to delete an attendance record
export const deleteAttendanceRecord = async (id: string): Promise<void> => {
  currentAttendance = currentAttendance.filter(attendance => attendance.id !== id);
};

// Function to get all permissions
export const getPermissions = async (): Promise<Permission[]> => {
  return currentPermissions;
};

// Function to get a permission by ID
export const getPermissionById = async (id: string): Promise<Permission | undefined> => {
  return currentPermissions.find(permission => permission.id === id);
};

// Function to create a new permission
export const createPermission = async (permission: Permission): Promise<Permission> => {
  currentPermissions = [...currentPermissions, permission];
  return permission;
};

// Function to update an existing permission
export const updatePermission = async (permission: Permission): Promise<void> => {
  currentPermissions = currentPermissions.map(p => p.id === permission.id ? permission : p);
};

// Function to delete a permission
export const deletePermission = async (id: string): Promise<void> => {
  currentPermissions = currentPermissions.filter(permission => permission.id !== id);
};

// Function to get all organizations
export const getOrganizations = async (): Promise<Organization[]> => {
  return currentOrganizations;
};

// Function to get an organization by ID
export const getOrganizationById = async (id: string): Promise<Organization | undefined> => {
  return currentOrganizations.find(organization => organization.id === id);
};

// Function to create a new organization
export const createOrganization = async (organization: Organization): Promise<Organization> => {
  currentOrganizations = [...currentOrganizations, organization];
  return organization;
};

// Function to update an existing organization
export const updateOrganization = async (organization: Organization): Promise<void> => {
  currentOrganizations = currentOrganizations.map(o => o.id === organization.id ? organization : o);
};

// Function to delete an organization
export const deleteOrganization = async (id: string): Promise<void> => {
  currentOrganizations = currentOrganizations.filter(organization => organization.id !== id);
};

// Function to get the current user (mocked)
export const getCurrentUser = (): User => {
  // For now, return a default user
  return {
    id: 'user-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'owner',
    isActive: true,
    lastLogin: new Date().toISOString(),
  };
};

// Function to check if a user has a specific permission
export const hasPermission = (user: User | null, resource: keyof RolePermissionMap, action: string): boolean => {
  if (!user) {
    return false;
  }

  const rolePermissions: RolePermissionMap = {
    'dashboard': { 'view': true },
    'customers': { 'view': true, 'create': true, 'edit': true, 'delete': true, 'manage': user.role === 'owner' || user.role === 'manager' },
    'vehicles': { 'view': true, 'create': true, 'edit': true, 'delete': true, 'manage': user.role === 'owner' || user.role === 'manager' },
    'invoices': { 'view': true, 'create': true, 'edit': true, 'delete': true, 'manage': user.role === 'owner' || user.role === 'manager' },
    'tasks': { 'view': true, 'create': true, 'edit': true, 'delete': true, 'manage': user.role === 'owner' || user.role === 'manager' },
    'mechanics': { 'view': true, 'create': true, 'edit': true, 'delete': true, 'manage': user.role === 'owner' || user.role === 'manager' },
    'parts': { 'view': true, 'create': true, 'edit': true, 'delete': true, 'manage': user.role === 'owner' || user.role === 'manager' },
    'expenses': { 'view': true, 'create': true, 'edit': true, 'delete': true, 'manage': user.role === 'owner' || user.role === 'manager' },
    'reports': { 'view': true, 'create': true, 'edit': true, 'delete': true, 'manage': user.role === 'owner' || user.role === 'manager' },
    'settings': { 'view': true, 'create': true, 'edit': true, 'delete': true, 'manage': user.role === 'owner' || user.role === 'manager' },
    'users': { 'view': true, 'create': true, 'edit': true, 'delete': true, 'manage': user.role === 'owner' },
	'attendance': { 'view': true, 'create': true, 'edit': true, 'delete': true, 'manage': user.role === 'owner' || user.role === 'manager' },
  };

  return rolePermissions[resource]?.[action] || false;
};

// Add missing vehicle function
export const getVehicleById = async (vehicleId: string): Promise<Vehicle | null> => {
  return vehicles.find(v => v.id === vehicleId) || null;
};

// Export tasks and invoices arrays that were missing
export { tasks, invoices };

// Update part form to handle invoice_ids property correctly
export const updatePart = (updatedPart: Part) => {
  const index = parts.findIndex(p => p.id === updatedPart.id);
  if (index >= 0) {
    parts[index] = updatedPart;
  }
};
