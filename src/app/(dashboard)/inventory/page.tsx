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

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [expiryFilter, setExpiryFilter] = useState<"all" | "expiring" | "expired">("all");
  const [showStockInModal, setShowStockInModal] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: InventoryItem[] = data.map((item: Record<string, unknown>, index: number) => ({
            id: (item.id as string) ?? String(index),
            productName: ((item as Record<string, unknown>).product as Record<string, string>)?.name ?? (item.productName as string) ?? "",
            productCode: ((item as Record<string, unknown>).product as Record<string, string>)?.code ?? (item.productCode as string) ?? "",
            company: ((item as Record<string, unknown>).company as Record<string, string>)?.name ?? (item.company as string) ?? "",
            quantity: Number(item.quantity) || 0,
            unit: ((item as Record<string, unknown>).product as Record<string, string>)?.unit ?? (item.unit as string) ?? "",
            lotNumber: (item.lotNumber as string) ?? "",
            location: (item.location as string) ?? "",
            expiryDate: (item.expiryDate as string) ?? "",
          }));
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
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  };

  const isExpired = (expiryDate: string): boolean => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const locations = useMemo(() => {
    return Array.from(new Set(inventory.map((item) => item.location).filter(Boolean)));
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // Text search
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

      // Location filter
      if (locationFilter && item.location !== locationFilter) return false;

      // Expiry filter
      if (expiryFilter === "expiring" && !isExpiringSoon(item.expiryDate)) return false;
      if (expiryFilter === "expired" && !isExpired(item.expiryDate)) return false;

      return true;
    });
  }, [inventory, searchQuery, locationFilter, expiryFilter]);

  const getRowClassName = (item: InventoryItem): string => {
    if (isExpired(item.expiryDate)) {
      return "bg-red-100 hover:bg-red-200";
    }
    if (isExpiringSoon(item.expiryDate)) {
      return "bg-amber-50 hover:bg-amber-100";
    }
    return "hover:bg-gray-50";
  };

  const getExpiryBadge = (expiryDate: string) => {
    if (isExpired(expiryDate)) {
      return (
        <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
          期限切れ
        </span>
      );
    }
    if (isExpiringSoon(expiryDate)) {
      return (
        <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          期限間近
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">在庫管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            現在の在庫状況を確認・管理できます
          </p>
        </div>
        <button
          onClick={() => setShowStockInModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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

      {/* Search and Filters */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px]">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Location filter */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
            onChange={(e) => setExpiryFilter(e.target.value as "all" | "expiring" | "expired")}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">全期限状態</option>
            <option value="expiring">期限間近（7日以内）</option>
            <option value="expired">期限切れ</option>
          </select>

          {/* Result count */}
          <span className="text-sm text-gray-500">
            {filteredInventory.length} 件表示
          </span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-gray-500">読み込み中...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    商品名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    商品コード
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    所有企業
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                    数量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    ロット番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    保管場所
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    賞味期限
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className={getRowClassName(item)}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {item.productName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">
                        {item.productCode}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {item.company}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {item.quantity.toLocaleString("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="ml-1 text-xs font-normal text-gray-500">{item.unit}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      <span className="font-mono text-xs">{item.lotNumber}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {item.location}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={
                          isExpired(item.expiryDate)
                            ? "font-bold text-red-700"
                            : isExpiringSoon(item.expiryDate)
                            ? "font-semibold text-amber-700"
                            : "text-gray-600"
                        }
                      >
                        {item.expiryDate
                          ? new Date(item.expiryDate).toLocaleDateString("ja-JP")
                          : "-"}
                      </span>
                      {item.expiryDate && getExpiryBadge(item.expiryDate)}
                    </td>
                  </tr>
                ))}
                {filteredInventory.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
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

      {/* 入庫登録モーダル (UI only) */}
      {showStockInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">入庫登録</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  商品名
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="商品名を入力"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    商品コード
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="PRD-XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    数量
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  所有企業
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="企業名を入力"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ロット番号
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="LOT-XXXX-XX-X"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    保管場所
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="倉庫・棚番号"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  賞味期限
                </label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowStockInModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => setShowStockInModal(false)}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
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
