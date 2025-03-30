/**
 * Formats a Date object as an ISO string
 * @param date The date to format
 * @returns The formatted date string
 */
export function formatIsoDate(date: Date): string {
  return date.toISOString();
}

/**
 * Parses an ISO date string into a Date object
 * @param dateString The date string to parse
 * @returns The parsed Date object
 */
export function parseIsoDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Converts a Date object to a timestamp (milliseconds since the Unix epoch)
 * @param date The date to convert
 * @returns The timestamp
 */
export function dateToTimestamp(date: Date): number {
  return date.getTime();
}

/**
 * Converts a timestamp (milliseconds since the Unix epoch) to a Date object
 * @param timestamp The timestamp to convert
 * @returns The Date object
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp);
}
