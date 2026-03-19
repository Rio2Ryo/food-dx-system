"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Goal } from "@/types/goals";

/**
 * Create a new goal
 */
export async function createGoal(
  goalData: {
    userId: string;
    title: string;
    content?: string | null;
    targetDate?: string | null;
  }
): Promise<Goal> {
  const prisma = await getPrisma();
  const goal = await prisma.goal.create({
    data: {
      userId: goalData.userId,
      title: goalData.title,
      content: goalData.content || undefined,
      targetDate: goalData.targetDate ? new Date(goalData.targetDate) : null,
    },
  });
  revalidatePath("/goals");
  return goal;
}

/**
 * Update an existing goal
 */
export async function updateGoal(
  goalId: string,
  updates: {
    title?: string;
    content?: string | null;
    targetDate?: string | null;
    isCompleted?: boolean;
  }
): Promise<Goal> {
  const prisma = await getPrisma();
  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.content !== undefined && { content: updates.content || undefined }),
      ...(updates.targetDate !== undefined && {
        targetDate: updates.targetDate ? new Date(updates.targetDate) : null,
      }),
      ...(updates.isCompleted !== undefined && { isCompleted: updates.isCompleted }),
    },
  });
  revalidatePath("/goals");
  return goal;
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId: string): Promise<void> {
  const prisma = await getPrisma();
  await prisma.goal.delete({
    where: { id: goalId },
  });
  revalidatePath("/goals");
}

/**
 * Toggle goal completion status
 */
export async function toggleGoalCompletion(goalId: string): Promise<Goal> {
  const prisma = await getPrisma();
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    throw new Error("Goal not found");
  }

  const updatedGoal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      isCompleted: !goal.isCompleted,
    },
  });
  revalidatePath("/goals");
  return updatedGoal;
}

/**
 * Get all goals for a user
 */
export async function getGoals(userId: string, filter?: "all" | "active" | "completed"): Promise<Goal[]> {
  const prisma = await getPrisma();

  const where: { userId: string; isCompleted?: boolean } = { userId };

  if (filter && filter !== "all") {
    where.isCompleted = filter === "completed";
  }

  const goals = await prisma.goal.findMany({
    where,
    orderBy: [
      { isCompleted: "asc" },
      { targetDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  return goals;
}

/**
 * Get goals grouped by completion status
 */
export async function getGoalsByStatus(userId: string): Promise<{
  active: Goal[];
  completed: Goal[];
}> {
  const prisma = await getPrisma();

  const [active, completed] = await Promise.all([
    prisma.goal.findMany({
      where: { userId, isCompleted: false },
      orderBy: [{ targetDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.goal.findMany({
      where: { userId, isCompleted: true },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  return { active, completed };
}

/**
 * Get today's wakuwaku moment
 */
export async function getTodayWakuWaku(userId: string): Promise<string | null> {
  const prisma = await getPrisma();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const wakuWaku = await prisma.goal.findFirst({
    where: {
      userId,
      isCompleted: true,
      createdAt: {
        gte: today,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return wakuWaku?.content || wakuWaku?.title || null;
}

/**
 * Get wakuwaku moments for the current week
 */
export async function getWeeklyWakuWaku(userId: string): Promise<Goal[]> {
  const prisma = await getPrisma();
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const wakuWaku = await prisma.goal.findMany({
    where: {
      userId,
      isCompleted: true,
      createdAt: {
        gte: weekAgo,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 7,
  });

  return wakuWaku;
}
