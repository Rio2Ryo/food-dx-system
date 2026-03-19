// ============================================
// GOALS / WAKUWAKU TYPE DEFINITIONS
// ============================================

/**
 * Goal data structure matching Prisma schema
 */
export interface Goal {
  id: string;
  userId: string;
  title: string;
  content?: string | null;
  target?: Date | string | null;
  completed: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * WakuWaku moment (daily positive highlight)
 */
export interface WakuWakuMoment {
  id: string;
  userId: string;
  date: Date | string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Goal form state
 */
export interface GoalFormState {
  title: string;
  content: string;
  target: string;
}

/**
 * Filter options for goals
 */
export type GoalFilter = "all" | "active" | "completed";

/**
 * Get display status for a goal
 */
export function getGoalStatus(goal: Goal): "active" | "completed" {
  return goal.completed ? "completed" : "active";
}

/**
 * Get status badge color class
 */
export function getStatusBadgeClass(status: "active" | "completed"): string {
  return status === "completed"
    ? "bg-emerald-100 text-emerald-700 ring-emerald-600/20"
    : "bg-amber-100 text-amber-700 ring-amber-600/20";
}

/**
 * Get status badge text
 */
export function getStatusBadgeText(status: "active" | "completed"): string {
  return status === "completed" ? "Completed" : "Active";
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Check if a goal is overdue
 */
export function isOverdue(goal: Goal): boolean {
  if (!goal.target || goal.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(goal.target);
  target.setHours(0, 0, 0, 0);
  return target < today;
}

/**
 * Get overdue badge class
 */
export function getOverdueBadgeClass(): string {
  return "bg-rose-100 text-rose-700 ring-rose-600/20";
}
