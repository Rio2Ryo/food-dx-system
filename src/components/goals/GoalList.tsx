"use client";

import { useState } from "react";
import { Goal, getGoalStatus, getStatusBadgeClass, getStatusBadgeText, formatDate, isOverdue, getOverdueBadgeClass } from "@/types/goals";
import { toggleGoalCompletion, deleteGoal } from "@/lib/goal-actions";
import { GoalForm } from "./GoalForm";

/**
 * GoalItem - Individual goal display component
 */
export function GoalItem({
  goal,
  onToggle,
  onDelete,
  onEdit,
}: {
  goal: Goal;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (goal: Goal) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const handleToggle = async () => {
    try {
      await onToggle(goal.id);
    } catch (error) {
      console.error("Failed to toggle goal:", error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this goal?")) {
      try {
        await onDelete(goal.id);
      } catch (error) {
        console.error("Failed to delete goal:", error);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSuccess = () => {
    setIsEditing(false);
  };

  const status = getGoalStatus(goal);
  const overdue = isOverdue(goal);

  return (
    <div
      className={`
        group relative overflow-hidden rounded-xl border transition-all duration-300
        ${status === "completed"
          ? "border-emerald-200 bg-emerald-50/30"
          : overdue
            ? "border-rose-200 bg-rose-50/30"
            : "border-amber-200 bg-white hover:shadow-md"
        }
      `}
    >
      {/* Editing Mode */}
      {isEditing ? (
        <div className="p-6">
          <GoalForm
            initialData={{
              title: goal.title,
              content: goal.content || undefined,
              target: goal.target ? (typeof goal.target === "string" ? goal.target : goal.target.toISOString().split("T")[0]) : undefined,
            }}
            onCancel={handleCancelEdit}
            onSuccess={handleSuccess}
          />
        </div>
      ) : (
        /* View Mode */
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          {/* Header: Title and Badges */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`
                    text-lg font-semibold transition-all duration-300
                    ${status === "completed" ? "text-emerald-900 line-through opacity-70" : "text-slate-900"}
                  `}
                >
                  {goal.title}
                </h3>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(status)}`}>
                  {getStatusBadgeText(status)}
                </span>
                {overdue && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getOverdueBadgeClass()}`}>
                    Overdue
                  </span>
                )}
              </div>

              {/* Description */}
              {goal.content && (
                <p className="mt-2 text-sm text-slate-600">{goal.content}</p>
              )}

              {/* Target Date */}
              {goal.target && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span>
                    Target: {formatDate(goal.target)}
                    {overdue && " (Overdue)"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer: Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              {/* Toggle Complete Button */}
              <button
                onClick={handleToggle}
                className={`
                  flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all
                  ${status === "completed"
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }
                `}
              >
                {status === "completed" ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Completed
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mark Complete
                  </>
                )}
              </button>

              {/* Edit Button */}
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit
              </button>
            </div>

            {/* Delete Button */}
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * GoalList - Main list component for displaying goals
 */
export function GoalList({
  goals,
  onToggle,
  onDelete,
  onEdit,
}: {
  goals: Goal[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (goal: Goal) => void;
}) {
  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-amber-50 p-6">
          <svg className="h-16 w-16 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800">No goals yet</h3>
        <p className="mt-1 text-sm text-slate-500">
          Start by creating your first goal!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <GoalItem
          key={goal.id}
          goal={goal}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

/**
 * GoalStats - Display goal statistics
 */
export function GoalStats({ goals }: { goals: Goal[] }) {
  const total = goals.length;
  const completed = goals.filter((g) => g.completed).length;
  const active = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium text-slate-500">Total</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{total}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium text-slate-500">Active</p>
        <p className="mt-1 text-2xl font-bold text-amber-600">{active}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium text-slate-500">Completed</p>
        <p className="mt-1 text-2xl font-bold text-emerald-600">{completed}</p>
      </div>
      <div className="hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:block">
        <p className="text-xs font-medium text-slate-500">Completion</p>
        <p className="mt-1 text-2xl font-bold text-indigo-600">{completionRate}%</p>
      </div>
    </div>
  );
}
