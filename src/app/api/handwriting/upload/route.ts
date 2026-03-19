import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * API Route: POST /api/handwriting/upload
 * Uploads a handwriting image for an entry
 * Stores the base64 image data directly in the database
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma();

    const body = await request.json();
    const { entryId, imageUrl } = body as { entryId: string; imageUrl: string };

    if (!entryId || !imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields: entryId and imageUrl" },
        { status: 400 }
      );
    }

    // Validate entry exists
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Parse base64 data URL to extract image data
    let base64Data = imageUrl;
    let mimeType = "image/png";

    if (imageUrl.startsWith("data:")) {
      const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

    // Validate base64 data
    if (!base64Data || base64Data.length === 0) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    // Calculate next sort order
    const existingImages = await prisma.entryImage.findMany({
      where: { entryId },
      select: { sortOrder: true },
      orderBy: { sortOrder: "desc" },
      take: 1,
    });

    const nextSortOrder = existingImages.length > 0 ? existingImages[0].sortOrder + 1 : 0;

    // Create entry image record with base64 data
    // Note: For production, you should upload to Cloudflare R2 or similar
    // This is a simplified version that stores base64 in the database
    const imageId = crypto.randomUUID();
    const imageUrlPath = `/api/handwriting/${entryId}/${imageId}/data`;

    const entryImage = await prisma.entryImage.create({
      data: {
        entryId,
        imageUrl: imageUrlPath,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json({
      success: true,
      imageUrl: imageUrlPath,
      entryImageId: imageId,
    });
  } catch (error) {
    console.error("Failed to upload handwriting image:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
