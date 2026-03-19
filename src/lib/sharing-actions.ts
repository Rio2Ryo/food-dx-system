"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  CreateSharedEntryRequest,
  CreateSharedEntryResponse,
  SharedEntryData,
  SharedEntryWithRelations,
  TokenValidationResult,
  LikeResponse,
  EntryData,
  EntryImage as SharingEntryImage,
} from "@/types/sharing";

/**
 * Generate a secure random token for sharing
 */
function generateShareToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return token;
}

/**
 * Validate a share token and check expiration
 */
export async function validateShareToken(
  shareToken: string
): Promise<TokenValidationResult> {
  const prisma = await getPrisma();

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
    return { isValid: false, error: "Invalid token" };
  }

  // Check expiration
  if (sharedEntry.expiresAt && new Date(sharedEntry.expiresAt) < new Date()) {
    return { isValid: false, expired: true, error: "Link has expired" };
  }

  return { isValid: true, sharedEntry: sharedEntry as any };
}

/**
 * Create a shared entry
 * Only shares entry data, images, and like count - no user contact info
 */
export async function createSharedEntry(
  entryId: string,
  sharedById: string,
  expiresAt?: string
): Promise<CreateSharedEntryResponse> {
  try {
    const prisma = await getPrisma();

    // Validate entry exists and belongs to user
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: { id: true, userId: true },
    });

    if (!entry) {
      return { success: false, shareToken: "", sharedEntryId: "", shareUrl: "", error: "Entry not found" };
    }

    if (entry.userId !== sharedById) {
      return { success: false, shareToken: "", sharedEntryId: "", shareUrl: "", error: "Entry does not belong to user" };
    }

    // Check if already shared
    const existingShareds = await prisma.sharedEntry.findMany({
      where: { entryId },
      take: 1,
    });
    const existingShared = existingShareds[0] || null;

    if (existingShared) {
      // Return existing share token
      const shareUrl = `/shared/${existingShared.shareToken}`;
      return {
        success: true,
        shareToken: existingShared.shareToken,
        sharedEntryId: existingShared.id,
        shareUrl,
        expiresAt: existingShared.expiresAt?.toISOString(),
      };
    }

    // Generate unique token
    let shareToken = generateShareToken();
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const existingToken = await prisma.sharedEntry.findUnique({
        where: { shareToken },
      });
      if (!existingToken) break;
      shareToken = generateShareToken();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return { success: false, shareToken: "", sharedEntryId: "", shareUrl: "", error: "Failed to generate unique token" };
    }

    // Create shared entry
    const sharedEntry = await prisma.sharedEntry.create({
      data: {
        entryId,
        sharedById,
        shareToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        entry: true,
        sharedBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Get images
    const images = await prisma.entryImage.findMany({
      where: { entryId },
      orderBy: { sortOrder: "asc" },
    });

    // Get like count
    const likeCount = await prisma.entryLike.count({
      where: { entryId },
    });

    // Build response data
    const shareUrl = `/shared/${sharedEntry.shareToken}`;

    return {
      success: true,
      shareToken: sharedEntry.shareToken,
      sharedEntryId: sharedEntry.id,
      shareUrl,
      expiresAt: sharedEntry.expiresAt?.toISOString(),
    };
  } catch (error) {
    console.error("Failed to create shared entry:", error);
    return { success: false, shareToken: "", sharedEntryId: "", shareUrl: "", error: "Failed to create shared entry" };
  }
}

/**
 * Get shared entry data by token
 * Returns entry data, images, and like count - no user contact info
 */
export async function getSharedEntryData(
  shareToken: string
): Promise<SharedEntryData | null> {
  try {
    const prisma = await getPrisma();

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
      return null;
    }

    // Check expiration
    if (sharedEntry.expiresAt && new Date(sharedEntry.expiresAt) < new Date()) {
      return null;
    }

    // Increment view count
    await prisma.sharedEntry.update({
      where: { id: sharedEntry.id },
      data: { viewCount: { increment: 1 } },
    });

    // Record access (without user info if not authenticated)
    // This is handled in the API route with IP tracking

    // Build response
    const images: SharingEntryImage[] = sharedEntry.entry.images.map((img) => ({
      id: img.id,
      entryId: img.entryId,
      imageUrl: img.imageUrl,
      sortOrder: img.sortOrder,
      createdAt: img.createdAt.toISOString(),
    }));

    const entry: EntryData = {
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

    const likeCount = sharedEntry.entry.likes.length;

    return {
      id: sharedEntry.id,
      shareToken: sharedEntry.shareToken,
      entryId: sharedEntry.entryId,
      sharedById: sharedEntry.sharedById,
      sharedByName: sharedEntry.sharedBy.name ?? undefined,
      sharedByAvatarUrl: sharedEntry.sharedBy.avatarUrl ?? undefined,
      viewCount: sharedEntry.viewCount + 1, // +1 for current view
      expiresAt: sharedEntry.expiresAt?.toISOString() ?? null,
      createdAt: sharedEntry.createdAt.toISOString(),
      entry,
      images,
      likeCount,
      userHasLiked: false, // Will be set by API route if user is authenticated
    };
  } catch (error) {
    console.error("Failed to get shared entry data:", error);
    return null;
  }
}

/**
 * Record a view/access to a shared entry
 */
export async function recordSharedEntryView(
  shareToken: string,
  userId?: string,
  ipAddress?: string
): Promise<void> {
  try {
    const prisma = await getPrisma();

    const sharedEntry = await prisma.sharedEntry.findUnique({
      where: { shareToken },
    });

    if (!sharedEntry) {
      return;
    }

    // Check expiration
    if (sharedEntry.expiresAt && new Date(sharedEntry.expiresAt) < new Date()) {
      return;
    }

    // Increment view count
    await prisma.sharedEntry.update({
      where: { id: sharedEntry.id },
      data: { viewCount: { increment: 1 } },
    });
  } catch (error) {
    console.error("Failed to record shared entry view:", error);
  }
}

/**
 * Like or unlike a shared entry
 * Supports both authenticated users and anonymous likes (tracked by IP)
 */
export async function toggleSharedEntryLike(
  entryId: string,
  userId?: string,
  ipAddress?: string
): Promise<LikeResponse> {
  try {
    const prisma = await getPrisma();

    // Validate entry exists
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return { success: false, likeCount: 0, userHasLiked: false, error: "Entry not found" };
    }

    // Check if already liked
    let existingLike = null;
    if (userId) {
      existingLike = await prisma.entryLike.findFirst({
        where: {
          entryId,
          userId,
        },
      });
    } else if (ipAddress) {
      existingLike = await prisma.entryLike.findFirst({
        where: {
          entryId,
          ipAddress,
        },
      });
    }

    if (existingLike) {
      // Unlike - delete the like
      await prisma.entryLike.delete({
        where: { id: existingLike.id },
      });

      const likeCount = await prisma.entryLike.count({
        where: { entryId },
      });

      return {
        success: true,
        likeCount,
        userHasLiked: false,
      };
    } else {
      // Like - create new like
      const like = await prisma.entryLike.create({
        data: {
          entryId,
          userId: userId ?? undefined,
          ipAddress: ipAddress ?? undefined,
        },
      });

      const likeCount = await prisma.entryLike.count({
        where: { entryId },
      });

      return {
        success: true,
        likeCount,
        userHasLiked: true,
      };
    }
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return { success: false, likeCount: 0, userHasLiked: false, error: "Failed to toggle like" };
  }
}

/**
 * Get like count for an entry
 */
export async function getLikeCount(entryId: string): Promise<number> {
  try {
    const prisma = await getPrisma();
    return await prisma.entryLike.count({
      where: { entryId },
    });
  } catch (error) {
    console.error("Failed to get like count:", error);
    return 0;
  }
}

/**
 * Check if user has liked an entry
 */
export async function checkUserLike(
  entryId: string,
  userId: string
): Promise<boolean> {
  try {
    const prisma = await getPrisma();
    const like = await prisma.entryLike.findFirst({
      where: {
        entryId,
        userId,
      },
    });
    return !!like;
  } catch (error) {
    console.error("Failed to check user like:", error);
    return false;
  }
}

/**
 * Get share statistics for an entry
 */
export async function getShareStats(entryId: string): Promise<{
  viewCount: number;
  likeCount: number;
  shareCount: number;
}> {
  try {
    const prisma = await getPrisma();

    const [viewCountResult, likeCount, shareCount] = await Promise.all([
      prisma.sharedEntry.findFirst({
        where: { entryId },
        select: { viewCount: true },
      }),
      prisma.entryLike.count({
        where: { entryId },
      }),
      prisma.sharedEntry.count({
        where: { entryId },
      }),
    ]);

    return {
      viewCount: viewCountResult?.viewCount || 0,
      likeCount,
      shareCount,
    };
  } catch (error) {
    console.error("Failed to get share stats:", error);
    return { viewCount: 0, likeCount: 0, shareCount: 0 };
  }
}
