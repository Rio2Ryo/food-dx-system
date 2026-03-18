import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 在庫詳細取得（取引履歴付き）
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const inventory = await prisma.inventory.findUnique({
    where: { id: params.id },
    include: {
      product: true,
      company: true,
      transactions: {
        include: {
          performedBy: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!inventory) {
    return NextResponse.json({ error: "在庫が見つかりません" }, { status: 404 });
  }

  return NextResponse.json(inventory);
}

// 在庫調整（ADJUSTMENT取引を自動作成）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const existing = await prisma.inventory.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "在庫が見つかりません" }, { status: 404 });
  }

  const updatedInventory = await prisma.inventory.update({
    where: { id: params.id },
    data: {
      quantity: body.quantity ?? existing.quantity,
      expiryDate: body.expiryDate !== undefined
        ? body.expiryDate ? new Date(body.expiryDate) : null
        : existing.expiryDate,
      location: body.location ?? existing.location,
    },
    include: {
      product: true,
      company: true,
    },
  });

  // 数量変更があった場合は調整取引を作成
  if (body.quantity !== undefined && Number(body.quantity) !== Number(existing.quantity)) {
    const adjustmentQty = Number(body.quantity) - Number(existing.quantity);
    await prisma.inventoryTransaction.create({
      data: {
        inventoryId: params.id,
        type: "ADJUSTMENT",
        quantity: adjustmentQty,
        reason: body.reason ?? "棚卸調整",
        referenceType: "ADJUSTMENT",
        performedById: body.performedById ?? null,
      },
    });
  }

  return NextResponse.json(updatedInventory);
}

// 在庫削除
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const existing = await prisma.inventory.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "在庫が見つかりません" }, { status: 404 });
  }

  // 関連する取引履歴も削除
  await prisma.inventoryTransaction.deleteMany({
    where: { inventoryId: params.id },
  });

  await prisma.inventory.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: "在庫を削除しました" });
}
