"use client";

import { useEffect, useState, useMemo } from "react";

type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  status: "アクティブ" | "非アクティブ";
};

const sampleProducts: Product[] = [
  { id: "1", code: "PRD-001", name: "有機トマト", category: "野菜", unit: "kg", price: 450, status: "アクティブ" },
  { id: "2", code: "PRD-002", name: "北海道産鮭", category: "水産物", unit: "kg", price: 1800, status: "アクティブ" },
  { id: "3", code: "PRD-003", name: "黒毛和牛ロース", category: "精肉", unit: "kg", price: 5200, status: "アクティブ" },
  { id: "4", code: "PRD-004", name: "有機バナナ", category: "果物", unit: "箱", price: 2400, status: "アクティブ" },
  { id: "5", code: "PRD-005", name: "冷凍エビフライ", category: "冷凍食品", unit: "箱", price: 3600, status: "アクティブ" },
  { id: "6", code: "PRD-006", name: "特選醤油", category: "調味料", unit: "本", price: 680, status: "非アクティブ" },
];

function formatPrice(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div
            className="h-4 animate-pulse rounded bg-slate-200"
            style={{ width: i === 0 ? "5rem" : i === 4 ? "4rem" : "7rem" }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingSample, setUsingSample] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<Product[]>;
      })
      .then((data) => {
        if (!data || data.length === 0) {
          setProducts(sampleProducts);
          setUsingSample(true);
        } else {
          setProducts(data);
        }
      })
      .catch(() => {
        setProducts(sampleProducts);
        setUsingSample(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.status.includes(q)
    );
  }, [products, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">商品マスタ</h1>
          <p className="mt-1 text-sm text-slate-500">
            商品情報の登録・編集・ステータス管理を行います
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
          商品登録
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
          placeholder="商品コード、商品名、カテゴリで検索..."
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
                  商品コード
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  商品名
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  カテゴリ
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  単位
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  単価
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ステータス
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredProducts.length === 0 ? (
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
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      <p className="text-sm font-medium text-slate-900">商品データがありません</p>
                      <p className="text-sm text-slate-500">
                        {searchQuery
                          ? "検索条件に一致する商品が見つかりませんでした"
                          : "商品を登録してください"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="even:bg-slate-50/50 hover:bg-indigo-50/40 transition-colors cursor-pointer"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-700">
                        {product.code}
                      </code>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {product.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {product.category}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {product.unit}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium tabular-nums text-slate-900">
                      {formatPrice(product.price)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          product.status === "アクティブ"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                            : "bg-slate-100 text-slate-600 ring-slate-500/20"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              全 <span className="font-medium text-slate-700">{filteredProducts.length}</span> 件
              {searchQuery && filteredProducts.length !== products.length && (
                <span className="ml-1 text-slate-400">
                  （{products.length} 件中）
                </span>
              )}
            </p>
            <p className="text-sm text-slate-500">
              アクティブ{" "}
              <span className="font-semibold text-slate-900">
                {filteredProducts.filter((p) => p.status === "アクティブ").length}
              </span>{" "}
              件
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
