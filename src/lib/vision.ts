/**
 * Google Cloud Vision API client using the REST API via fetch().
 * Compatible with Cloudflare Workers (no gRPC, no Node.js native APIs).
 */

interface VisionApiResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      locale?: string;
    }>;
    error?: {
      code: number;
      message: string;
    };
  }>;
}

/**
 * Extract text from an image using Google Cloud Vision REST API (TEXT_DETECTION).
 *
 * @param image - Base64-encoded image string, or a Uint8Array / ArrayBuffer to be converted.
 * @returns The full detected text, or an empty string if nothing was found.
 */
export async function extractTextFromImage(
  image: string | Uint8Array | ArrayBuffer
): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_VISION_API_KEY environment variable is not set. " +
        "Please set it to a valid Google Cloud API key with Vision API enabled."
    );
  }

  // Convert to base64 string if needed
  let base64Content: string;
  if (typeof image === "string") {
    base64Content = image;
  } else {
    const bytes =
      image instanceof Uint8Array ? image : new Uint8Array(image);
    base64Content = uint8ArrayToBase64(bytes);
  }

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

  const requestBody = {
    requests: [
      {
        image: {
          content: base64Content,
        },
        features: [
          {
            type: "TEXT_DETECTION",
          },
        ],
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Vision API request failed (${response.status}): ${errorText}`
    );
  }

  const data: VisionApiResponse = await response.json();

  // Check for per-image errors in the response
  const result = data.responses?.[0];
  if (!result) {
    return "";
  }

  if (result.error) {
    throw new Error(
      `Vision API error (${result.error.code}): ${result.error.message}`
    );
  }

  const detections = result.textAnnotations;
  if (!detections || detections.length === 0) {
    return "";
  }

  // The first annotation contains the full concatenated text
  return detections[0].description ?? "";
}

/**
 * Convert a Uint8Array to a base64 string without relying on Node.js Buffer.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  // In modern runtimes (including Cloudflare Workers), btoa is available.
  // We build a binary string from the byte array and then encode it.
  let binary = "";
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
