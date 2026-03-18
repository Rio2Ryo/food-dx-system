"use client";

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
  DRAFT: "bg-gray-100 text-gray-800",
  ISSUED: "bg-blue-100 text-blue-800",
  SENT: "bg-indigo-100 text-indigo-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500 line-through",
};

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">請求書一覧</h1>
      </div>

      {/* 請求書テーブル */}
      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                請求書番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                発注番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                発行元 → 請求先
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                金額
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                発行日
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {invoices.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  請求書データがありません
                </td>
              </tr>
            )}
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600">
                  {invoice.invoiceNumber}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {invoice.orderNumber}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {invoice.issuerName}
                  <span className="mx-1 text-gray-400">→</span>
                  {invoice.recipientName}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                  ¥{invoice.totalAmount.toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      statusColor[invoice.status] ??
                      "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusLabel[invoice.status] ?? invoice.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(invoice.issueDate).toLocaleDateString("ja-JP")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
