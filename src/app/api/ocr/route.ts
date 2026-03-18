import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTextFromImage } from "@/lib/vision";
import { parseOrderDocument } from "@/lib/ocr-parser";
import { matchProductsGlobal } from "@/lib/product-matcher";

// OCRスキャン一覧取得
export async function GET() {
  const scans = await prisma.ocrScan.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
        },
      },
    },
  });

  // Parse parsedData from JSON string back to object for the client
  const scansWithParsedData = scans.map((scan) => ({
    ...scan,
    parsedData: scan.parsedData ? JSON.parse(scan.parsedData) : null,
  }));

  return NextResponse.json(scansWithParsedData);
}

// OCRで注文書画像を読み取り・解析
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
  }

  // 対応ファイル形式のチェック
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/tiff"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "対応していないファイル形式です。JPEG, PNG, GIF, WebP, TIFF形式の画像をアップロードしてください。" },
      { status: 400 }
    );
  }

  const scan = await prisma.ocrScan.create({
    data: {
      imageUrl: file.name,
      status: "PROCESSING",
    },
  });

  try {
    // OCRテキスト抽出
    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractTextFromImage(buffer);

    if (!rawText || rawText.trim().length === 0) {
      const updatedScan = await prisma.ocrScan.update({
        where: { id: scan.id },
        data: {
          rawText: "",
          status: "COMPLETED",
          confidence: 0,
        },
      });

      return NextResponse.json({
        ...updatedScan,
        parsedData: null,
        matchedItems: [],
        message: "画像からテキストを検出できませんでした。",
      });
    }

    // テキスト解析
    const parsedData = parseOrderDocument(rawText);

    // 商品マッチング（全商品から）
    let matchedItems = [];
    try {
      matchedItems = await matchProductsGlobal(parsedData.items);
    } catch {
      // 商品マッチングに失敗してもOCR結果は返す
      matchedItems = parsedData.items.map((item) => ({
        parsedItem: item,
        matchConfidence: 0,
        isExactMatch: false,
      }));
    }

    // データベースに保存（parsedData is String? in SQLite, so stringify it）
    const updatedScan = await prisma.ocrScan.update({
      where: { id: scan.id },
      data: {
        rawText,
        parsedData: JSON.stringify(parsedData),
        status: "COMPLETED",
        documentType: parsedData.documentType,
        confidence: parsedData.confidence,
      },
    });

    return NextResponse.json({
      ...updatedScan,
      parsedData, // Return the parsed object, not the stringified DB value
      matchedItems,
    });
  } catch (error) {
    await prisma.ocrScan.update({
      where: { id: scan.id },
      data: { status: "FAILED" },
    });

    return NextResponse.json(
      { error: "OCR処理に失敗しました", details: String(error) },
      { status: 500 }
    );
  }
}
