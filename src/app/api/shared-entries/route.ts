import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { createSharedEntry } from "@/lib/sharing-actions";

/**
 * API Route: POST /api/shared-entries
 * Create a shared entry with secure token
 * Only shares entry data, images, and like count - no user contact info
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma();

    const body = await request.json();
    const { entryId, expiresAt } = body as {
      entryId: string;
      expiresAt?: string; // ISO date string for optional expiration
    };

    // Validate required fields
    if (!entryId) {
      return NextResponse.json(
        { error: "Missing required field: entryId" },
        { status: 400 }
      );
    }

    // Get user from auth context
    // In a real app, you'd get this from the auth session
    // For now, we'll use a placeholder - in production, use your auth middleware
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - user not authenticated" },
        { status: 401 }
      );
    }

    // Validate entry exists and belongs to user
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: { id: true, userId: true },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (entry.userId !== userId) {
      return NextResponse.json(
        { error: "Entry does not belong to user" },
        { status: 403 }
      );
    }

    // Check if already shared
    const existingShared = await prisma.sharedEntry.findFirst({
      where: { entryId },
    });

    if (existingShared) {
      // Return existing share URL
      const shareUrl = `/shared/${existingShared.shareToken}`;
      return NextResponse.json({
        success: true,
        shareToken: existingShared.shareToken,
        sharedEntryId: existingShared.id,
        shareUrl,
        expiresAt: existingShared.expiresAt?.toISOString(),
      });
    }

    // Generate unique token
    const shareToken = generateShareToken();

    // Create shared entry
    const sharedEntry = await prisma.sharedEntry.create({
      data: {
        entryId,
        sharedById: userId,
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

    // Build response
    const shareUrl = `/shared/${sharedEntry.shareToken}`;

    return NextResponse.json({
      success: true,
      shareToken: sharedEntry.shareToken,
      sharedEntryId: sharedEntry.id,
      shareUrl,
      expiresAt: sharedEntry.expiresAt?.toISOString(),
    });
  } catch (error) {
    console.error("Failed to create shared entry:", error);
    return NextResponse.json(
      { error: "Failed to create shared entry" },
      { status: 500 }
    );
  }
}

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
