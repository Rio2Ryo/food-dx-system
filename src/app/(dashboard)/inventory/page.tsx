"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type InventoryItem = {
  id: string;
  quantity: string;
  lotNumber: string | null;
  expiryDate: string | null;
  location: string | null;
  updatedAt: string;
  product: {
    id: string;
    code: string;
    name: string;
    unit: string;
    price: string;
    category: string | null;
  };
  company: {
    id: string;
    name: string;
  };
};

type TransactionFormData = {
  inventoryId: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN_IN" | "RETURN_OUT";
  quantity: string;
  reason: string;
};

type NewInventoryFormData = {
  productId: string;
  companyId: string;
  quantity: string;
  lotNumber: string;
  expiryDate: string;
  location: string;
  transactionType: "IN" | "OUT";
  reason: string;
};

type ProductOption = {
  id: string;
  code: string;
  name: string;
  unit: string;
  category: string | null;
};

type CompanyOption = {
  id: string;
  name: string;
};

const transactionTypeLabel: Record<string, string> = {
  IN: "入庫",
  OUT: "出庫",
  ADJUSTMENT: "棚卸調整",
  RETURN_IN: "返品入庫",
  RETURN_OUT: "返品出庫",
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState<TransactionFormData>({
    inventoryId: "",
    type: "ADJUSTMENT",
    quantity: "",
    reason: "",
  });
  const [newStockForm, setNewStockForm] = useState<NewInventoryFormData>({
    productId: "",
    companyId: "",
    quantity: "",
    lotNumber: "",
    expiryDate: "",
    location: "",
    transactionType: "IN",
    reason: "",
  });
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);

  const fetchInventory = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (lowStockOnly) params.set("lowStock", "10");
    if (expiringSoonOnly) params.set("expiringSoon", "7");

    fetch(`/api/inventory?${params.toString()}`)
      .then((res) => res.json())
      .then((data: InventoryItem[]) => {
        setInventory(data);
        const cats = Array.from(
          new Set(
            data
              .map((item) => item.product.category)
              .filter((c): c is string => c !== null)
          )
        );
        if (!selectedCategory) {
          setCategories(cats);
        }
      });
  }, [selectedCategory, lowStockOnly, expiringSoonOnly]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    // カテゴリ一覧のため全在庫を1回取得
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((data: InventoryItem[]) => {
        const cats = Array.from(
          new Set(
            data
              .map((item) => item.product.category)
              .filter((c): c is string => c !== null)
          )
        );
        setCategories(cats);
      });
  }, []);

  const isLowStock = (quantity: string) => Number(quantity) < 10;
  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays < 7;
  };
  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const handleAdjustment = async () => {
    if (!adjustForm.inventoryId || !adjustForm.quantity) return;

    await fetch("/api/inventory/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inventoryId: adjustForm.inventoryId,
        type: adjustForm.type,
        quantity: Number(adjustForm.quantity),
        reason: adjustForm.reason || undefined,
      }),
    });

    setShowAdjustModal(false);
    setAdjustForm({ inventoryId: "", type: "ADJUSTMENT", quantity: "", reason: "" });
    fetchInventory();
  };

  const openStockModal = async (type: "IN" | "OUT") => {
    // 商品・企業一覧を取得
    const [productsRes, inventoryRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/inventory"),
    ]);
    const productsData = await productsRes.json();
    const inventoryData: InventoryItem[] = await inventoryRes.json();
    setProducts(productsData);
    // 企業一覧を在庫データから抽出
    const companiesMap = new Map<string, string>();
    inventoryData.forEach((item) => {
      companiesMap.set(item.company.id, item.company.name);
    });
    // 商品データからも企業情報を取得できないので、一旦在庫に含まれる企業を使う
    setCompanies(
      Array.from(companiesMap.entries()).map(([id, name]) => ({ id, name }))
    );
    setNewStockForm({
      productId: "",
      companyId: "",
      quantity: "",
      lotNumber: "",
      expiryDate: "",
      location: "",
      transactionType: type,
      reason: "",
    });
    if (type === "IN") {
      setShowStockInModal(true);
    } else {
      setShowStockOutModal(true);
    }
  };

  const handleStockInOut = async () => {
    if (!newStockForm.productId || !newStockForm.companyId || !newStockForm.quantity) return;

    // まず既存の在庫を探す
    const params = new URLSearchParams({
      productId: newStockForm.productId,
      companyId: newStockForm.companyId,
    });
    const existingRes = await fetch(`/api/inventory?${params.toString()}`);
    const existingData: InventoryItem[] = await existingRes.json();

    const matchingInventory = existingData.find(
      (item) =>
        item.product.id === newStockForm.productId &&
        item.company.id === newStockForm.companyId &&
        (item.lotNumber ?? "") === newStockForm.lotNumber
    );

    if (matchingInventory) {
      // 既存在庫に対して取引を作成
      await fetch("/api/inventory/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: matchingInventory.id,
          type: newStockForm.transactionType,
          quantity: Number(newStockForm.quantity),
          reason: newStockForm.reason || undefined,
        }),
      });
    } else {
      // 新規在庫として登録
      await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: newStockForm.productId,
          companyId: newStockForm.companyId,
          quantity: Number(newStockForm.quantity),
          lotNumber: newStockForm.lotNumber || undefined,
          expiryDate: newStockForm.expiryDate || undefined,
          location: newStockForm.location || undefined,
          transactionType: newStockForm.transactionType,
          reason: newStockForm.reason || `${newStockForm.transactionType === "IN" ? "入庫" : "出庫"}登録`,
        }),
      });
    }

    setShowStockInModal(false);
    setShowStockOutModal(false);
    fetchInventory();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">在庫管理</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => openStockModal("IN")}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            入庫登録
          </button>
          <button
            onClick={() => openStockModal("OUT")}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            出庫登録
          </button>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            在庫調整
          </button>
          <Link
            href="/inventory/history"
            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            取引履歴
          </Link>
        </div>
      </div>

      {/* フィルター */}
      <div className="mt-4 flex items-center space-x-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">全カテゴリ</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <label className="flex items-center space-x-1 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span>在庫少 (10未満)</span>
        </label>
        <label className="flex items-center space-x-1 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={expiringSoonOnly}
            onChange={(e) => setExpiringSoonOnly(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span>期限間近 (7日以内)</span>
        </label>
      </div>

      {/* 在庫一覧テーブル */}
      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
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
                現在庫数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                単位
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ロット番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                賞味期限
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                保管場所
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                最終更新
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {inventory.map((item) => {
              const lowStock = isLowStock(item.quantity);
              const expiring = isExpiringSoon(item.expiryDate);
              const expired = isExpired(item.expiryDate);

              let rowClass = "hover:bg-gray-50";
              if (expired) rowClass = "bg-red-100 hover:bg-red-150";
              else if (lowStock && expiring) rowClass = "bg-red-50 hover:bg-red-100";
              else if (lowStock) rowClass = "bg-red-50 hover:bg-red-100";
              else if (expiring) rowClass = "bg-yellow-50 hover:bg-yellow-100";

              return (
                <tr key={item.id} className={rowClass}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {item.product.code}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {item.product.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {item.product.category ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={
                        lowStock
                          ? "font-bold text-red-600"
                          : "text-gray-900"
                      }
                    >
                      {Number(item.quantity).toLocaleString("ja-JP")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {item.product.unit}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {item.lotNumber ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {item.expiryDate ? (
                      <span
                        className={
                          expired
                            ? "font-bold text-red-600"
                            : expiring
                            ? "font-bold text-yellow-600"
                            : "text-gray-500"
                        }
                      >
                        {new Date(item.expiryDate).toLocaleDateString("ja-JP")}
                        {expired && " (期限切れ)"}
                        {expiring && !expired && " (期限間近)"}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {item.location ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(item.updatedAt).toLocaleDateString("ja-JP")}
                  </td>
                </tr>
              );
            })}
            {inventory.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  在庫データがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 在庫調整モーダル */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">在庫調整</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  対象在庫
                </label>
                <select
                  value={adjustForm.inventoryId}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, inventoryId: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">選択してください</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.product.code} - {item.product.name}
                      {item.lotNumber ? ` (${item.lotNumber})` : ""} [現在庫:{" "}
                      {Number(item.quantity).toLocaleString("ja-JP")}
                      {item.product.unit}]
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  取引種別
                </label>
                <select
                  value={adjustForm.type}
                  onChange={(e) =>
                    setAdjustForm({
                      ...adjustForm,
                      type: e.target.value as TransactionFormData["type"],
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {Object.entries(transactionTypeLabel).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  数量
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustForm.quantity}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, quantity: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="数量を入力"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  理由
                </label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, reason: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="調整理由を入力"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleAdjustment}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                実行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 入庫登録モーダル */}
      {showStockInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">入庫登録</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  商品
                </label>
                <select
                  value={newStockForm.productId}
                  onChange={(e) =>
                    setNewStockForm({ ...newStockForm, productId: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">選択してください</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  企業
                </label>
                <select
                  value={newStockForm.companyId}
                  onChange={(e) =>
                    setNewStockForm({ ...newStockForm, companyId: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">選択してください</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  数量
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newStockForm.quantity}
                  onChange={(e) =>
                    setNewStockForm({ ...newStockForm, quantity: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="入庫数量"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ロット番号
                </label>
                <input
                  type="text"
                  value={newStockForm.lotNumber}
                  onChange={(e) =>
                    setNewStockForm({ ...newStockForm, lotNumber: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="任意"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  賞味期限
                </label>
                <input
                  type="date"
                  value={newStockForm.expiryDate}
                  onChange={(e) =>
                    setNewStockForm({ ...newStockForm, expiryDate: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  保管場所
                </label>
                <input
                  type="text"
                  value={newStockForm.location}
                  onChange={(e) =>
                    setNewStockForm({ ...newStockForm, location: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="倉庫・棚番号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  理由
                </label>
                <input
                  type="text"
                  value={newStockForm.reason}
                  onChange={(e) =>
                    setNewStockForm({ ...newStockForm, reason: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="入庫理由"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowStockInModal(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleStockInOut}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                入庫登録
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 出庫登録モーダル */}
      {showStockOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900">出庫登録</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  商品
                </label>
                <select
                  value={newStockForm.productId}
                  onChange={(e) =>
                    setNewStockForm({ ...newStockForm, productId: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">選択してください</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  企業
                </label>
                <select
                  value={newStockForm.companyId}
                  onChange={(e) =>
                    setNewStockForm({ ...newStockForm, companyId: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">選択してください</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  数量
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newStockForm.quantity}
                  onChange={(e) =>
                    setNewStockForm({ ...newStockForm, quantity: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="出庫数量"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ロット番号
                </label>
                <input
                  type="text"
                  value={newStockForm.lotNumber}
                  onChange={(e) =>
                    setNewStockForm({ ...newStockForm, lotNumber: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="任意"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  理由
                </label>
                <input
                  type="text"
                  value={newStockForm.reason}
                  onChange={(e) =>
                    setNewStockForm({ ...newStockForm, reason: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="出庫理由"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowStockOutModal(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleStockInOut}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                出庫登録
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
