import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

// 仕訳一覧取得
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get("companyId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const isPosted = searchParams.get("isPosted");

  const where: Record<string, unknown> = {};

  if (companyId) where.companyId = companyId;
  if (isPosted !== null && isPosted !== undefined) {
    where.isPosted = isPosted === "true";
  }
  if (from || to) {
    where.entryDate = {};
    if (from)
      (where.entryDate as Record<string, unknown>).gte = new Date(from);
    if (to) (where.entryDate as Record<string, unknown>).lte = new Date(to);
  }

  const journalEntries = await prisma.journalEntry.findMany({
    where,
    include: {
      lines: true,
      invoice: true,
      company: true,
      createdBy: true,
    },
    orderBy: { entryDate: "desc" },
  });

  return NextResponse.json(journalEntries);
}

// 手動仕訳作成
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  const body = (await request.json()) as Record<string, unknown>;
  const { companyId, createdById, description, entryDate, lines } = body as {
    companyId: string;
    createdById: string;
    description: string;
    entryDate: string;
    lines: Array<{
      accountCode: string;
      accountName: string;
      debitAmount: number;
      creditAmount: number;
      taxCategory?: string;
      description?: string;
    }>;
  };

  if (!lines || lines.length === 0) {
    return NextResponse.json(
      { error: "仕訳明細が必要です" },
      { status: 400 }
    );
  }

  // 借方合計と貸方合計が一致するか確認
  const totalDebit = lines.reduce(
    (sum: number, l: { debitAmount: number }) => sum + Number(l.debitAmount),
    0
  );
  const totalCredit = lines.reduce(
    (sum: number, l: { creditAmount: number }) => sum + Number(l.creditAmount),
    0
  );

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return NextResponse.json(
      { error: "借方合計と貸方合計が一致しません" },
      { status: 400 }
    );
  }

  const journalEntry = await prisma.journalEntry.create({
    data: {
      companyId,
      createdById,
      description,
      entryDate: entryDate ? new Date(entryDate) : new Date(),
      lines: {
        create: lines.map(
          (line: {
            accountCode: string;
            accountName: string;
            debitAmount: number;
            creditAmount: number;
            taxCategory?: string;
            description?: string;
          }) => ({
            accountCode: line.accountCode,
            accountName: line.accountName,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            taxCategory: line.taxCategory ?? null,
            description: line.description ?? null,
          })
        ),
      },
    },
    include: {
      lines: true,
      company: true,
      createdBy: true,
    },
  });

  return NextResponse.json(journalEntry, { status: 201 });
}
