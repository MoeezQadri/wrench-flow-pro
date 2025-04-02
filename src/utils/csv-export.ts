
/**
 * Converts an array of objects to CSV format
 */
export const objectsToCSV = <T extends Record<string, any>>(data: T[]): string => {
  if (data.length === 0) {
    return '';
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return headers.map(header => {
      // Handle values that might contain commas or quotes
      const value = item[header] === null || item[header] === undefined 
        ? '' 
        : String(item[header]);
        
      // Escape quotes and wrap in quotes if contains comma, newline or quote
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Triggers a file download with the given content
 */
export const downloadCSV = (content: string, filename: string): void => {
  // Create a blob with the CSV content
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download URL
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element to trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  
  // Append the link to the body
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Formats a value for CSV export
 * Handles different data types appropriately
 */
export const formatValueForCSV = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toISOString();
    }
    // Convert objects to JSON strings
    return JSON.stringify(value);
  }
  
  return String(value);
};

/**
 * Enhanced CSV export with additional options
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[], 
  filename: string,
  options?: {
    headers?: string[];
    headerMap?: Record<string, string>;
    formatter?: (item: T) => Record<string, any>;
  }
): void => {
  if (data.length === 0) {
    return;
  }
  
  let exportData = data;
  
  // Apply custom formatter if provided
  if (options?.formatter) {
    exportData = data.map(options.formatter) as T[];
  }
  
  // Determine headers
  let headers = options?.headers || Object.keys(exportData[0]);
  
  // Create header row with mapped names if provided
  const headerRow = headers.map(header => {
    if (options?.headerMap && options.headerMap[header]) {
      return options.headerMap[header];
    }
    return header;
  }).join(',');
  
  // Create data rows
  const rows = exportData.map(item => {
    return headers.map(header => {
      const value = formatValueForCSV(item[header]);
      
      // Escape quotes and wrap in quotes if contains comma, newline or quote
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  // Combine header and rows
  const csvContent = [headerRow, ...rows].join('\n');
  
  // Download the CSV
  downloadCSV(csvContent, filename);
};
