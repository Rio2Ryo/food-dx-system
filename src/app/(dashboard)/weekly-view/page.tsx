import { getPrisma } from "@/lib/prisma";
import { WeeklyView } from "@/components/weekly-view";
import { createEntry, updateEntry, deleteEntry } from "@/lib/weekly-actions";

/**
 * WeeklyViewPage - Server-side page component
 * Fetches entries and passes them to the client-side WeeklyView component
 */
export default async function WeeklyViewPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string; week?: string }>;
}) {
  const params = await searchParams;
  const prisma = await getPrisma();

  // In a real app, get user from auth context
  // For now, we'll use a placeholder user ID
  const userId = "current-user-id";

  // Parse week/year from params or use current week
  const year = params?.year ? parseInt(params.year, 10) : new Date().getFullYear();
  const week = params?.week ? parseInt(params.week, 10) : Math.ceil((((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7);

  // Fetch entries for the week
  const entries = await prisma.entry.findMany({
    where: {
      userId,
      year,
      week,
    },
    include: {
      images: true,
    },
    orderBy: {
      dayOfWeek: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <WeeklyView
        entries={entries}
        onEntryCreate={createEntry}
        onEntryUpdate={updateEntry}
        onEntryDelete={deleteEntry}
      />
    </div>
  );
}
