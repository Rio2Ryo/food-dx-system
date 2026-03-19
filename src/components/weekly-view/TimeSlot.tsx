"use client";

import { useState, useRef, useEffect } from "react";
import { WeeklyEntry, EntryImage, formatHourDisplay } from "@/types/weekly-view";

/**
 * Handwriting canvas component for time slot entries
 */
export function HandwritingCanvas({
  entryId,
  onSave,
  existingImage,
}: {
  entryId: string;
  onSave: (dataUrl: string) => void;
  existingImage?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(!!existingImage);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Load existing image if provided
    if (existingImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasContent(true);
      };
      img.src = existingImage;
    }
  }, [existingImage]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasContent(true);

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b"; // slate-800
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
  };

  return (
    <div className="relative flex flex-col">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="h-24 w-full touch-none cursor-crosshair rounded-md border border-slate-200 bg-white"
      />
      {hasContent && (
        <button
          onClick={clearCanvas}
          className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-white hover:text-slate-800"
        >
          Clear
        </button>
      )}
    </div>
  );
}

/**
 * Text content editor for time slot
 */
export function TextEditor({
  content,
  onChange,
  onBlur,
}: {
  content?: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <textarea
      value={content || ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder="Enter text..."
      className="h-24 w-full resize-none rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      rows={3}
    />
  );
}

/**
 * TimeSlot component - displays a single time slot cell
 */
export function TimeSlot({
  dayIndex,
  hour,
  entry,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}: {
  dayIndex: number;
  hour: number;
  entry?: WeeklyEntry | null;
  onAddEntry: (dayIndex: number, hour: number) => void;
  onUpdateEntry: (entryId: string, updates: Partial<WeeklyEntry>) => void;
  onDeleteEntry: (entryId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(entry?.content || "");

  useEffect(() => {
    setLocalContent(entry?.content || "");
  }, [entry?.content]);

  const handleSaveContent = (content: string) => {
    if (!entry) {
      onAddEntry(dayIndex, hour);
    } else {
      onUpdateEntry(entry.id, { content });
    }
    setIsEditing(false);
  };

  const handleImageSave = (dataUrl: string) => {
    // In a real implementation, this would upload the image
    // and update the entry with the image URL
    console.log("Image saved:", dataUrl);
    if (!entry) {
      onAddEntry(dayIndex, hour);
    }
  };

  const handleDelete = () => {
    if (entry) {
      onDeleteEntry(entry.id);
    }
  };

  const hasContent = entry?.content || (entry?.images?.length ?? 0) > 0;

  return (
    <div
      className={`
        relative flex min-h-[80px] flex-col rounded-lg border transition-all duration-200
        ${hasContent 
          ? "border-indigo-200 bg-indigo-50/30 hover:border-indigo-300 hover:bg-indigo-50/50" 
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        }
      `}
      onClick={() => !isEditing && !hasContent && onAddEntry(dayIndex, hour)}
    >
      {/* Header: Time label */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[10px] font-medium text-slate-500">
          {formatHourDisplay(hour)}
        </span>
        {hasContent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
            title="Delete entry"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 px-2 pb-2">
        {hasContent ? (
          <div className="flex flex-col gap-2">
            {/* Text content */}
            {entry?.content && (
              <div className="rounded-md bg-white p-2 text-xs text-slate-700 shadow-sm">
                {entry.content}
              </div>
            )}

            {/* Handwriting image */}
            {entry?.images && entry.images.length > 0 && (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-slate-100">
                <img
                  src={entry.images[0].imageUrl}
                  alt="Handwriting"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                  {entry.images.length} image{entry.images.length !== 1 && "s"}
                </div>
              </div>
            )}

            {/* Edit button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="self-start rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-600 hover:bg-indigo-100"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
        )}
      </div>

      {/* Editing mode */}
      {isEditing && entry && (
        <div className="border-t border-slate-200 bg-slate-50 p-2">
          <TextEditor
            content={localContent}
            onChange={setLocalContent}
            onBlur={() => handleSaveContent(localContent)}
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => handleSaveContent(localContent)}
              className="flex-1 rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state component for the weekly view
 */
export function EmptyState({ onAddFirstEntry }: { onAddFirstEntry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-indigo-50 p-4">
        <svg className="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-800">No entries yet</h3>
      <p className="mt-1 text-sm text-slate-500">
        Click on any time slot to add your first entry.
      </p>
      <button
        onClick={onAddFirstEntry}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Add Entry
      </button>
    </div>
  );
}
