/**
 * Helper function to filter rows by a search term
 * @param rows The array of data rows to filter
 * @param searchText The search text to filter by
 * @returns Filtered array of rows that match the search text
 */
export function filterRowsBySearchText<T extends Record<string, unknown>>(rows: T[], searchText: string): T[] {
  if (!searchText) {
    return rows;
  }
  
  const searchLower = searchText.toLowerCase();
  return rows.filter(row => {
    return Object.values(row).some(value => {
      if (value === null || value === undefined) {
        return false;
      }
      
      // Convert value to searchable string based on type
      let stringValue: string = '';
      if (typeof value === 'string') {
        stringValue = value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        stringValue = String(value);
      } else if (value instanceof Date) {
        stringValue = value.toISOString();
      } else if (Array.isArray(value)) {
        // If it's an array, join its primitive values
        stringValue = value
          .filter(item => item !== null && item !== undefined)
          .map(item => typeof item === 'object' ? '' : String(item))
          .join(' ');
      } else if (typeof value === 'object') {
        // Skip objects that don't have a useful string representation
        return false;
      }
      
      return stringValue.toLowerCase().includes(searchLower);
    });
  });
} 