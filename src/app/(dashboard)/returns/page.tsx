"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ReturnOrder = {
  returnNumber: string;
  originalOrderNumber: string;
  reason: string;
  status: string;
  amount: number;
  buyer: string;
};

const sampleReturns: ReturnOrder[] = [
  {
    returnNumber: "RET-20260310-001",
    originalOrderNumber: "ORD-20260301-001",
    reason: "品質不良",
    status: "APPROVED",
    amount: 12400,
    buyer: "株式会社マルシェ",
  },
  {
    returnNumber: "RET-20260312-002",
    originalOrderNumber: "ORD-20260305-002",
    reason: "数量相違",
    status: "COMPLETED",
    amount: 8900,
    buyer: "レストラン花園",
  },
  {
    returnNumber: "RET-20260315-003",
    originalOrderNumber: "ORD-20260310-003",
    reason: "賞味期限問題",
    status: "REQUESTED",
    amount: 45600,
    buyer: "スーパーマーケット吉田",
  },
  {
    returnNumber: "RET-20260316-004",
    originalOrderNumber: "ORD-20260312-004",
    reason: "破損",
    status: "CREDITED",
    amount: 5200,
    buyer: "カフェ Green Leaf",
  },
];

const statusLabel: Record<string, string> = {
  REQUESTED: "返品申請",
  APPROVED: "承認済",
  REJECTED: "却下",
  SHIPPED: "返送中",
  RECEIVED: "受領済",
  CREDITED: "赤伝処理済",
  COMPLETED: "完了",
};

const statusColor: Record<string, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  RECEIVED: "bg-purple-100 text-purple-800",
  CREDITED: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnOrder[]>([]);

  useEffect(() => {
    fetch("/api/returns")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<ReturnOrder[]>;
      })
      .then((data) => {
        if (!data || data.length === 0) {
          setReturns(sampleReturns);
        } else {
          setReturns(data);
        }
      })
      .catch(() => {
        setReturns(sampleReturns);
      });
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">返品管理</h1>
        <Link
          href="/returns/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          返品申請
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                返品番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                元発注番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                返品理由
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                ステータス
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                金額
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                発注元
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {returns.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  返品データを読み込み中...
                </td>
              </tr>
            ) : (
              returns.map((ret) => (
                <tr
                  key={ret.returnNumber}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600">
                    {ret.returnNumber}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {ret.originalOrderNumber}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {ret.reason}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColor[ret.status] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabel[ret.status] ?? ret.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    &yen;{ret.amount.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {ret.buyer}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
