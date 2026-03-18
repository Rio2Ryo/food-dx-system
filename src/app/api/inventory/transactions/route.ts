import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 取引履歴一覧取得
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const inventoryId = searchParams.get("inventoryId");
  const type = searchParams.get("type");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Record<string, unknown> = {};
  if (inventoryId) where.inventoryId = inventoryId;
  if (type) where.type = type;
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      createdAt.lte = to;
    }
    where.createdAt = createdAt;
  }

  const transactions = await prisma.inventoryTransaction.findMany({
    where,
    include: {
      inventory: {
        include: {
          product: true,
          company: true,
        },
      },
      performedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(transactions);
}

// 手動取引作成（入庫・出庫・調整）
export async function POST(request: NextRequest) {
  const body = await request.json();

  const inventory = await prisma.inventory.findUnique({
    where: { id: body.inventoryId },
  });

  if (!inventory) {
    return NextResponse.json({ error: "在庫が見つかりません" }, { status: 404 });
  }

  // 取引に応じて在庫数量を更新
  let newQuantity = Number(inventory.quantity);
  const txQuantity = Number(body.quantity);

  switch (body.type) {
    case "IN":
    case "RETURN_IN":
      newQuantity += txQuantity;
      break;
    case "OUT":
    case "RETURN_OUT":
      newQuantity -= txQuantity;
      break;
    case "ADJUSTMENT":
      newQuantity = txQuantity;
      break;
  }

  // 在庫数量を更新
  await prisma.inventory.update({
    where: { id: body.inventoryId },
    data: { quantity: newQuantity },
  });

  // 取引履歴を作成
  const transaction = await prisma.inventoryTransaction.create({
    data: {
      inventoryId: body.inventoryId,
      type: body.type,
      quantity: body.type === "ADJUSTMENT" ? txQuantity - Number(inventory.quantity) : txQuantity,
      reason: body.reason,
      referenceId: body.referenceId ?? null,
      referenceType: body.referenceType ?? null,
      performedById: body.performedById ?? null,
    },
    include: {
      inventory: {
        include: {
          product: true,
        },
      },
      performedBy: true,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
