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
  REQUESTED: "bg-amber-50 text-amber-700 ring-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 ring-blue-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  RECEIVED: "bg-purple-50 text-purple-700 ring-purple-200",
  CREDITED: "bg-orange-50 text-orange-700 ring-orange-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const reasonColor: Record<string, string> = {
  品質不良: "bg-red-50 text-red-600 ring-red-200",
  数量相違: "bg-amber-50 text-amber-600 ring-amber-200",
  賞味期限問題: "bg-orange-50 text-orange-600 ring-orange-200",
  破損: "bg-red-50 text-red-600 ring-red-200",
  誤配送: "bg-slate-100 text-slate-600 ring-slate-200",
  その他: "bg-slate-100 text-slate-600 ring-slate-200",
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

  const totalAmount = returns.reduce((sum, r) => sum + r.amount, 0);
  const pendingCount = returns.filter(
    (r) => r.status === "REQUESTED" || r.status === "APPROVED"
  ).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">返品管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            返品申請の確認・処理を行います
          </p>
        </div>
        <Link
          href="/returns/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          返品申請
        </Link>
      </div>

      {/* Summary Strip */}
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <span className="text-sm text-slate-500">全{returns.length}件</span>
        </div>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span className="text-sm text-slate-500">
            対応中 {pendingCount}件
          </span>
        </div>
        <div className="ml-auto text-sm text-slate-500">
          返品合計{" "}
          <span className="font-semibold text-slate-900">
            ¥{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Returns Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                返品番号
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                元発注番号
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                発注元
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                返品理由
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                ステータス
              </th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                金額
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {returns.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-sm text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="h-8 w-8 text-slate-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                      />
                    </svg>
                    <span>返品データを読み込み中...</span>
                  </div>
                </td>
              </tr>
            ) : (
              returns.map((ret, idx) => (
                <tr
                  key={ret.returnNumber}
                  className={`transition-colors hover:bg-slate-50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-indigo-600">
                    {ret.returnNumber}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {ret.originalOrderNumber}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-800">
                    {ret.buyer}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        reasonColor[ret.reason] ??
                        "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}
                    >
                      {ret.reason}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        statusColor[ret.status] ??
                        "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}
                    >
                      {statusLabel[ret.status] ?? ret.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold tabular-nums text-slate-900">
                    ¥{ret.amount.toLocaleString()}
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
