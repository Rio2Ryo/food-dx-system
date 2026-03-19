"use client";

import { useState } from "react";
import { Goal, formatDate } from "@/types/goals";
import { createGoal, updateGoal } from "@/lib/goal-actions";

/**
 * WakuWakuEntry - Individual wakuwaku moment display
 */
export function WakuWakuEntry({
  entry,
  onToggle,
  onDelete,
}: {
  entry: Goal;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(entry.content || entry.title);

  const handleSave = async () => {
    if (!content.trim()) return;
    try {
      await updateGoal(entry.id, {
        content: content.trim(),
        title: content.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update wakuwaku:", error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Delete this wakuwaku moment?")) {
      try {
        await onDelete(entry.id);
      } catch (error) {
        console.error("Failed to delete wakuwaku:", error);
      }
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-pink-200 bg-pink-50/50 p-5 transition-all hover:shadow-md">
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border border-pink-300 bg-white p-3 text-slate-900 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            rows={3}
            placeholder="What made you happy today?"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-base text-slate-800">{entry.content || entry.title}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-pink-100 hover:text-pink-600"
                title="Edit"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-pink-100 hover:text-pink-600"
                title="Delete"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-pink-500">
              {formatDate(entry.createdAt)}
            </span>
            <button
              onClick={() => onToggle(entry.id)}
              className={`
                flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors
                ${entry.isCompleted
                  ? "bg-pink-100 text-pink-700"
                  : "bg-pink-50 text-pink-600 hover:bg-pink-100"
                }
              `}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {entry.isCompleted ? "Saved" : "Save to WakuWaku"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * WakuWakuSection - Display daily wakuwaku moments
 */
export function WakuWakuSection({
  wakuWakuMoments,
  onToggle,
  onDelete,
}: {
  wakuWakuMoments: Goal[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState("");

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    try {
      await createGoal({
        userId: "current-user-id",
        title: newContent.trim(),
        content: newContent.trim(),
        targetDate: null,
      });
      setNewContent("");
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add wakuwaku:", error);
    }
  };

  if (wakuWakuMoments.length === 0 && !showAddForm) {
    return (
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
          <svg className="h-8 w-8 text-pink-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Your WakuWaku Moments</h3>
        <p className="mt-1 text-sm text-slate-600">
          Capture daily highlights that bring you joy
        </p>
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
        >
          Add Your First Moment
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">WakuWaku Moments</h3>
          <p className="text-sm text-slate-500">Daily highlights that light up your day</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-lg border border-pink-300 bg-white px-3 py-1.5 text-sm font-medium text-pink-600 hover:bg-pink-50"
        >
          {showAddForm ? "Cancel" : "Add New"}
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-xl border border-pink-200 bg-white p-4 shadow-sm">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="What made you happy today? Share a moment of joy..."
            rows={3}
            className="w-full rounded-lg border border-pink-300 bg-pink-50/50 p-3 text-slate-900 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleAdd}
              disabled={!newContent.trim()}
              className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to WakuWaku
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {wakuWakuMoments.map((entry) => (
          <WakuWakuEntry
            key={entry.id}
            entry={entry}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * WakuWakuQuote - Inspirational quote section
 */
export function WakuWakuQuote() {
  const quotes = [
    "Happiness is not something ready-made. It comes from your own actions.",
    "The smallest moment of joy can light up your entire day.",
    "Celebrate small victories - they lead to big successes.",
    "Today is a gift, that's why they call it the present.",
    "Your happiness is your greatest achievement.",
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white shadow-lg">
      <svg className="mb-3 h-8 w-8 opacity-20" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
      </svg>
      <blockquote className="text-lg font-medium leading-relaxed">
        "{randomQuote}"
      </blockquote>
      <footer className="mt-3 text-sm text-amber-100">— 食品流通システム</footer>
    </div>
  );
}
