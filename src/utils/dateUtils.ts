import {
  addMonths,
  endOfMonth,
  startOfDay,
  differenceInDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  getDate,
} from "date-fns";

/**
 * Calculates the end date of a membership given a start date and duration in months.
 * Uses calendar-aware month addition:
 * - 01 Oct + 1 month = 31 Oct (end of Oct)
 * - 01 Oct + 3 months = 31 Dec
 * - 01 Oct + 6 months = 31 Mar
 * - 01 Oct + 12 months = 30 Sep (next year)
 */
export function calculateEndDate(
  startDate: Date,
  durationMonths: number,
): Date {
  // The end date is the last day of the month before the next due date
  // If start is the 1st, end should be last day of the previous month
  // e.g., start = Oct 1, duration = 1 month → end = Oct 31
  const lastDay = endOfMonth(addMonths(startDate, durationMonths - 1));
  // But if the start date is NOT the 1st, we calculate differently
  if (getDate(startDate) === 1) {
    return lastDay;
  }
  // For mid-month starts: add durationMonths and subtract 1 day
  const rawEnd = addMonths(startDate, durationMonths);
  const dayBefore = new Date(rawEnd);
  dayBefore.setDate(dayBefore.getDate() - 1);
  return dayBefore;
}

/**
 * Calculates the next due date after a membership ends.
 * This is the day after the end date.
 */
export function calculateNextDueDate(endDate: Date): Date {
  const nextDue = new Date(endDate);
  nextDue.setDate(nextDue.getDate() + 1);
  return startOfDay(nextDue);
}

/**
 * Determines membership status based on current date and due date.
 */
export function getMembershipStatus(
  endDate: Date,
  nextDueDate: Date,
  currentDate: Date = new Date(),
): "active" | "due_soon" | "due_today" | "overdue" | "expired" {
  const today = startOfDay(currentDate);
  const end = startOfDay(endDate);
  const due = startOfDay(nextDueDate);

  if (isSameDay(today, due)) return "due_today";
  if (isAfter(today, end) && isAfter(today, due)) return "overdue";

  const daysUntilDue = differenceInDays(due, today);
  if (daysUntilDue <= 3 && daysUntilDue > 0) return "due_soon";
  if (isBefore(today, end) || isSameDay(today, end)) return "active";

  return "expired";
}

/**
 * Returns the number of days until or after the due date.
 * Positive = days until due. Negative = days overdue.
 */
export function getDaysRelativeToDue(
  nextDueDate: Date,
  currentDate: Date = new Date(),
): number {
  return differenceInDays(startOfDay(nextDueDate), startOfDay(currentDate));
}

/**
 * Formats a date or ISO string for display.
 */
export function formatDate(
  date: Date | string,
  pattern: string = "dd MMM yyyy",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, pattern);
}

/**
 * Formats a date/ISO string/null for display (replaces formatTimestamp).
 */
export function formatTimestamp(
  ts: Date | string | null | undefined,
  pattern: string = "dd MMM yyyy",
): string {
  if (!ts) return "—";
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return format(d, pattern);
}

/**
 * Converts an ISO string to a Date.
 */
export function toDate(ts: string | Date): Date {
  return typeof ts === "string" ? new Date(ts) : ts;
}

/**
 * Formats currency amount in Indian Rupees.
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Formats amount in lakhs format (e.g., ₹8.42L).
 */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

/**
 * Gets a human-readable status label.
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "ACTIVE",
    due_soon: "DUE SOON",
    due_today: "DUE TODAY",
    overdue: "OVERDUE",
    expired: "EXPIRED",
    inactive: "INACTIVE",
    paused: "PAUSED",
    success: "PAID",
    pending: "PENDING",
    failed: "FAILED",
    refunded: "REFUNDED",
    created: "CREATED",
    submitted: "SUBMITTED",
    verified: "VERIFIED",
    rejected: "REJECTED",
  };
  return labels[status] || status.toUpperCase();
}

/**
 * Gets the color class for a status.
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "text-green-500 bg-green-500/10 border-green-500/20",
    due_soon: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    due_today: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    overdue: "text-red-500 bg-red-500/10 border-red-500/20",
    expired: "text-gray-500 bg-gray-500/10 border-gray-500/20",
    inactive: "text-gray-500 bg-gray-500/10 border-gray-500/20",
    paused: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    success: "text-green-500 bg-green-500/10 border-green-500/20",
    paid: "text-green-500 bg-green-500/10 border-green-500/20",
    pending: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    failed: "text-red-500 bg-red-500/10 border-red-500/20",
    refunded: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    submitted: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    verified: "text-green-500 bg-green-500/10 border-green-500/20",
    rejected: "text-red-500 bg-red-500/10 border-red-500/20",
  };
  return colors[status] || "text-white/50 bg-white/5 border-white/10";
}
