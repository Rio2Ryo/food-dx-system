"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Transaction = {
  id: string;
  type: string;
  quantity: string;
  reason: string | null;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
  inventory: {
    id: string;
    product: {
      code: string;
      name: string;
      unit: string;
    };
    company: {
      name: string;
    };
  };
  performedBy: {
    name: string;
  } | null;
};

const transactionTypeLabel: Record<string, string> = {
  IN: "入庫",
  OUT: "出庫",
  ADJUSTMENT: "棚卸調整",
  RETURN_IN: "返品入庫",
  RETURN_OUT: "返品出庫",
};

const transactionTypeBadgeClass: Record<string, string> = {
  IN: "bg-green-100 text-green-800",
  OUT: "bg-orange-100 text-orange-800",
  ADJUSTMENT: "bg-blue-100 text-blue-800",
  RETURN_IN: "bg-purple-100 text-purple-800",
  RETURN_OUT: "bg-red-100 text-red-800",
};

export default function InventoryHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchTransactions = useCallback(() => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    fetch(`/api/inventory/transactions?${params.toString()}`)
      .then((res) => res.json() as Promise<Transaction[]>)
      .then(setTransactions);
  }, [typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">取引履歴</h1>
        <Link
          href="/inventory"
          className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          在庫一覧に戻る
        </Link>
      </div>

      {/* フィルター */}
      <div className="mt-4 flex items-center space-x-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">全取引種別</option>
          {Object.entries(transactionTypeLabel).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-700">期間:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="text-sm text-gray-500">〜</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* 取引履歴テーブル */}
      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                日時
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                商品名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                取引種別
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                数量
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                理由
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                実施者
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(tx.createdAt).toLocaleString("ja-JP", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  <div>{tx.inventory.product.name}</div>
                  <div className="text-xs text-gray-500">
                    {tx.inventory.product.code}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      transactionTypeBadgeClass[tx.type] ??
                      "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {transactionTypeLabel[tx.type] ?? tx.type}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {Number(tx.quantity) > 0 ? "+" : ""}
                  {Number(tx.quantity).toLocaleString("ja-JP")}{" "}
                  {tx.inventory.product.unit}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {tx.reason ?? "-"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {tx.performedBy?.name ?? "-"}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  取引履歴がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
