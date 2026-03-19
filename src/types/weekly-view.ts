// ============================================
// WEEKLY VIEW TYPE DEFINITIONS
// ============================================

/**
 * Day of week mapping
 * Matches Entry.dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
 */
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export type DayOfWeek = typeof DAY_NAMES[number];

/**
 * Display day names (Japanese, Monday-start for UI)
 */
export const DISPLAY_DAY_NAMES = ["月", "火", "水", "木", "金", "土", "日"] as const;
export type DisplayDay = typeof DISPLAY_DAY_NAMES[number];

/**
 * Get display day name from numeric day (0=Sunday)
 */
export function getDisplayDayName(dayIndex: number): string {
  // Convert 0=Sunday to Monday-start index
  const mondayStartIndex = (dayIndex + 6) % 7;
  return DISPLAY_DAY_NAMES[mondayStartIndex];
}

/**
 * Get full day name from numeric day (0=Sunday)
 */
export function getFullDayName(dayIndex: number): string {
  return DAY_NAMES[dayIndex];
}

/**
 * Entry data structure matching Prisma schema
 */
export interface WeeklyEntry {
  id: string;
  userId: string;
  year: number;
  week: number;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  hour: number; // 0-23
  content?: string | null;
  isCompleted: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  images?: EntryImage[];
}

/**
 * Image associated with an entry
 */
export interface EntryImage {
  id: string;
  entryId: string;
  imageUrl: string;
  sortOrder: number;
  createdAt: string | Date;
}

/**
 * Entry data for creating/updating (without id and timestamps)
 */
export interface EntryInput {
  userId: string;
  year: number;
  week: number;
  dayOfWeek: number;
  hour: number;
  content?: string | null;
  isCompleted: boolean;
}

/**
 * Time slot data structure for UI rendering
 */
export interface TimeSlot {
  dayIndex: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  entry?: WeeklyEntry;
}

/**
 * Week navigation state
 */
export interface WeekNavigation {
  currentYear: number;
  currentWeek: number;
  previousWeek: { year: number; week: number };
  nextWeek: { year: number; week: number };
}

/**
 * Calculate ISO week and year for a given date
 */
export function getISOWeekInfo(date: Date): { year: number; week: number } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getFullYear(), week: weekNum };
}

/**
 * Get dates for a given ISO week
 */
export function getWeekDates(year: number, week: number): Date[] {
  const dates: Date[] = [];
  // Find January 4th (always in week 1)
  const jan4 = new Date(year, 0, 4);
  // Find first Monday of the year
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - jan4.getDay() + 1);
  if (firstMonday.getDay() === 0) {
    firstMonday.setDate(firstMonday.getDate() - 7);
  }
  // Add days for the requested week
  for (let i = 0; i < 7; i++) {
    const date = new Date(firstMonday);
    date.setDate(firstMonday.getDate() + (i + (week - 1) * 7));
    dates.push(date);
  }
  return dates;
}

/**
 * Generate all time slots for a week (7 days x 24 hours)
 */
export function generateWeekSlots(
  year: number,
  week: number,
  entries: WeeklyEntry[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Create slots for Monday-Sunday (indices 1-6, then 0)
  const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday
  
  for (const dayIndex of dayOrder) {
    for (let hour = 0; hour < 24; hour++) {
      const entry = entries.find(
        (e) => e.year === year && e.week === week && e.dayOfWeek === dayIndex && e.hour === hour
      );
      slots.push({ dayIndex, hour, entry });
    }
  }
  
  return slots;
}

/**
 * Format hour for display (12-hour format with AM/PM)
 */
export function formatHourDisplay(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour === 12) return "12:00 PM";
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

/**
 * Format time slot label (e.g., "Mon 09:00")
 */
export function formatTimeSlotLabel(dayIndex: number, hour: number): string {
  const dayName = getDisplayDayName(dayIndex);
  const timeStr = hour.toString().padStart(2, "0") + ":00";
  return `${dayName} ${timeStr}`;
}
