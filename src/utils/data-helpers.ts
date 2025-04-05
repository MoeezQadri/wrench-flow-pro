
import { 
  Customer, 
  Vehicle, 
  Mechanic, 
  Invoice,
  Task
} from '@/types';

/**
 * Helper functions for working with data objects and processing async data
 */

// Function to safely await a promise and handle errors
export async function safeAwait<T>(promise: Promise<T>): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error as Error];
  }
}

// Function to safely get customer name from customer object or promise
export function getCustomerName(customer: Customer | Promise<Customer | null> | null): string {
  if (!customer) return 'Unknown Customer';
  if (customer instanceof Promise) return 'Loading...';
  return customer.name || 'Unnamed Customer';
}

// Function to safely get vehicle info from vehicle object or promise
export function getVehicleInfo(vehicle: Vehicle | Promise<Vehicle | null> | null): string {
  if (!vehicle) return 'Unknown Vehicle';
  if (vehicle instanceof Promise) return 'Loading...';
  return `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
}

// Function to safely get mechanic name from mechanic object or promise
export function getMechanicName(mechanic: Mechanic | Promise<Mechanic | null> | null): string {
  if (!mechanic) return 'Unassigned';
  if (mechanic instanceof Promise) return 'Loading...';
  return mechanic.name || 'Unnamed Mechanic';
}

// Function to format date strings consistently
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

// Function to format currency values
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

// Function to safely filter and map arrays that might be promises
export async function processAsyncArray<T, R>(
  promiseOrArray: Promise<T[]> | T[],
  mapFn: (item: T) => R,
  filterFn?: (item: T) => boolean
): Promise<R[]> {
  let array: T[];
  
  if (promiseOrArray instanceof Promise) {
    array = await promiseOrArray;
  } else {
    array = promiseOrArray;
  }
  
  if (filterFn) {
    array = array.filter(filterFn);
  }
  
  return array.map(mapFn);
}
