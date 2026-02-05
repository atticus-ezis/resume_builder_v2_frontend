/**
 * Formats an ISO 8601 date string to a readable format.
 * @param dateString - ISO 8601 date string (e.g., "2026-02-05T05:28:41.337Z")
 * @returns Formatted date string (e.g., "Feb 5, 2026")
 */
export function DateFormatter(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
