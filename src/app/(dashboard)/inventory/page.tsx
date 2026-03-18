"use client";

import { useEffect, useState, useMemo } from "react";

type InventoryItem = {
  id: string;
  productName: string;
  productCode: string;
  company: string;
  quantity: number;
  unit: string;
  lotNumber: string;
  location: string;
  expiryDate: string;
};

const SAMPLE_INVENTORY: InventoryItem[] = [
  {
    id: "1",
    productName: "有機トマト",
    productCode: "PRD-001",
    company: "株式会社マルシェ",
    quantity: 250.0,
    unit: "kg",
    lotNumber: "LOT-2026-03-A",
    location: "倉庫A-01",
    expiryDate: "2026-03-25",
  },
  {
    id: "2",
    productName: "北海道産鮭",
    productCode: "PRD-002",
    company: "水産物流通 山田商事",
    quantity: 85.5,
    unit: "kg",
    lotNumber: "LOT-2026-03-B",
    location: "冷蔵庫B-02",
    expiryDate: "2026-03-20",
  },
  {
    id: "3",
    productName: "黒毛和牛ロース",
    productCode: "PRD-003",
    company: "精肉卸売 鈴木商店",
    quantity: 32.0,
    unit: "kg",
    lotNumber: "LOT-2026-03-C",
    location: "冷蔵庫C-01",
    expiryDate: "2026-03-22",
  },
  {
    id: "4",
    productName: "有機バナナ",
    productCode: "PRD-004",
    company: "有機野菜 農園さくら",
    quantity: 120.0,
    unit: "箱",
    lotNumber: "LOT-2026-03-D",
    location: "倉庫A-03",
    expiryDate: "2026-03-28",
  },
  {
    id: "5",
    productName: "冷凍エビフライ",
    productCode: "PRD-005",
    company: "冷凍食品 北海道フーズ",
    quantity: 45.0,
    unit: "箱",
    lotNumber: "LOT-2026-03-E",
    location: "冷凍庫D-01",
    expiryDate: "2026-06-30",
  },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [expiryFilter, setExpiryFilter] = useState<
    "all" | "expiring" | "expired"
  >("all");
  const [showStockInModal, setShowStockInModal] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: InventoryItem[] = data.map(
            (item: Record<string, unknown>, index: number) => ({
              id: (item.id as string) ?? String(index),
              productName:
                (
                  (item as Record<string, unknown>).product as Record<
                    string,
                    string
                  >
                )?.name ??
                (item.productName as string) ??
                "",
              productCode:
                (
                  (item as Record<string, unknown>).product as Record<
                    string,
                    string
                  >
                )?.code ??
                (item.productCode as string) ??
                "",
              company:
                (
                  (item as Record<string, unknown>).company as Record<
                    string,
                    string
                  >
                )?.name ??
                (item.company as string) ??
                "",
              quantity: Number(item.quantity) || 0,
              unit:
                (
                  (item as Record<string, unknown>).product as Record<
                    string,
                    string
                  >
                )?.unit ??
                (item.unit as string) ??
                "",
              lotNumber: (item.lotNumber as string) ?? "",
              location: (item.location as string) ?? "",
              expiryDate: (item.expiryDate as string) ?? "",
            })
          );
          setInventory(mapped);
        } else {
          setInventory(SAMPLE_INVENTORY);
        }
      } catch {
        setInventory(SAMPLE_INVENTORY);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const isExpiringSoon = (expiryDate: string): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays =
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  };

  const isExpired = (expiryDate: string): boolean => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const locations = useMemo(() => {
    return Array.from(
      new Set(inventory.map((item) => item.location).filter(Boolean))
    );
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          item.productName.toLowerCase().includes(q) ||
          item.productCode.toLowerCase().includes(q) ||
          item.company.toLowerCase().includes(q) ||
          item.lotNumber.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      if (locationFilter && item.location !== locationFilter) return false;
      if (expiryFilter === "expiring" && !isExpiringSoon(item.expiryDate))
        return false;
      if (expiryFilter === "expired" && !isExpired(item.expiryDate))
        return false;
      return true;
    });
  }, [inventory, searchQuery, locationFilter, expiryFilter]);

  const getRowClassName = (item: InventoryItem, index: number): string => {
    if (isExpired(item.expiryDate)) {
      return "bg-red-50 hover:bg-red-100";
    }
    if (isExpiringSoon(item.expiryDate)) {
      return "bg-amber-50 hover:bg-amber-100";
    }
    return index % 2 === 0
      ? "bg-white hover:bg-slate-50"
      : "bg-slate-50/50 hover:bg-slate-100/60";
  };

  const getExpiryBadge = (expiryDate: string) => {
    if (isExpired(expiryDate)) {
      return (
        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
          期限切れ
        </span>
      );
    }
    if (isExpiringSoon(expiryDate)) {
      return (
        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
          期限間近
        </span>
      );
    }
    return null;
  };

  // Summary counts
  const expiringCount = inventory.filter((i) =>
    isExpiringSoon(i.expiryDate)
  ).length;
  const expiredCount = inventory.filter((i) =>
    isExpired(i.expiryDate)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            在庫管理
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            現在の在庫状況を確認・管理できます
          </p>
        </div>
        <button
          onClick={() => setShowStockInModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          入庫登録
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <svg
                className="h-5 w-5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">総在庫アイテム</p>
              <p className="text-xl font-bold text-slate-900">
                {inventory.length}
                <span className="ml-1 text-sm font-normal text-slate-400">
                  件
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <svg
                className="h-5 w-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-amber-700">期限間近（7日以内）</p>
              <p className="text-xl font-bold text-amber-800">
                {expiringCount}
                <span className="ml-1 text-sm font-normal text-amber-500">
                  件
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <svg
                className="h-5 w-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-red-700">期限切れ</p>
              <p className="text-xl font-bold text-red-800">
                {expiredCount}
                <span className="ml-1 text-sm font-normal text-red-400">
                  件
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search box */}
          <div className="relative min-w-[280px] flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="商品名・商品コード・企業名・ロット番号で検索..."
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Location filter */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">全保管場所</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Expiry filter */}
          <select
            value={expiryFilter}
            onChange={(e) =>
              setExpiryFilter(
                e.target.value as "all" | "expiring" | "expired"
              )
            }
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">全期限状態</option>
            <option value="expiring">期限間近（7日以内）</option>
            <option value="expired">期限切れ</option>
          </select>

          {/* Result count */}
          <span className="text-sm text-slate-500">
            {filteredInventory.length} 件表示
          </span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <svg
                className="h-5 w-5 animate-spin text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              読み込み中...
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    商品名
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    商品コード
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    所有企業
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    数量
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    ロット番号
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    保管場所
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    賞味期限
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${getRowClassName(item, index)}`}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {item.productName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                        {item.productCode}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {item.company}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums">
                      <span className="font-semibold text-slate-900">
                        {item.quantity.toLocaleString("ja-JP", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="ml-1 text-xs text-slate-400">
                        {item.unit}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      <span className="font-mono text-xs">
                        {item.lotNumber}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          className="h-3.5 w-3.5 text-slate-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                          />
                        </svg>
                        {item.location}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <div className="flex items-center">
                        <span
                          className={
                            isExpired(item.expiryDate)
                              ? "font-bold text-red-700"
                              : isExpiringSoon(item.expiryDate)
                                ? "font-semibold text-amber-700"
                                : "text-slate-600"
                          }
                        >
                          {formatDate(item.expiryDate)}
                        </span>
                        {item.expiryDate && getExpiryBadge(item.expiryDate)}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInventory.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center text-sm text-slate-400"
                    >
                      <svg
                        className="mx-auto mb-3 h-8 w-8 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 11.625l2.25-2.25M12 11.625l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                        />
                      </svg>
                      {searchQuery || locationFilter || expiryFilter !== "all"
                        ? "条件に一致する在庫データがありません"
                        : "在庫データがありません"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock-in Modal */}
      {showStockInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">入庫登録</h2>
              <button
                onClick={() => setShowStockInModal(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  商品名
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="商品名を入力"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    商品コード
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="PRD-XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    数量
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  所有企業
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="企業名を入力"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    ロット番号
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="LOT-XXXX-XX-X"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    保管場所
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="倉庫・棚番号"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  賞味期限
                </label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowStockInModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => setShowStockInModal(false)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                登録する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
