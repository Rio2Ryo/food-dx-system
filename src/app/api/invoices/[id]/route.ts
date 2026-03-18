import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 請求書詳細取得
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      order: {
        include: {
          items: { include: { product: true } },
          buyer: true,
          supplier: true,
        },
      },
      issuerCompany: true,
      recipientCompany: true,
      journalEntries: {
        include: {
          lines: true,
          createdBy: true,
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json(
      { error: "請求書が見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json(invoice);
}

// 請求書ステータス更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { status, notes } = body;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
  });

  if (!invoice) {
    return NextResponse.json(
      { error: "請求書が見つかりません" },
      { status: 404 }
    );
  }

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (notes !== undefined) data.notes = notes;

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data,
    include: {
      order: true,
      issuerCompany: true,
      recipientCompany: true,
      journalEntries: {
        include: { lines: true },
      },
    },
  });

  return NextResponse.json(updated);
}
