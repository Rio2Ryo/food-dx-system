"use client";

import { useState } from "react";
import { createGoal, updateGoal } from "@/lib/goal-actions";

/**
 * GoalForm - Component for adding and editing goals
 */
export function GoalForm({
  initialData,
  onCancel,
  onSuccess,
}: {
  initialData?: {
    title: string;
    content?: string;
    targetDate?: string;
  };
  onCancel?: () => void;
  onSuccess?: (goal: { id: string }) => void;
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [targetDate, setTargetDate] = useState(initialData?.targetDate || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please enter a goal title");
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialData) {
        // Edit existing goal
        await updateGoal(initialData.title, {
          title: title.trim(),
          content: content.trim() || null,
          targetDate: targetDate || null,
        });
      } else {
        // Create new goal
        const result = await createGoal({
          userId: "current-user-id", // In real app, get from auth context
          title: title.trim(),
          content: content.trim() || null,
          targetDate: targetDate || null,
        });
        onSuccess?.({ id: result.id });
      }
    } catch (err) {
      setError("Failed to save goal. Please try again.");
      console.error("GoalForm error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title Input */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Goal Title *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Read 12 books this year"
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          required
        />
      </div>

      {/* Content Input (Optional) */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-slate-700">
          Description (Optional)
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add details about your goal..."
          rows={3}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {/* Target Date Input (Optional) */}
      <div>
        <label htmlFor="targetDate" className="block text-sm font-medium text-slate-700">
          Target Date (Optional)
        </label>
        <input
          type="date"
          id="targetDate"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          Set a deadline to track your progress
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : initialData ? (
            "Update Goal"
          ) : (
            "Create Goal"
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/**
 * AddGoalButton - Floating action button for adding new goals
 */
export function AddGoalButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full bg-amber-500 p-4 text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 hover:shadow-amber-500/40 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
      aria-label="Add new goal"
    >
      <svg className="h-6 w-6 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>
  );
}
