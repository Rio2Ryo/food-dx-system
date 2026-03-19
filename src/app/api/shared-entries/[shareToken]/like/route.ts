import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { validateShareToken } from "@/lib/sharing-actions";

/**
 * API Route: POST /api/shared-entries/[shareToken]/like
 * Like or unlike a shared entry
 * Supports both authenticated users and anonymous likes (tracked by IP)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;

    const prisma = await getPrisma();

    const body = await request.json();
    const { entryId } = body as { entryId: string };

    if (!entryId) {
      return NextResponse.json(
        { success: false, error: "Missing required field: entryId" },
        { status: 400 }
      );
    }

    // Validate token and get shared entry
    const sharedEntry = await prisma.sharedEntry.findUnique({
      where: { shareToken },
      select: { entryId: true, expiresAt: true },
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

    // Validate entry matches shared entry
    if (sharedEntry.entryId !== entryId) {
      return NextResponse.json(
        { success: false, error: "Entry does not match shared entry" },
        { status: 400 }
      );
    }

    // Get user info
    const userId = request.headers.get("x-user-id");
    const headers = request.headers;
    const ipAddress = headers.get("x-forwarded-for") || headers.get("cf-connecting-ip");

    // Check if already liked
    let existingLike = null;
    if (userId) {
      existingLike = await prisma.entryLike.findUnique({
        where: {
          like_user_unique: {
            entryId,
            userId,
          },
        },
      });
    } else if (ipAddress) {
      existingLike = await prisma.entryLike.findUnique({
        where: {
          like_anonymous_unique: {
            entryId,
            ipAddress,
          },
        },
      });
    }

    let likeCount: number;
    let userHasLiked = false;

    if (existingLike) {
      // Unlike - delete the like
      await prisma.entryLike.delete({
        where: { id: existingLike.id },
      });

      likeCount = await prisma.entryLike.count({
        where: { entryId },
      });

      userHasLiked = false;
    } else {
      // Like - create new like
      await prisma.entryLike.create({
        data: {
          entryId,
          userId: userId ?? undefined,
          ipAddress: ipAddress ?? undefined,
        },
      });

      likeCount = await prisma.entryLike.count({
        where: { entryId },
      });

      userHasLiked = true;
    }

    return NextResponse.json({
      success: true,
      likeCount,
      userHasLiked,
    });
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
