"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  totalAmount: number;
  buyer: { name: string };
  supplier: { name: string };
};

const SAMPLE_ORDERS: Order[] = [
  {
    id: "sample-1",
    orderNumber: "ORD-20260301-001",
    status: "CONFIRMED",
    orderDate: "2026-03-01",
    totalAmount: 156800,
    buyer: { name: "株式会社マルシェ" },
    supplier: { name: "青果卸売 田中商店" },
  },
  {
    id: "sample-2",
    orderNumber: "ORD-20260305-002",
    status: "SHIPPED",
    orderDate: "2026-03-05",
    totalAmount: 89400,
    buyer: { name: "レストラン花園" },
    supplier: { name: "水産物流通 山田商事" },
  },
  {
    id: "sample-3",
    orderNumber: "ORD-20260310-003",
    status: "DELIVERED",
    orderDate: "2026-03-10",
    totalAmount: 234500,
    buyer: { name: "スーパーマーケット吉田" },
    supplier: { name: "精肉卸売 鈴木商店" },
  },
  {
    id: "sample-4",
    orderNumber: "ORD-20260312-004",
    status: "DRAFT",
    orderDate: "2026-03-12",
    totalAmount: 45200,
    buyer: { name: "カフェ Green Leaf" },
    supplier: { name: "有機野菜 農園さくら" },
  },
  {
    id: "sample-5",
    orderNumber: "ORD-20260315-005",
    status: "SUBMITTED",
    orderDate: "2026-03-15",
    totalAmount: 312000,
    buyer: { name: "ホテルオーシャン" },
    supplier: { name: "冷凍食品 北海道フーズ" },
  },
];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "下書き",
  SUBMITTED: "発注済",
  CONFIRMED: "確認済",
  SHIPPED: "出荷済",
  DELIVERED: "納品済",
  CANCELLED: "キャンセル",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  SHIPPED: "bg-yellow-100 text-yellow-800",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingSample, setUsingSample] = useState(false);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json() as Promise<Order[]>;
      })
      .then((data) => {
        if (!data || data.length === 0) {
          setOrders(SAMPLE_ORDERS);
          setUsingSample(true);
        } else {
          setOrders(data);
        }
      })
      .catch(() => {
        setOrders(SAMPLE_ORDERS);
        setUsingSample(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">発注管理</h1>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新規発注
        </button>
      </div>

      {/* Sample data banner */}
      {usingSample && (
        <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-sm text-amber-800">
            サンプルデータを表示しています。データベースに発注データが登録されると実データに切り替わります。
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="mt-6 flex items-center justify-center rounded-lg bg-white py-20 shadow">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="mt-3 text-sm text-gray-500">読み込み中...</p>
          </div>
        </div>
      ) : (
        /* Orders table */
        <div className="mt-6 overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-600">
                  発注番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-600">
                  発注元
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-600">
                  発注先
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-600">
                  ステータス
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold tracking-wider text-gray-600">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-600">
                  発注日
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600 hover:text-blue-800">
                    <a href={`/orders/${order.id}`}>{order.orderNumber}</a>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {order.buyer.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {order.supplier.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_BADGE_CLASS[order.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 text-right tabular-nums">
                    ¥{Number(order.totalAmount).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(order.orderDate).toLocaleDateString("ja-JP")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              全 <span className="font-medium">{orders.length}</span> 件
            </p>
            <p className="text-sm text-gray-600">
              合計:{" "}
              <span className="font-semibold text-gray-900">
                ¥{orders.reduce((sum, o) => sum + Number(o.totalAmount), 0).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
