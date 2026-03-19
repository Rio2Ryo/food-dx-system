"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Create a new entry
 */
export async function createEntry(entryData: {
  userId: string;
  year: number;
  week: number;
  dayOfWeek: number;
  hour: number;
  content?: string | null;
  isCompleted: boolean;
}) {
  const prisma = await getPrisma();
  const entry = await prisma.entry.create({
    data: entryData,
    include: {
      images: true,
    },
  });
  revalidatePath("/weekly-view");

  // Convert Date to string for compatibility with WeeklyEntry type
  return {
    ...entry,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    images: entry.images?.map((img) => ({
      ...img,
      createdAt: img.createdAt.toISOString(),
    })),
  };
}

/**
 * Update an existing entry
 */
export async function updateEntry(entryId: string, updates: {
  content?: string | null;
  isCompleted?: boolean;
}) {
  const prisma = await getPrisma();
  await prisma.entry.update({
    where: { id: entryId },
    data: updates,
  });
  revalidatePath("/weekly-view");
}

/**
 * Delete an entry
 */
export async function deleteEntry(entryId: string) {
  const prisma = await getPrisma();
  await prisma.entry.delete({
    where: { id: entryId },
  });
  revalidatePath("/weekly-view");
}
