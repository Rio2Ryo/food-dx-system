import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { validateShareToken } from "@/lib/sharing-actions";

/**
 * API Route: GET /api/shared-entries/[shareToken]
 * Get shared entry data by token
 * Returns entry data, images, and like count - no user contact info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
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
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 404 }
      );
    }

    // Check expiration
    if (sharedEntry.expiresAt && new Date(sharedEntry.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Link has expired" },
        { status: 410 }
      );
    }

    // Increment view count
    await prisma.sharedEntry.update({
      where: { id: sharedEntry.id },
      data: { viewCount: { increment: 1 } },
    });

    // Build response data
    const images = sharedEntry.entry.images.map((img) => ({
      id: img.id,
      entryId: img.entryId,
      imageUrl: img.imageUrl,
      sortOrder: img.sortOrder,
      createdAt: img.createdAt.toISOString(),
    }));

    const entry = {
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

    // Check if user has liked (from auth header)
    const userId = request.headers.get("x-user-id");
    let userHasLiked = false;
    if (userId) {
      const like = await prisma.entryLike.findFirst({
        where: {
          entryId: sharedEntry.entryId,
          userId,
        },
      });
      userHasLiked = !!like;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: sharedEntry.id,
        shareToken: sharedEntry.shareToken,
        entryId: sharedEntry.entryId,
        sharedById: sharedEntry.sharedById,
        sharedByName: sharedEntry.sharedBy.name,
        sharedByAvatarUrl: sharedEntry.sharedBy.avatarUrl,
        viewCount: sharedEntry.viewCount + 1, // +1 for current view
        expiresAt: sharedEntry.expiresAt?.toISOString() ?? null,
        createdAt: sharedEntry.createdAt.toISOString(),
        entry,
        images,
        likeCount,
        userHasLiked,
      },
    });
  } catch (error) {
    console.error("Failed to get shared entry data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get shared entry data" },
      { status: 500 }
    );
  }
}
