import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { ShareEntryView } from "@/components/share/ShareEntryView";

/**
 * Shared Entry Page
 * Displays a shared entry with images and likes
 * No authentication required - uses token-based access
 */
export default async function SharedEntryPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const prisma = await getPrisma();

  // Validate token and get shared entry
  const sharedEntry = await prisma.sharedEntry.findUnique({
    where: { shareToken },
    include: {
      entry: {
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
          likes: true,
        },
      },
      sharedBy: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!sharedEntry) {
    return notFound();
  }

  // Check expiration
  if (sharedEntry.expiresAt && new Date(sharedEntry.expiresAt) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">This link has expired</h1>
          <p className="mt-2 text-slate-600">
            The shared entry has expired and is no longer available.
          </p>
        </div>
      </div>
    );
  }

  // Increment view count
  await prisma.sharedEntry.update({
    where: { id: sharedEntry.id },
    data: { viewCount: { increment: 1 } },
  });

  // Build entry data
  const entryData = {
    id: sharedEntry.entry.id,
    userId: sharedEntry.entry.userId,
    year: sharedEntry.entry.year,
    week: sharedEntry.entry.week,
    dayOfWeek: sharedEntry.entry.dayOfWeek,
    hour: sharedEntry.entry.hour,
    content: sharedEntry.entry.content,
    isCompleted: sharedEntry.entry.isCompleted,
    createdAt: sharedEntry.entry.createdAt.toISOString(),
    updatedAt: sharedEntry.entry.updatedAt.toISOString(),
  };

  const images = sharedEntry.entry.images.map((img) => ({
    id: img.id,
    entryId: img.entryId,
    imageUrl: img.imageUrl,
    sortOrder: img.sortOrder,
    createdAt: img.createdAt.toISOString(),
  }));

  const likeCount = sharedEntry.entry.likes.length;

  return (
    <ShareEntryView
      entryId={sharedEntry.entryId}
      sharedById={sharedEntry.sharedById}
      sharedByName={sharedEntry.sharedBy.name ?? undefined}
      sharedByAvatarUrl={sharedEntry.sharedBy.avatarUrl ?? undefined}
      viewCount={sharedEntry.viewCount + 1}
      expiresAt={sharedEntry.expiresAt?.toISOString() ?? null}
      entry={entryData}
      images={images}
      likeCount={likeCount}
    />
  );
}
