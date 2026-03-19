import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * API Route: GET /api/handwriting/[entryId]/[imageId]
 * Retrieves a specific handwriting image metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string; imageId: string }> }
) {
  try {
    const { entryId, imageId } = await params;

    const prisma = await getPrisma();

    // Find the image record
    const image = await prisma.entryImage.findUnique({
      where: {
        id: imageId,
        entryId,
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Return the image URL path that was stored
    // The client should use this path to fetch the actual image data
    return NextResponse.json({
      id: image.id,
      entryId: image.entryId,
      imageUrl: image.imageUrl,
      sortOrder: image.sortOrder,
      createdAt: image.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching handwriting image:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
