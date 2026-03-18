import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient();

export async function extractTextFromImage(
  imageBuffer: Buffer
): Promise<string> {
  const [result] = await client.textDetection({
    image: { content: imageBuffer.toString("base64") },
  });

  const detections = result.textAnnotations;
  if (!detections || detections.length === 0) {
    return "";
  }

  return detections[0].description ?? "";
}
