
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Helper to check if a column exists in a table
 */
export async function columnExists(table: string, column: string): Promise<boolean> {
  try {
    // Using custom RPC function we just created
    const { data, error } = await supabase
      .rpc('column_exists', { p_table_name: table, p_column_name: column });
    
    if (error) {
      console.error('Error checking if column exists:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in columnExists:', error);
    return false;
  }
}

/**
 * Run any needed migrations to ensure the database is up to date
 */
export async function runMigrations() {
  try {
    // Check if invoices table has due_date column
    const hasDueDate = await columnExists('invoices', 'due_date');
    
    if (!hasDueDate) {
      // Add due_date column to invoices table
      const { error } = await supabase.rpc('add_column_if_not_exists', {
        p_table_name: 'invoices',
        p_column_name: 'due_date',
        p_column_type: 'timestamp with time zone'
      });
      
      if (error) {
        console.error('Error adding due_date column:', error);
        toast.error('Failed to update database schema');
      } else {
        console.log('Added due_date column to invoices table');
      }
    }
    
    // Add more migration checks here as needed
    
  } catch (error) {
    console.error('Error running migrations:', error);
  }
}
