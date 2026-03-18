import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 返品詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const returnOrder = await prisma.returnOrder.findUnique({
    where: { id: params.id },
    include: {
      originalOrder: {
        include: {
          buyer: true,
          supplier: true,
          items: { include: { product: true } },
        },
      },
      buyerCompany: true,
      supplierCompany: true,
      requestedBy: true,
      approvedBy: true,
      items: { include: { product: true } },
    },
  });

  if (!returnOrder) {
    return NextResponse.json(
      { error: "返品情報が見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json(returnOrder);
}

// 返品ステータス更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const existing = await prisma.returnOrder.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "返品情報が見つかりません" },
      { status: 404 }
    );
  }

  // ステータス遷移のバリデーション
  const validTransitions: Record<string, string[]> = {
    REQUESTED: ["APPROVED", "REJECTED"],
    APPROVED: ["SHIPPED"],
    SHIPPED: ["RECEIVED"],
    RECEIVED: ["CREDITED"],
    CREDITED: ["COMPLETED"],
  };

  if (body.status) {
    const allowed = validTransitions[existing.status] || [];
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        {
          error: `ステータスを ${existing.status} から ${body.status} に変更できません`,
        },
        { status: 400 }
      );
    }
  }

  const updateData: Record<string, unknown> = {};

  if (body.status) {
    updateData.status = body.status;
  }

  // 承認時に承認者を記録
  if (body.status === "APPROVED" && body.approvedById) {
    updateData.approvedById = body.approvedById;
  }

  // 赤伝処理済（CREDITED）: 赤伝（クレジットノート）が発行されたことを示す
  // TODO: 将来的に在庫管理との連携を実装
  // RECEIVED時に在庫への返品入庫処理を追加予定
  if (body.status === "RECEIVED") {
    // 将来的にここで在庫の更新処理を行う
    // 例: await updateInventoryForReturn(existing.id);
  }

  if (body.notes !== undefined) {
    updateData.notes = body.notes;
  }

  const returnOrder = await prisma.returnOrder.update({
    where: { id: params.id },
    data: updateData,
    include: {
      originalOrder: true,
      buyerCompany: true,
      supplierCompany: true,
      requestedBy: true,
      approvedBy: true,
      items: { include: { product: true } },
    },
  });

  return NextResponse.json(returnOrder);
}
