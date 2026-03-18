import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 発注一覧取得
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const companyId = searchParams.get("companyId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (companyId) {
    where.OR = [
      { buyerCompanyId: companyId },
      { supplierCompanyId: companyId },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      buyer: true,
      supplier: true,
      orderedBy: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

// 発注作成
export async function POST(request: NextRequest) {
  const body = await request.json();

  const orderNumber = `ORD-${Date.now()}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      buyerCompanyId: body.buyerCompanyId,
      supplierCompanyId: body.supplierCompanyId,
      orderedById: body.orderedById,
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
      notes: body.notes,
      items: {
        create: body.items.map(
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
    },
  });

  // 合計金額を更新
  const totalAmount = order.items.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );
  await prisma.order.update({
    where: { id: order.id },
    data: { totalAmount },
  });

  return NextResponse.json(order, { status: 201 });
}
