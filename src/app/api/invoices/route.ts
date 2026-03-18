import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

// 請求書一覧取得
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get("companyId");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};

  if (companyId) {
    where.OR = [
      { issuerCompanyId: companyId },
      { recipientCompanyId: companyId },
    ];
  }
  if (status) where.status = status;
  if (from || to) {
    where.issueDate = {};
    if (from) (where.issueDate as Record<string, unknown>).gte = new Date(from);
    if (to) (where.issueDate as Record<string, unknown>).lte = new Date(to);
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      order: true,
      issuerCompany: true,
      recipientCompany: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

// 請求書作成（発注から自動生成）
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  const body = (await request.json()) as Record<string, unknown>;
  const {
    orderId,
    issuerCompanyId,
    recipientCompanyId,
    dueDate,
    taxRate: customTaxRate,
    notes,
    createdById,
  } = body as {
    orderId: string;
    issuerCompanyId: string;
    recipientCompanyId: string;
    dueDate: string;
    taxRate?: number;
    notes?: string;
    createdById?: string;
  };

  // 発注情報を取得
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      buyer: true,
      supplier: true,
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "発注が見つかりません" },
      { status: 404 }
    );
  }

  // 請求書番号の自動生成 (INV-YYYYMMDD-XXX)
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const todayCount = await prisma.invoice.count({
    where: {
      createdAt: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
  });

  const invoiceNumber = `INV-${dateStr}-${String(todayCount + 1).padStart(3, "0")}`;

  // 小計計算
  const subtotal = Number(order.totalAmount);

  // 食品業界は軽減税率8%を適用（デフォルト）、それ以外は10%
  const taxRate = customTaxRate ?? 0.08;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const totalAmount = subtotal + taxAmount;

  // 請求書と仕訳を同時に作成
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId,
      issuerCompanyId,
      recipientCompanyId,
      dueDate: new Date(dueDate),
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      notes,
      // 自動仕訳作成
      journalEntries: createdById
        ? {
            create: [
              // 発行者側の仕訳: 売掛金 / 売上
              {
                entryDate: now,
                description: `請求書 ${invoiceNumber} 発行（${order.orderNumber}）`,
                companyId: issuerCompanyId,
                createdById,
                lines: {
                  create: [
                    {
                      accountCode: "1150",
                      accountName: "売掛金",
                      debitAmount: totalAmount,
                      creditAmount: 0,
                      taxCategory: "対象外",
                      description: `${order.orderNumber} 売掛金計上`,
                    },
                    {
                      accountCode: "4100",
                      accountName: "売上高",
                      debitAmount: 0,
                      creditAmount: subtotal,
                      taxCategory:
                        taxRate <= 0.08
                          ? "課税売上8%(軽減)"
                          : "課税売上10%",
                      description: `${order.orderNumber} 売上計上`,
                    },
                    {
                      accountCode: "2180",
                      accountName: "仮受消費税",
                      debitAmount: 0,
                      creditAmount: taxAmount,
                      taxCategory: "対象外",
                      description: `${order.orderNumber} 消費税`,
                    },
                  ],
                },
              },
            ],
          }
        : undefined,
    },
    include: {
      order: true,
      issuerCompany: true,
      recipientCompany: true,
      journalEntries: {
        include: { lines: true },
      },
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
