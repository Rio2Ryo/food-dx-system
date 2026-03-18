"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Invoice = {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  taxAmount: string;
  status: string;
  issueDate: string;
  dueDate: string;
  issuerCompany: { name: string };
  recipientCompany: { name: string };
  order: { orderNumber: string };
};

type SummaryData = {
  accountsReceivable: number; // 売掛金残高
  accountsPayable: number; // 買掛金残高
  monthlySales: number; // 今月売上
  monthlyPurchases: number; // 今月仕入
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

export default function AccountingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    accountsReceivable: 0,
    accountsPayable: 0,
    monthlySales: 0,
    monthlyPurchases: 0,
  });

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data: Invoice[]) => {
        setInvoices(data);

        // サマリー計算
        const ar = data
          .filter(
            (inv) =>
              inv.status !== "PAID" &&
              inv.status !== "CANCELLED"
          )
          .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlySales = data
          .filter(
            (inv) =>
              new Date(inv.issueDate) >= monthStart &&
              inv.status !== "CANCELLED"
          )
          .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

        setSummary({
          accountsReceivable: ar,
          accountsPayable: 0,
          monthlySales,
          monthlyPurchases: 0,
        });
      });
  }, []);

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">会計連携</h1>
      </div>

      {/* サマリーカード */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            売掛金残高
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            ¥{summary.accountsReceivable.toLocaleString()}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            買掛金残高
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            ¥{summary.accountsPayable.toLocaleString()}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            今月売上
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-blue-600">
            ¥{summary.monthlySales.toLocaleString()}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            今月仕入
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-blue-600">
            ¥{summary.monthlyPurchases.toLocaleString()}
          </dd>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/accounting/invoices"
          className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center hover:border-blue-500 hover:bg-blue-50"
        >
          <div>
            <p className="text-lg font-medium text-gray-900">請求書管理</p>
            <p className="mt-1 text-sm text-gray-500">
              請求書の作成・管理を行います
            </p>
          </div>
        </Link>
        <Link
          href="/accounting/export"
          className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center hover:border-blue-500 hover:bg-blue-50"
        >
          <div>
            <p className="text-lg font-medium text-gray-900">
              データエクスポート
            </p>
            <p className="mt-1 text-sm text-gray-500">
              会計ソフト連携用のデータを出力します
            </p>
          </div>
        </Link>
        <Link
          href="/accounting/export"
          className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center hover:border-blue-500 hover:bg-blue-50"
        >
          <div>
            <p className="text-lg font-medium text-gray-900">仕訳帳</p>
            <p className="mt-1 text-sm text-gray-500">
              仕訳データの確認・手動入力を行います
            </p>
          </div>
        </Link>
      </div>

      {/* 最近の請求書 */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">最近の請求書</h2>
          <Link
            href="/accounting/invoices"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            すべて表示
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
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
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  状態
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {recentInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    請求書データがありません
                  </td>
                </tr>
              )}
              {recentInvoices.map((invoice) => (
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
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ¥{Number(invoice.totalAmount).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        statusColor[invoice.status] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabel[invoice.status] ?? invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
