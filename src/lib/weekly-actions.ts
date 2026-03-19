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
  content?: string;
  isCompleted: boolean;
}) {
  const prisma = await getPrisma();
  const entry = await prisma.entry.create({
    data: entryData,
  });
  revalidatePath("/weekly-view");
  return entry;
}

/**
 * Update an existing entry
 */
export async function updateEntry(entryId: string, updates: {
  content?: string;
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
