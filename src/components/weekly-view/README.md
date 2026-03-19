# CITTA handcho - 24h Vertical Weekly View

## Overview

This component provides a 24h vertical weekly calendar view for the CITTA handcho app. It displays 7 days (Monday-Sunday) side by side with 24 time slots per day, supporting text entries and handwriting input.

## Component Structure

```
src/
├── types/
│   └── weekly-view.ts          # Type definitions and utilities
├── components/
│   └── weekly-view/
│       ├── index.ts            # Barrel exports
│       ├── TimeSlot.tsx        # Individual time slot cell
│       └── WeeklyView.tsx      # Main weekly calendar component
└── app/
    └── (dashboard)/
        └── weekly-view/
            └── page.tsx        # Page route
```

## Files

### 1. Type Definitions (`src/types/weekly-view.ts`)

Contains TypeScript types and utility functions:

- **Types:**
  - `WeeklyEntry` - Entry data structure matching Prisma schema
  - `EntryImage` - Handwriting image data
  - `TimeSlot` - UI representation of a time slot
  - `DayOfWeek` - Day type definitions

- **Constants:**
  - `DAY_NAMES` - English day names (Sunday-Saturday)
  - `DISPLAY_DAY_NAMES` - Japanese day names for UI

- **Functions:**
  - `getISOWeekInfo(date)` - Calculate ISO week and year
  - `getWeekDates(year, week)` - Get dates for a given week
  - `generateWeekSlots(year, week, entries)` - Generate all time slots
  - `formatHourDisplay(hour)` - Format hour for display (12h format)
  - `formatTimeSlotLabel(dayIndex, hour)` - Format time slot label
  - `getDisplayDayName(dayIndex)` - Get Japanese day name

### 2. TimeSlot Component (`src/components/weekly-view/TimeSlot.tsx`)

Individual time slot cell with:

- **HandwritingCanvas** - Canvas for handwriting input with touch support
- **TextEditor** - Text area for text entries
- **Image display** - Shows existing handwriting images
- **Edit/Delete** - Actions for managing entries

Props:
```typescript
{
  dayIndex: number;      // 0=Sunday, 1=Monday, ..., 6=Saturday
  hour: number;          // 0-23
  entry?: WeeklyEntry;   // Existing entry (if any)
  onAddEntry: (day, hour) => void;
  onUpdateEntry: (id, updates) => void;
  onDeleteEntry: (id) => void;
}
```

### 3. WeeklyView Component (`src/components/weekly-view/WeeklyView.tsx`)

Main weekly calendar with:

- **Week navigation** - Previous/Next/Today buttons
- **Day headers** - Day names and dates
- **Time labels** - 24-hour labels on left side
- **Time slot grid** - 7 columns × 24 rows
- **Responsive design** - Horizontal scroll on mobile

Props:
```typescript
{
  entries: WeeklyEntry[];
  onEntryCreate: (entry) => Promise<WeeklyEntry>;
  onEntryUpdate: (id, updates) => Promise<void>;
  onEntryDelete: (id) => Promise<void>;
}
```

### 4. Page Route (`src/app/(dashboard)/weekly-view/page.tsx`)

Server-side page that:
- Fetches entries from database
- Parses week/year from URL params
- Passes data to client-side WeeklyView

## Usage

### Basic Usage

```tsx
import { WeeklyView } from "@/components/weekly-view";

<WeeklyView
  entries={entries}
  onEntryCreate={handleCreate}
  onEntryUpdate={handleUpdate}
  onEntryDelete={handleDelete}
/>
```

### URL Parameters

Navigate to specific weeks using query params:
- `/weekly-view?year=2026&week=12`
- `/weekly-view` (current week)

## Features

### Time Slot States

1. **Empty** - White background, click to add
2. **Has Entry** - Light indigo background
3. **Today** - Indigo ring highlight

### Entry Types

1. **Text Entry** - Plain text content
2. **Handwriting** - Canvas-based drawing with image storage

### Interactions

- Click empty slot → Add new entry
- Click existing slot → Edit entry
- Delete button → Remove entry
- Clear button (on canvas) → Clear handwriting

## Styling

Uses Tailwind CSS with CITTA brand colors:

```css
/* CITTA Primary */
citta-primary-500: #6366f1
citta-primary-600: #4f46e5

/* Semantic Colors */
success: #059669
warning: #d97706
danger: #dc2626
```

## Database Schema

Entries are stored in the `entries` table:

```prisma
model Entry {
  id          String   @id @default(cuid())
  userId      String
  year        Int
  week        Int
  dayOfWeek   Int      // 0=Sunday, 1=Monday, ..., 6=Saturday
  hour        Int      // 0-23
  content     String?
  isCompleted Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Extensibility

### Adding New Features

1. **New Entry Type** - Add to `TimeSlot` component
2. **Custom Styling** - Modify Tailwind classes
3. **API Integration** - Update page route data fetching

### Handwriting Image Upload

To implement actual image upload:

1. Update `HandwritingCanvas.onSave` callback
2. Upload to Cloudflare R2 or similar
3. Create `EntryImage` record in database
4. Update entry with image URL

## Responsive Design

- **Desktop** - Full grid visible
- **Mobile** - Horizontal scroll enabled
- **Touch Support** - Canvas works with touch events

## Performance Considerations

- 168 time slots (7 × 24) rendered per week
- Virtualization could be added for larger datasets
- Debounce handwriting canvas updates
