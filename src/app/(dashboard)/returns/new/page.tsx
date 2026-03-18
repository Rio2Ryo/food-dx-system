"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  product: {
    id: string;
    name: string;
    code: string;
    unit: string;
  };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  buyer: { id: string; name: string };
  supplier: { id: string; name: string };
  orderedBy: { id: string; name: string };
  items: OrderItem[];
};

type ReturnItem = {
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  maxQuantity: number;
  quantity: number;
  unitPrice: number;
  condition: string;
  selected: boolean;
};

const reasonOptions = [
  { value: "QUALITY_ISSUE", label: "品質不良" },
  { value: "WRONG_ITEM", label: "誤配送" },
  { value: "QUANTITY_ERROR", label: "数量相違" },
  { value: "EXPIRY_ISSUE", label: "賞味期限問題" },
  { value: "DAMAGE", label: "破損" },
  { value: "ORDER_CANCEL", label: "注文キャンセル" },
  { value: "OTHER", label: "その他" },
];

const conditionOptions = [
  { value: "UNOPENED", label: "未開封" },
  { value: "OPENED", label: "開封済" },
  { value: "DAMAGED", label: "破損" },
  { value: "EXPIRED", label: "期限切れ" },
];

export default function NewReturnPage() {
  const [step, setStep] = useState(1);
  const [orderSearch, setOrderSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 納品済の発注を検索
  useEffect(() => {
    fetch("/api/orders?status=DELIVERED")
      .then((res) => res.json())
      .then(setOrders);
  }, []);

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.buyer.name.includes(orderSearch) ||
      o.supplier.name.includes(orderSearch)
  );

  function handleSelectOrder(order: Order) {
    setSelectedOrder(order);
    setReturnItems(
      order.items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productCode: item.product.code,
        unit: item.product.unit,
        maxQuantity: Number(item.quantity),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        condition: "UNOPENED",
        selected: false,
      }))
    );
    setStep(2);
  }

  function handleItemToggle(index: number) {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  }

  function handleItemQuantity(index: number, value: number) {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.min(Math.max(0, value), item.maxQuantity) }
          : item
      )
    );
  }

  function handleItemCondition(index: number, value: string) {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, condition: value } : item
      )
    );
  }

  const selectedItems = returnItems.filter((item) => item.selected);
  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  function goToReview() {
    if (selectedItems.length === 0) {
      setError("返品する商品を選択してください");
      return;
    }
    if (!reason) {
      setError("返品理由を選択してください");
      return;
    }
    setError("");
    setStep(3);
  }

  async function handleSubmit() {
    if (!selectedOrder) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalOrderId: selectedOrder.id,
          requestedById: selectedOrder.orderedBy.id,
          reason,
          reasonDetail: reasonDetail || undefined,
          notes: notes || undefined,
          items: selectedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            condition: item.condition,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "返品申請の作成に失敗しました");
        return;
      }

      window.location.href = "/returns";
    } catch {
      setError("返品申請の作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">返品申請</h1>

      {/* ステップインジケーター */}
      <div className="mt-6 flex items-center space-x-4">
        {[
          { num: 1, label: "発注選択" },
          { num: 2, label: "商品選択" },
          { num: 3, label: "確認・送信" },
        ].map((s) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s.num
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {s.num}
            </div>
            <span
              className={`ml-2 text-sm ${
                step >= s.num
                  ? "font-medium text-gray-900"
                  : "text-gray-500"
              }`}
            >
              {s.label}
            </span>
            {s.num < 3 && (
              <div className="mx-4 h-px w-12 bg-gray-300" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ステップ1: 発注選択 */}
      {step === 1 && (
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            元発注を選択
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            返品対象の納品済発注を選択してください。
          </p>
          <input
            type="text"
            placeholder="発注番号・会社名で検索..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="max-h-96 overflow-y-auto">
            {filteredOrders.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500">
                納品済の発注が見つかりません
              </p>
            )}
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => handleSelectOrder(order)}
                className="cursor-pointer border-b border-gray-100 px-4 py-3 hover:bg-blue-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-blue-600">
                      {order.orderNumber}
                    </span>
                    <span className="ml-3 text-sm text-gray-600">
                      {order.buyer.name} → {order.supplier.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-900">
                    ¥{Number(order.totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ステップ2: 商品選択 */}
      {step === 2 && selectedOrder && (
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            返品商品の選択
          </h2>
          <p className="mb-1 text-sm text-gray-600">
            元発注: <span className="font-medium">{selectedOrder.orderNumber}</span>
          </p>
          <p className="mb-4 text-sm text-gray-600">
            {selectedOrder.buyer.name} → {selectedOrder.supplier.name}
          </p>

          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              返品理由 <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              {reasonOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              詳細説明
            </label>
            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="返品理由の詳細を記入..."
            />
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  選択
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  商品コード
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  商品名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  数量
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  単価
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  商品状態
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  小計
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {returnItems.map((item, index) => (
                <tr
                  key={item.productId}
                  className={item.selected ? "bg-blue-50" : ""}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => handleItemToggle(index)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {item.productCode}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {item.productName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={item.maxQuantity}
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemQuantity(index, parseFloat(e.target.value) || 0)
                        }
                        disabled={!item.selected}
                        className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                      />
                      <span className="text-xs text-gray-500">
                        / {item.maxQuantity} {item.unit}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    ¥{item.unitPrice.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <select
                      value={item.condition}
                      onChange={(e) =>
                        handleItemCondition(index, e.target.value)
                      }
                      disabled={!item.selected}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                    >
                      {conditionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {item.selected
                      ? `¥${(item.quantity * item.unitPrice).toLocaleString()}`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mb-4 mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              備考
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="備考を記入..."
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => {
                setStep(1);
                setSelectedOrder(null);
                setReturnItems([]);
                setError("");
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              戻る
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                返品合計: ¥{totalAmount.toLocaleString()}
              </span>
              <button
                onClick={goToReview}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                確認へ進む
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ステップ3: 確認・送信 */}
      {step === 3 && selectedOrder && (
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            返品申請内容の確認
          </h2>

          <div className="mb-6 grid grid-cols-2 gap-4 rounded-md bg-gray-50 p-4">
            <div>
              <span className="text-xs text-gray-500">元発注番号</span>
              <p className="text-sm font-medium text-gray-900">
                {selectedOrder.orderNumber}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">買主</span>
              <p className="text-sm font-medium text-gray-900">
                {selectedOrder.buyer.name}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">受注先</span>
              <p className="text-sm font-medium text-gray-900">
                {selectedOrder.supplier.name}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">返品理由</span>
              <p className="text-sm font-medium text-gray-900">
                {reasonOptions.find((r) => r.value === reason)?.label}
              </p>
            </div>
            {reasonDetail && (
              <div className="col-span-2">
                <span className="text-xs text-gray-500">詳細説明</span>
                <p className="text-sm text-gray-900">{reasonDetail}</p>
              </div>
            )}
            {notes && (
              <div className="col-span-2">
                <span className="text-xs text-gray-500">備考</span>
                <p className="text-sm text-gray-900">{notes}</p>
              </div>
            )}
          </div>

          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            返品商品
          </h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  商品コード
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  商品名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  数量
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  単価
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  商品状態
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  小計
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {selectedItems.map((item) => (
                <tr key={item.productId}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {item.productCode}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {item.productName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    ¥{item.unitPrice.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {conditionOptions.find((c) => c.value === item.condition)?.label}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    ¥{(item.quantity * item.unitPrice).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 border-t pt-4 text-right">
            <span className="text-lg font-bold text-gray-900">
              返品合計: ¥{totalAmount.toLocaleString()}
            </span>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => {
                setStep(2);
                setError("");
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              戻る
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "送信中..." : "返品申請を送信"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
