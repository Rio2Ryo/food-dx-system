"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Upload handwriting image for an entry
 * 
 * @param entryId - The entry ID to associate the image with
 * @param imageUrl - Base64 data URL of the image
 * @returns UploadImageResponse with success status and image URL
 */
export async function uploadHandwritingImage(
  entryId: string,
  imageUrl: string
): Promise<{ success: boolean; imageUrl: string; entryImageId?: string; error?: string }> {
  try {
    const prisma = await getPrisma();

    // Validate entry exists
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return {
        success: false,
        imageUrl: "",
        error: "Entry not found",
      };
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
      return {
        success: false,
        imageUrl: "",
        error: "Invalid image data",
      };
    }

    // Calculate next sort order
    const existingImages = await prisma.entryImage.findMany({
      where: { entryId },
      select: { sortOrder: true },
      orderBy: { sortOrder: "desc" },
      take: 1,
    });

    const nextSortOrder = existingImages.length > 0 ? existingImages[0].sortOrder + 1 : 0;

    // Create entry image record
    // Note: In a real implementation, you'd upload to Cloudflare R2 or similar
    // For now, we'll store the base64 data directly (not recommended for production)
    // The imageUrl field should contain a proper URL to the stored image
    
    // For demonstration, we'll use a placeholder URL format
    // In production, replace this with actual R2 upload logic
    const imageId = crypto.randomUUID();
    const imageUrlPath = `/api/handwriting/${entryId}/${imageId}`;

    const entryImage = await prisma.entryImage.create({
      data: {
        entryId,
        imageUrl: imageUrlPath,
        sortOrder: nextSortOrder,
      },
    });

    // Revalidate the weekly view path
    revalidatePath("/weekly-view");

    return {
      success: true,
      imageUrl: imageUrlPath,
      entryImageId: entryImage.id,
    };
  } catch (error) {
    console.error("Failed to upload handwriting image:", error);
    return {
      success: false,
      imageUrl: "",
      error: "Failed to upload image",
    };
  }
}

/**
 * Delete a handwriting image
 * 
 * @param imageId - The image ID to delete
 * @returns DeleteImageResponse with success status
 */
export async function deleteHandwritingImage(
  imageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const prisma = await getPrisma();

    // Delete the image record
    await prisma.entryImage.delete({
      where: { id: imageId },
    });

    // Revalidate the weekly view path
    revalidatePath("/weekly-view");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete handwriting image:", error);
    return {
      success: false,
      error: "Failed to delete image",
    };
  }
}

/**
 * Get all images for an entry
 * 
 * @param entryId - The entry ID
 * @returns Array of entry images sorted by sortOrder
 */
export async function getEntryImages(entryId: string) {
  try {
    const prisma = await getPrisma();

    const images = await prisma.entryImage.findMany({
      where: { entryId },
      orderBy: { sortOrder: "asc" },
    });

    return images;
  } catch (error) {
    console.error("Failed to get entry images:", error);
    return [];
  }
}

/**
 * Update image sort order
 * 
 * @param imageId - The image ID
 * @param sortOrder - New sort order value
 * @returns Update result
 */
export async function updateImageSortOrder(
  imageId: string,
  sortOrder: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const prisma = await getPrisma();

    await prisma.entryImage.update({
      where: { id: imageId },
      data: { sortOrder },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update image sort order:", error);
    return {
      success: false,
      error: "Failed to update sort order",
    };
  }
}
