"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  issuerName: string;
  recipientName: string;
  totalAmount: number;
  status: string;
  issueDate: string;
};

const sampleInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-20260301-001",
    orderNumber: "ORD-20260301-001",
    issuerName: "青果卸売 田中商店",
    recipientName: "株式会社マルシェ",
    totalAmount: 156800,
    status: "PAID",
    issueDate: "2026-03-01",
  },
  {
    id: "2",
    invoiceNumber: "INV-20260305-001",
    orderNumber: "ORD-20260305-002",
    issuerName: "水産物流通 山田商事",
    recipientName: "レストラン花園",
    totalAmount: 89400,
    status: "ISSUED",
    issueDate: "2026-03-05",
  },
  {
    id: "3",
    invoiceNumber: "INV-20260310-001",
    orderNumber: "ORD-20260310-003",
    issuerName: "精肉卸売 鈴木商店",
    recipientName: "スーパーマーケット吉田",
    totalAmount: 234500,
    status: "OVERDUE",
    issueDate: "2026-03-10",
  },
  {
    id: "4",
    invoiceNumber: "INV-20260315-001",
    orderNumber: "ORD-20260315-005",
    issuerName: "冷凍食品 北海道フーズ",
    recipientName: "ホテルオーシャン",
    totalAmount: 312000,
    status: "DRAFT",
    issueDate: "2026-03-15",
  },
];

const statusLabel: Record<string, string> = {
  DRAFT: "下書き",
  ISSUED: "発行済",
  SENT: "送付済",
  PAID: "入金済",
  OVERDUE: "期限超過",
  CANCELLED: "取消",
};

const statusColor: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 ring-slate-200",
  ISSUED: "bg-blue-50 text-blue-700 ring-blue-200",
  SENT: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  OVERDUE: "bg-red-50 text-red-700 ring-red-200 font-bold",
  CANCELLED: "bg-slate-50 text-slate-400 ring-slate-200 line-through",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(sampleInvoices);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json() as Promise<Invoice[]>;
      })
      .then((data) => {
        if (data && data.length > 0) {
          setInvoices(
            data.map((inv: Record<string, unknown>) => ({
              id: inv.id as string,
              invoiceNumber: inv.invoiceNumber as string,
              orderNumber:
                (inv.order as { orderNumber: string } | undefined)
                  ?.orderNumber ?? (inv.orderNumber as string),
              issuerName:
                (inv.issuerCompany as { name: string } | undefined)?.name ??
                (inv.issuerName as string),
              recipientName:
                (inv.recipientCompany as { name: string } | undefined)?.name ??
                (inv.recipientName as string),
              totalAmount: Number(inv.totalAmount),
              status: inv.status as string,
              issueDate: inv.issueDate as string,
            }))
          );
        }
      })
      .catch(() => {
        // API失敗時はサンプルデータを維持
      });
  }, []);

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidCount = invoices.filter((inv) => inv.status === "PAID").length;
  const overdueCount = invoices.filter((inv) => inv.status === "OVERDUE").length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/accounting"
              className="transition-colors hover:text-indigo-600"
            >
              会計連携
            </Link>
            <svg
              className="h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
            <span className="text-slate-700">請求書一覧</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            請求書一覧
          </h1>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <span className="text-sm text-slate-500">全{invoices.length}件</span>
        </div>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-sm text-slate-500">入金済 {paidCount}件</span>
        </div>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="text-sm text-slate-500">
            期限超過 {overdueCount}件
          </span>
        </div>
        <div className="ml-auto text-sm text-slate-500">
          合計{" "}
          <span className="font-semibold text-slate-900">
            ¥{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                請求書番号
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                発注番号
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                発行元 → 請求先
              </th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                金額
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                ステータス
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                発行日
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-sm text-slate-400"
                >
                  請求書データがありません
                </td>
              </tr>
            )}
            {invoices.map((invoice, idx) => (
              <tr
                key={invoice.id}
                className={`transition-colors hover:bg-slate-50 ${
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                }`}
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-indigo-600">
                  {invoice.invoiceNumber}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  {invoice.orderNumber}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span className="font-medium text-slate-800">
                    {invoice.issuerName}
                  </span>
                  <span className="mx-2 inline-flex items-center text-slate-300">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </span>
                  <span className="text-slate-600">
                    {invoice.recipientName}
                  </span>
                </td>
                <td
                  className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold tabular-nums ${
                    invoice.status === "OVERDUE"
                      ? "text-red-600"
                      : invoice.status === "PAID"
                        ? "text-emerald-600"
                        : "text-slate-900"
                  }`}
                >
                  ¥{invoice.totalAmount.toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ring-inset ${
                      statusColor[invoice.status] ??
                      "bg-slate-100 text-slate-600 ring-slate-200"
                    }`}
                  >
                    {statusLabel[invoice.status] ?? invoice.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                  {formatDate(invoice.issueDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
