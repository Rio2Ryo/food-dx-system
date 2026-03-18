import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exportToYayoi,
  exportToFreee,
  exportToMoneyForward,
  exportToGenericCsv,
} from "@/lib/accounting-export";

// 会計データエクスポート
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { companyId, format, periodStart, periodEnd } = body;

  if (!companyId || !format || !periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "必須項目が不足しています（companyId, format, periodStart, periodEnd）" },
      { status: 400 }
    );
  }

  // 期間内の仕訳を取得
  const journalEntries = await prisma.journalEntry.findMany({
    where: {
      companyId,
      entryDate: {
        gte: new Date(periodStart),
        lte: new Date(periodEnd),
      },
    },
    include: {
      lines: true,
      invoice: true,
    },
    orderBy: { entryDate: "asc" },
  });

  if (journalEntries.length === 0) {
    return NextResponse.json(
      { error: "指定期間内に仕訳データがありません" },
      { status: 404 }
    );
  }

  // フォーマットに応じてCSV生成
  let csvContent: string;
  let fileExtension = "csv";

  const entriesForExport = journalEntries.map((entry) => ({
    entryDate: entry.entryDate,
    description: entry.description,
    lines: entry.lines.map((line) => ({
      accountCode: line.accountCode,
      accountName: line.accountName,
      debitAmount: line.debitAmount.toString(),
      creditAmount: line.creditAmount.toString(),
      taxCategory: line.taxCategory,
      description: line.description,
    })),
  }));

  const formatLabels: Record<string, string> = {
    YAYOI: "弥生会計",
    FREEE: "freee",
    MONEYFORWARD: "マネーフォワード",
    CSV_GENERIC: "汎用CSV",
  };

  switch (format) {
    case "YAYOI":
      csvContent = exportToYayoi(entriesForExport);
      break;
    case "FREEE":
      csvContent = exportToFreee(entriesForExport);
      break;
    case "MONEYFORWARD":
      csvContent = exportToMoneyForward(entriesForExport);
      break;
    case "CSV_GENERIC":
      csvContent = exportToGenericCsv(entriesForExport);
      break;
    default:
      return NextResponse.json(
        { error: "不正なフォーマットです" },
        { status: 400 }
      );
  }

  // エクスポート記録を保存
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  const startStr = `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, "0")}${String(startDate.getDate()).padStart(2, "0")}`;
  const endStr = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, "0")}${String(endDate.getDate()).padStart(2, "0")}`;
  const fileName = `${format.toLowerCase()}_${startStr}_${endStr}.${fileExtension}`;

  const exportRecord = await prisma.accountingExport.create({
    data: {
      companyId,
      format,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      fileName,
      status: "COMPLETED",
      exportedAt: new Date(),
    },
  });

  return NextResponse.json({
    export: exportRecord,
    csvContent,
    fileName,
    formatLabel: formatLabels[format] ?? format,
    entryCount: journalEntries.length,
  });
}

// エクスポート履歴取得
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get("companyId");

  const where: Record<string, unknown> = {};
  if (companyId) where.companyId = companyId;

  const exports = await prisma.accountingExport.findMany({
    where,
    include: {
      company: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exports);
}
