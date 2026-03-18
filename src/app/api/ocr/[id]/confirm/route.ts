import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * OCR解析結果を確定し、発注データを作成する
 *
 * リクエストボディ:
 * {
 *   buyerCompanyId: string,      // 発注元会社ID
 *   supplierCompanyId: string,   // 受注先会社ID
 *   orderedById: string,         // 発注担当者ID
 *   deliveryDate?: string,       // 納品日 (YYYY-MM-DD)
 *   notes?: string,              // 備考
 *   items: Array<{
 *     productId: string,         // 商品ID（既存商品）
 *     quantity: number,          // 数量
 *     unitPrice: number,         // 単価
 *   }>
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const scanId = params.id;

  // OCRスキャンレコードの確認
  const scan = await prisma.ocrScan.findUnique({
    where: { id: scanId },
  });

  if (!scan) {
    return NextResponse.json(
      { error: "指定されたOCRスキャンが見つかりません" },
      { status: 404 }
    );
  }

  if (scan.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "OCR処理が完了していないスキャンです" },
      { status: 400 }
    );
  }

  if (scan.orderId) {
    return NextResponse.json(
      { error: "このスキャンは既に発注データに紐づいています", orderId: scan.orderId },
      { status: 409 }
    );
  }

  try {
    const body = await request.json();
    const { buyerCompanyId, supplierCompanyId, orderedById, deliveryDate, notes, items } = body;

    // バリデーション
    if (!buyerCompanyId || !supplierCompanyId || !orderedById) {
      return NextResponse.json(
        { error: "発注元会社ID、受注先会社ID、発注担当者IDは必須です" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "明細行が必要です" },
        { status: 400 }
      );
    }

    // 会社・ユーザーの存在確認
    const [buyer, supplier, user] = await Promise.all([
      prisma.company.findUnique({ where: { id: buyerCompanyId } }),
      prisma.company.findUnique({ where: { id: supplierCompanyId } }),
      prisma.user.findUnique({ where: { id: orderedById } }),
    ]);

    if (!buyer) {
      return NextResponse.json(
        { error: "発注元会社が見つかりません" },
        { status: 400 }
      );
    }
    if (!supplier) {
      return NextResponse.json(
        { error: "受注先会社が見つかりません" },
        { status: 400 }
      );
    }
    if (!user) {
      return NextResponse.json(
        { error: "発注担当者が見つかりません" },
        { status: 400 }
      );
    }

    // 商品の存在確認
    const productIds = items.map((item: { productId: string }) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id: string) => !foundIds.has(id));
      return NextResponse.json(
        { error: `以下の商品IDが見つかりません: ${missingIds.join(", ")}` },
        { status: 400 }
      );
    }

    // 発注番号の生成
    const orderNumber = `ORD-${Date.now()}`;

    // トランザクションで発注データを作成
    const order = await prisma.$transaction(async (tx) => {
      // 発注作成
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          buyerCompanyId,
          supplierCompanyId,
          orderedById,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          notes: notes || null,
          status: "DRAFT",
          items: {
            create: items.map(
              (item: { productId: string; quantity: number; unitPrice: number }) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.quantity * item.unitPrice,
              })
            ),
          },
        },
        include: {
          items: { include: { product: true } },
          buyer: true,
          supplier: true,
          orderedBy: true,
        },
      });

      // 合計金額を計算して更新
      const totalAmount = newOrder.items.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );

      await tx.order.update({
        where: { id: newOrder.id },
        data: { totalAmount },
      });

      // OCRスキャンを発注に紐づけ
      await tx.ocrScan.update({
        where: { id: scanId },
        data: { orderId: newOrder.id },
      });

      return { ...newOrder, totalAmount };
    });

    return NextResponse.json(
      {
        message: "発注データを作成しました",
        order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("発注データ作成エラー:", error);
    return NextResponse.json(
      { error: "発注データの作成に失敗しました", details: String(error) },
      { status: 500 }
    );
  }
}
