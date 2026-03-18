import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

// 在庫一覧取得
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get("companyId");
  const productId = searchParams.get("productId");
  const category = searchParams.get("category");
  const lowStock = searchParams.get("lowStock");
  const expiringSoon = searchParams.get("expiringSoon");

  const where: Record<string, unknown> = {};
  if (companyId) where.companyId = companyId;
  if (productId) where.productId = productId;
  if (category) {
    where.product = { category };
  }
  if (lowStock) {
    const threshold = Number(lowStock);
    where.quantity = { lt: threshold };
  }
  if (expiringSoon) {
    const days = Number(expiringSoon);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    where.expiryDate = {
      not: null,
      lte: futureDate,
    };
  }

  const inventory = await prisma.inventory.findMany({
    where,
    include: {
      product: true,
      company: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(inventory);
}

// 在庫登録・更新（upsert）
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (await request.json()) as any;

  const inventory = await prisma.inventory.upsert({
    where: {
      productId_companyId_lotNumber: {
        productId: body.productId,
        companyId: body.companyId,
        lotNumber: body.lotNumber ?? null,
      },
    },
    update: {
      quantity: body.quantity,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      location: body.location,
    },
    create: {
      productId: body.productId,
      companyId: body.companyId,
      quantity: body.quantity,
      lotNumber: body.lotNumber ?? null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      location: body.location,
    },
    include: {
      product: true,
      company: true,
    },
  });

  // 取引履歴を自動作成
  await prisma.inventoryTransaction.create({
    data: {
      inventoryId: inventory.id,
      type: body.transactionType ?? "IN",
      quantity: body.quantity,
      reason: body.reason ?? "在庫登録",
      performedById: body.performedById ?? null,
    },
  });

  return NextResponse.json(inventory, { status: 201 });
}
