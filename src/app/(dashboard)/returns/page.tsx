"use client";

import { useEffect, useState } from "react";

type ReturnOrder = {
  id: string;
  returnNumber: string;
  status: string;
  reason: string;
  returnDate: string;
  totalAmount: string;
  originalOrder: { orderNumber: string };
  buyerCompany: { name: string };
  supplierCompany: { name: string };
  requestedBy: { name: string };
};

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
  REQUESTED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  SHIPPED: "bg-yellow-100 text-yellow-800",
  RECEIVED: "bg-indigo-100 text-indigo-800",
  CREDITED: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

const reasonLabel: Record<string, string> = {
  QUALITY_ISSUE: "品質不良",
  WRONG_ITEM: "誤配送",
  QUANTITY_ERROR: "数量相違",
  EXPIRY_ISSUE: "賞味期限問題",
  DAMAGE: "破損",
  ORDER_CANCEL: "注文キャンセル",
  OTHER: "その他",
};

const statusOptions = [
  { value: "", label: "すべて" },
  { value: "REQUESTED", label: "返品申請" },
  { value: "APPROVED", label: "承認済" },
  { value: "REJECTED", label: "却下" },
  { value: "SHIPPED", label: "返送中" },
  { value: "RECEIVED", label: "受領済" },
  { value: "CREDITED", label: "赤伝処理済" },
  { value: "COMPLETED", label: "完了" },
];

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);

    fetch(`/api/returns?${params.toString()}`)
      .then((res) => res.json() as Promise<ReturnOrder[]>)
      .then(setReturns);
  }, [filterStatus]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">返品管理</h1>
        <a
          href="/returns/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          返品申請
        </a>
      </div>

      <div className="mt-4">
        <label className="mr-2 text-sm font-medium text-gray-700">
          ステータス:
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                返品番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                元発注番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                買主
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                状態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                返品理由
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                金額
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                申請日
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {returns.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  返品データがありません
                </td>
              </tr>
            )}
            {returns.map((ret) => (
              <tr key={ret.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600">
                  <a href={`/returns/${ret.id}`}>{ret.returnNumber}</a>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {ret.originalOrder.orderNumber}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {ret.buyerCompany.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      statusColor[ret.status] ?? "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusLabel[ret.status] ?? ret.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {reasonLabel[ret.reason] ?? ret.reason}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  ¥{Number(ret.totalAmount).toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(ret.returnDate).toLocaleDateString("ja-JP")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
