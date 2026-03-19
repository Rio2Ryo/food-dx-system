"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { WeeklyEntry, getISOWeekInfo, getWeekDates, generateWeekSlots, formatTimeSlotLabel } from "@/types/weekly-view";
import { TimeSlot as TimeSlotComponent, EmptyState } from "./TimeSlot";

/**
 * WeeklyView - Main 24h vertical weekly calendar component
 * Displays 7 days (Monday-Sunday) side by side with 24 time slots each
 */
export function WeeklyView({
  entries,
  onEntryCreate,
  onEntryUpdate,
  onEntryDelete,
}: {
  entries: WeeklyEntry[];
  onEntryCreate: (entry: Omit<WeeklyEntry, "id" | "createdAt" | "updatedAt">) => Promise<WeeklyEntry>;
  onEntryUpdate: (entryId: string, updates: Partial<WeeklyEntry>) => Promise<void>;
  onEntryDelete: (entryId: string) => Promise<void>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Parse week/year from URL params or use current week
  const { year: currentYear, week: currentWeek } = useMemo(() => {
    const year = searchParams?.get("year");
    const week = searchParams?.get("week");
    
    if (year && week) {
      return { year: parseInt(year, 10), week: parseInt(week, 10) };
    }
    
    return getISOWeekInfo(currentDate);
  }, [currentDate, searchParams]);

  // Generate all time slots for the week
  const weekSlots = useMemo(() => {
    return generateWeekSlots(currentYear, currentWeek, entries);
  }, [currentYear, currentWeek, entries]);

  // Get week dates for headers (Monday-Sunday display)
  const weekDates = useMemo(() => {
    const dates = getWeekDates(currentYear, currentWeek);
    // Convert to Monday-start order for display
    // dates[0] is Sunday, so we rotate: [1,2,3,4,5,6,0]
    return [dates[1], dates[2], dates[3], dates[4], dates[5], dates[6], dates[0]];
  }, [currentYear, currentWeek]);

  // Navigation handlers
  const goToPreviousWeek = () => {
    const prevDate = new Date(weekDates[0]);
    prevDate.setDate(prevDate.getDate() - 7);
    const { year, week } = getISOWeekInfo(prevDate);
    setCurrentDate(prevDate);
    router.push(`?year=${year}&week=${week}`);
  };

  const goToNextWeek = () => {
    const nextDate = new Date(weekDates[0]);
    nextDate.setDate(nextDate.getDate() + 7);
    const { year, week } = getISOWeekInfo(nextDate);
    setCurrentDate(nextDate);
    router.push(`?year=${year}&week=${week}`);
  };

  const goToToday = () => {
    const today = new Date();
    const { year, week } = getISOWeekInfo(today);
    setCurrentDate(today);
    router.push(`?year=${year}&week=${week}`);
  };

  // Entry handlers
  const handleAddEntry = async (dayIndex: number, hour: number) => {
    const newEntry: Omit<WeeklyEntry, "id" | "createdAt" | "updatedAt"> = {
      userId: "current-user-id", // In real app, get from auth context
      year: currentYear,
      week: currentWeek,
      dayOfWeek: dayIndex,
      hour: hour,
      content: "",
      isCompleted: false,
    };

    try {
      await onEntryCreate(newEntry);
    } catch (error) {
      console.error("Failed to create entry:", error);
    }
  };

  const handleUpdateEntry = async (entryId: string, updates: Partial<WeeklyEntry>) => {
    try {
      await onEntryUpdate(entryId, updates);
    } catch (error) {
      console.error("Failed to update entry:", error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      await onEntryDelete(entryId);
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  // Check if week has any entries
  const hasEntries = weekSlots.some((slot) => slot.entry);

  return (
    <div className="flex h-full flex-col">
      {/* ─── Header: Week Navigation ───────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Weekly View</h1>
          <p className="text-sm text-slate-500">
            {currentYear} Week {currentWeek}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            aria-label="Previous week"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          <button
            onClick={goToToday}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Today
          </button>
          
          <button
            onClick={goToNextWeek}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            aria-label="Next week"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Week Header: Day Names ────────────────────────────────────── */}
      <div className="mb-2 grid grid-cols-8 gap-2">
        <div className="col-span-1 px-2 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Time
        </div>
        {weekDates.map((date, i) => {
          const dayIndex = date.getDay(); // 0=Sunday
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={i}
              className={`
                col-span-1 flex flex-col items-center justify-center rounded-lg py-3 text-center
                ${isToday ? "bg-indigo-50 ring-2 ring-indigo-500" : "bg-slate-50"}
              `}
            >
              <span className="text-xs font-medium uppercase text-slate-500">
                {formatTimeSlotLabel(dayIndex, 0).split(" ")[0]}
              </span>
              <span className={`mt-1 text-lg font-bold ${isToday ? "text-indigo-700" : "text-slate-800"}`}>
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* ─── Weekly Grid ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Time slots grid */}
          <div className="grid grid-cols-8 gap-2">
            {/* Time labels column */}
            <div className="col-span-1 flex flex-col">
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className="flex h-[80px] items-start px-2 py-1"
                  style={{ height: "calc(100% / 24)" }}
                >
                  <span className="text-[10px] font-medium text-slate-400">
                    {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                  </span>
                </div>
              ))}
            </div>

            {/* 7 day columns */}
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <div key={dayIndex} className="col-span-1 flex flex-col gap-2">
                {weekSlots
                  .filter((slot) => slot.dayIndex === dayIndex)
                  .map((slot) => (
                    <TimeSlotComponent
                      key={`${slot.dayIndex}-${slot.hour}`}
                      dayIndex={slot.dayIndex}
                      hour={slot.hour}
                      entry={slot.entry || undefined}
                      onAddEntry={handleAddEntry}
                      onUpdateEntry={handleUpdateEntry}
                      onDeleteEntry={handleDeleteEntry}
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Empty State ───────────────────────────────────────────────── */}
      {!hasEntries && (
        <div className="mt-8">
          <EmptyState onAddFirstEntry={() => handleAddEntry(1, 9)} />
        </div>
      )}

      {/* ─── Legend / Instructions ─────────────────────────────────────── */}
      <div className="mt-6 border-t border-slate-200 pt-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-indigo-50/30 ring-1 ring-inset ring-indigo-200" />
            <span>Has entry</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-white ring-1 ring-inset ring-slate-200" />
            <span>Empty slot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-indigo-50 ring-2 ring-indigo-500" />
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * WeeklyViewSkeleton - Loading state component
 */
export function WeeklyViewSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-24 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-9 w-20 animate-pulse rounded-lg bg-indigo-200" />
          <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>

      <div className="mb-2 grid grid-cols-8 gap-2">
        <div className="col-span-1 h-10 rounded bg-slate-100" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="col-span-1 h-10 rounded bg-slate-100" />
        ))}
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-8 gap-2">
            <div className="col-span-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="h-[80px] rounded bg-slate-50" />
              ))}
            </div>
            {Array.from({ length: 7 }).map((_, day) => (
              <div key={day} className="col-span-1 flex flex-col gap-2">
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div key={hour} className="h-[80px] rounded-lg border border-slate-100 bg-slate-50" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
