"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  totalAmount: string;
  buyer: { name: string };
  supplier: { name: string };
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json() as Promise<Order[]>)
      .then(setOrders);
  }, []);

  const statusLabel: Record<string, string> = {
    DRAFT: "下書き",
    SUBMITTED: "発注済",
    CONFIRMED: "確認済",
    SHIPPED: "出荷済",
    DELIVERED: "納品済",
    CANCELLED: "キャンセル",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">発注管理</h1>
        <a
          href="/orders/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規発注
        </a>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                発注番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                発注元
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                受注先
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                合計金額
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                発注日
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600">
                  <a href={`/orders/${order.id}`}>{order.orderNumber}</a>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {order.buyer.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {order.supplier.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">
                    {statusLabel[order.status] ?? order.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  ¥{Number(order.totalAmount).toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(order.orderDate).toLocaleDateString("ja-JP")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
