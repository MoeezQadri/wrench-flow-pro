
/**
 * A utility function to safely resolve a promise and set it to a state variable
 * Prevents common errors when directly assigning promises to state
 */
export async function resolvePromiseAndSetState<T>(
  promise: Promise<T>,
  setState: React.Dispatch<React.SetStateAction<T>>
): Promise<void> {
  try {
    const result = await promise;
    setState(result);
  } catch (error) {
    console.error("Error resolving promise:", error);
    // You can handle the error here or re-throw if needed
    throw error;
  }
}

/**
 * A utility function to download data as CSV
 */
export const downloadAsCSV = (data: any[], filename: string): void => {
  // Convert data to CSV format
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        // Handle values that might contain commas
        const value = row[header] !== undefined && row[header] !== null ? row[header] : '';
        const stringValue = typeof value === 'string' ? value : String(value);
        const escapedValue = stringValue.replace(/"/g, '""');
        return `"${escapedValue}"`;
      }).join(',')
    )
  ];
  
  // Create CSV string
  const csvString = csvRows.join('\r\n');
  
  // Create download link
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link); // Required for Firefox
  link.click();
  document.body.removeChild(link);
};
