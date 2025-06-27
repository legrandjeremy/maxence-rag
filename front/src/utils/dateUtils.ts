
import { date } from 'quasar'

export function formatDate(dateValue: string | null): string {
  if (!dateValue) {
    return ''
  }
  return date.formatDate(dateValue, "DD/MM/YYYY")
}

export function formatDateForDisplay(dateValue: string | null): string {
  if (!dateValue) {
    return ''
  }
  return date.formatDate(dateValue, "DD/MM/YYYY")
}

export function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return new Date().toISOString().substring(0, 10)
  try {
    // First check if it's already in YYYY-MM-DD format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}/
    if (isoDateRegex.test(dateString)) {
      return dateString.substring(0, 10)
    }

    // Check if the date is in DD/MM/YYYY format (as returned by formatDate())
    const dateParts = dateString.split('/')
    if (dateParts.length === 3 && dateParts[0] && dateParts[1] && dateParts[2]) {
      // Convert from DD/MM/YYYY to YYYY-MM-DD
      const day = dateParts[0]
      const month = dateParts[1]
      const year = dateParts[2]
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    // Try parsing as a Date object (might handle different formats)
    const dateObj = new Date(dateString)
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().substring(0, 10)
    }

    console.log('Unable to parse date:', dateString)
    return new Date().toISOString().substring(0, 10)
  } catch (error) {
    console.error('Error formatting date for input:', error)
    return new Date().toISOString().substring(0, 10)
  }
}

export function formatDateToIso(dateString: string | undefined | null): string {
  if (!dateString) return ''
  const dateObj = new Date(dateString)
  return dateObj.toISOString()
}
