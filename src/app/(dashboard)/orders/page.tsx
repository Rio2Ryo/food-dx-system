"use client";

import { useEffect, useState, useMemo } from "react";

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
  SUBMITTED: "提出済",
  CONFIRMED: "確認済",
  SHIPPED: "出荷中",
  DELIVERED: "納品済",
  CANCELLED: "キャンセル",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-600/20",
  SUBMITTED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  CONFIRMED: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  SHIPPED: "bg-amber-50 text-amber-700 ring-amber-600/20",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
};

function formatDateJP(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 animate-pulse rounded bg-slate-200" style={{ width: i === 4 ? "5rem" : "8rem" }} />
        </td>
      ))}
    </tr>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingSample, setUsingSample] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.buyer.name.toLowerCase().includes(q) ||
        o.supplier.name.toLowerCase().includes(q) ||
        (STATUS_LABEL[o.status] ?? "").includes(q)
    );
  }, [orders, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">発注管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            発注の作成・確認・ステータス管理を行います
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
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
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 flex-shrink-0 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-slate-500">サンプルデータ</p>
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="発注番号、発注元、発注先で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
        />
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  発注番号
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  発注元
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  発注先
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ステータス
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  金額
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  発注日
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p className="text-sm font-medium text-slate-900">発注データがありません</p>
                      <p className="text-sm text-slate-500">
                        {searchQuery
                          ? "検索条件に一致する発注が見つかりませんでした"
                          : "新規発注を作成してください"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="even:bg-slate-50/50 hover:bg-indigo-50/40 transition-colors cursor-pointer"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                      <a href={`/orders/${order.id}`}>{order.orderNumber}</a>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {order.buyer.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {order.supplier.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          STATUS_BADGE_CLASS[order.status] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"
                        }`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium tabular-nums text-slate-900">
                      {formatAmount(order.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {formatDateJP(order.orderDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              全 <span className="font-medium text-slate-700">{filteredOrders.length}</span> 件
              {searchQuery && filteredOrders.length !== orders.length && (
                <span className="ml-1 text-slate-400">
                  （{orders.length} 件中）
                </span>
              )}
            </p>
            <p className="text-sm text-slate-500">
              合計{" "}
              <span className="font-semibold tabular-nums text-slate-900">
                {formatAmount(filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0))}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
