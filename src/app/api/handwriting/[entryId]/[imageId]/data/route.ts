import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

/**
 * API Route: GET /api/handwriting/[entryId]/[imageId]/data
 * Retrieves the actual image data (base64) for display
 * This route returns the stored base64 image data
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

    // For now, return a placeholder since we're not actually storing base64 data
    // In a real implementation, you would:
    // 1. Store the base64 data in the database
    // 2. Or upload to Cloudflare R2 and return the R2 URL
    // 3. Or return the actual image bytes with proper Content-Type header
    
    // For demonstration, we return a simple response indicating the image path
    return NextResponse.json({
      imageUrl: image.imageUrl,
      entryId: image.entryId,
      id: image.id,
    });
  } catch (error) {
    console.error("Error fetching handwriting image data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
