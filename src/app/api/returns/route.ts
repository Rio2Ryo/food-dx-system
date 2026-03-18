import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

// 返品一覧取得
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const companyId = searchParams.get("companyId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (companyId) {
    where.OR = [
      { buyerCompanyId: companyId },
      { supplierCompanyId: companyId },
    ];
  }
  if (from || to) {
    where.returnDate = {};
    if (from) (where.returnDate as Record<string, unknown>).gte = new Date(from);
    if (to) (where.returnDate as Record<string, unknown>).lte = new Date(to);
  }

  const returns = await prisma.returnOrder.findMany({
    where,
    include: {
      originalOrder: true,
      buyerCompany: true,
      supplierCompany: true,
      requestedBy: true,
      approvedBy: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(returns);
}

// 返品申請作成
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (await request.json()) as any;

  // 元発注の存在確認とステータスチェック
  const originalOrder = await prisma.order.findUnique({
    where: { id: body.originalOrderId },
    include: { items: true },
  });

  if (!originalOrder) {
    return NextResponse.json(
      { error: "元発注が見つかりません" },
      { status: 404 }
    );
  }

  if (originalOrder.status !== "DELIVERED") {
    return NextResponse.json(
      { error: "納品済の発注に対してのみ返品申請が可能です" },
      { status: 400 }
    );
  }

  // 返品番号の自動生成（RET-YYYYMMDD-XXX）
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `RET-${dateStr}-`;

  const lastReturn = await prisma.returnOrder.findFirst({
    where: { returnNumber: { startsWith: prefix } },
    orderBy: { returnNumber: "desc" },
  });

  let seq = 1;
  if (lastReturn) {
    const lastSeq = parseInt(lastReturn.returnNumber.split("-").pop() || "0", 10);
    seq = lastSeq + 1;
  }
  const returnNumber = `${prefix}${String(seq).padStart(3, "0")}`;

  // 明細の金額計算
  const items = body.items.map(
    (item: { productId: string; quantity: number; unitPrice: number; condition?: string }) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
      condition: item.condition || "UNOPENED",
    })
  );

  const totalAmount = items.reduce(
    (sum: number, item: { amount: number }) => sum + item.amount,
    0
  );

  const returnOrder = await prisma.returnOrder.create({
    data: {
      returnNumber,
      originalOrderId: body.originalOrderId,
      buyerCompanyId: originalOrder.buyerCompanyId,
      supplierCompanyId: originalOrder.supplierCompanyId,
      requestedById: body.requestedById,
      reason: body.reason,
      reasonDetail: body.reasonDetail || null,
      totalAmount,
      notes: body.notes || null,
      items: {
        create: items,
      },
    },
    include: {
      originalOrder: true,
      buyerCompany: true,
      supplierCompany: true,
      requestedBy: true,
      items: { include: { product: true } },
    },
  });

  return NextResponse.json(returnOrder, { status: 201 });
}
