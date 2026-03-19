"use client";

import { useState } from "react";
import { WeeklyEntry, EntryImage } from "@/types/weekly-view";
import { EntryData } from "@/types/sharing";

/**
 * ShareEntryView - Component for viewing shared entries
 * Displays entry data, images, and like count
 * No user contact information is shown
 */
export function ShareEntryView({
  entryId,
  sharedById,
  sharedByName,
  sharedByAvatarUrl,
  viewCount,
  expiresAt,
  entry,
  images,
  likeCount,
}: {
  entryId: string;
  sharedById: string;
  sharedByName?: string;
  sharedByAvatarUrl?: string | null;
  viewCount: number;
  expiresAt: string | null;
  entry: EntryData;
  images: EntryImage[];
  likeCount: number;
}) {
  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      const response = await fetch(`/api/shared-entries/${entryId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entryId }),
      });

      const data = await response.json() as { likeCount: number; userHasLiked: boolean };

      if (response.ok) {
        setCurrentLikeCount(data.likeCount);
        setUserHasLiked(data.userHasLiked);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  // Format day of week
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[entry.dayOfWeek];

  // Format hour
  const formatHour = (hour: number) => {
    if (hour === 0) return "12:00 AM";
    if (hour === 12) return "12:00 PM";
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              <span className="text-lg font-semibold text-slate-900">Shared Entry</span>
            </div>
            {expiresAt && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                Expires: {new Date(expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Entry Info */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {dayNames[entry.dayOfWeek]}, {entry.year}-W{entry.week.toString().padStart(2, "0")}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {formatHour(entry.hour)} • Week {entry.week}
              </p>
            </div>
            {entry.isCompleted && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Completed
              </span>
            )}
          </div>

          {/* Content */}
          {entry.content && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <p className="text-slate-700">{entry.content}</p>
            </div>
          )}
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Images</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative overflow-hidden rounded-xl bg-white shadow-sm"
                >
                  <img
                    src={image.imageUrl}
                    alt={`Entry image ${image.sortOrder + 1}`}
                    className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-xs text-white">Image {image.sortOrder + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Like Section */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`
                  flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
                  ${userHasLiked
                    ? "bg-pink-600 text-white hover:bg-pink-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <svg
                  className={`h-5 w-5 ${userHasLiked ? "fill-current" : ""}`}
                  fill={userHasLiked ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
                <span>{currentLikeCount} likes</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{viewCount} views</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-slate-200 pt-6 text-center">
          <p className="text-sm text-slate-500">
            Shared by {sharedByName || "User"}
            {sharedByAvatarUrl && (
              <span className="ml-2 inline-block h-6 w-6 overflow-hidden rounded-full bg-slate-200">
                <img
                  src={sharedByAvatarUrl}
                  alt={sharedByName || "User"}
                  className="h-full w-full object-cover"
                />
              </span>
            )}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {expiresAt
              ? `This link will expire on ${new Date(expiresAt).toLocaleDateString()}`
              : "This link does not expire"}
          </p>
        </div>
      </main>
    </div>
  );
}
