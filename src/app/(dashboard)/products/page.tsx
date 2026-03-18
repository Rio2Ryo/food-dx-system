"use client";

import { useEffect, useState } from "react";

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<Product[]>;
      })
      .then((data) => {
        if (!data || data.length === 0) {
          setProducts(sampleProducts);
        } else {
          setProducts(data);
        }
      })
      .catch(() => {
        setProducts(sampleProducts);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">商品マスタ</h1>
        <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          商品登録
        </button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                商品コード
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                商品名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                カテゴリ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                単位
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                単価
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ステータス
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {product.code}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {product.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {product.category}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {product.unit}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  ¥{product.price.toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${
                      product.status === "アクティブ"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
