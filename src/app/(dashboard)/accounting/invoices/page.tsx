"use client";

import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  subtotal: string;
  taxAmount: string;
  taxRate: string;
  totalAmount: string;
  status: string;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  issuerCompany: { name: string };
  recipientCompany: { name: string };
  order: { orderNumber: string };
};

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
  CANCELLED: "bg-gray-100 text-gray-500",
};

const allStatuses = [
  { value: "", label: "すべて" },
  { value: "DRAFT", label: "下書き" },
  { value: "ISSUED", label: "発行済" },
  { value: "SENT", label: "送付済" },
  { value: "PAID", label: "入金済" },
  { value: "OVERDUE", label: "期限超過" },
  { value: "CANCELLED", label: "取消" },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);

    fetch(`/api/invoices?${params.toString()}`)
      .then((res) => res.json())
      .then(setInvoices);
  }, [filterStatus]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">請求書管理</h1>
      </div>

      {/* フィルター */}
      <div className="mt-4 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">
          ステータス:
        </label>
        <div className="flex gap-2">
          {allStatuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                filterStatus === s.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
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
                発行先
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                発行日
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                支払期限
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                金額（税込）
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                税率
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                状態
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {invoices.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  請求書データがありません
                </td>
              </tr>
            )}
            {invoices.map((invoice) => {
              const isOverdue =
                invoice.status !== "PAID" &&
                invoice.status !== "CANCELLED" &&
                new Date(invoice.dueDate) < new Date();

              return (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {invoice.order.orderNumber}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {invoice.recipientCompany.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(invoice.issueDate).toLocaleDateString("ja-JP")}
                  </td>
                  <td
                    className={`whitespace-nowrap px-6 py-4 text-sm ${
                      isOverdue ? "font-medium text-red-600" : "text-gray-500"
                    }`}
                  >
                    {new Date(invoice.dueDate).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ¥{Number(invoice.totalAmount).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {(Number(invoice.taxRate) * 100).toFixed(0)}%
                    {Number(invoice.taxRate) <= 0.08 && (
                      <span className="ml-1 text-xs text-orange-600">
                        (軽減)
                      </span>
                    )}
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
