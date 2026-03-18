"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ======== 型定義 ========

interface ParsedLineItem {
  productName: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  amount?: number;
  confidence: number;
}

interface ParsedOrderData {
  documentType: "ORDER" | "DELIVERY_NOTE" | "INVOICE" | "UNKNOWN";
  buyerName?: string;
  supplierName?: string;
  documentNumber?: string;
  orderDate?: string;
  deliveryDate?: string;
  items: ParsedLineItem[];
  subtotal?: number;
  tax?: number;
  totalAmount?: number;
  taxRate?: number;
  notes?: string;
  confidence: number;
}

interface MatchedItem {
  parsedItem: ParsedLineItem;
  matchedProduct?: {
    id: string;
    name: string;
    code: string;
    price: number;
  };
  matchConfidence: number;
  isExactMatch: boolean;
}

interface OcrScanResult {
  id: string;
  orderId?: string;
  imageUrl: string;
  rawText?: string;
  parsedData?: ParsedOrderData;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  documentType?: string;
  confidence?: number;
  createdAt: string;
  matchedItems?: MatchedItem[];
  order?: {
    id: string;
    orderNumber: string;
    status: string;
  };
}

// ======== 書類種別ラベル ========

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  ORDER: "発注書",
  DELIVERY_NOTE: "納品書",
  INVOICE: "請求書",
  UNKNOWN: "不明",
};

// ======== メインコンポーネント ========

export default function OcrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<OcrScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<OcrScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 編集可能な解析結果
  const [editedData, setEditedData] = useState<ParsedOrderData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 最近のスキャン履歴を取得
  useEffect(() => {
    fetchRecentScans();
  }, []);

  async function fetchRecentScans() {
    try {
      const res = await fetch("/api/ocr");
      if (res.ok) {
        const data = await res.json();
        setRecentScans(data);
      }
    } catch {
      // 履歴取得に失敗しても問題ない
    }
  }

  // ファイルプレビューの生成
  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setScanResult(null);
    setEditedData(null);

    // 画像プレビュー
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  // ドラッグ&ドロップ処理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type.startsWith("image/")) {
        handleFileSelect(droppedFile);
      } else {
        setError("画像ファイルをドロップしてください。");
      }
    },
    [handleFileSelect]
  );

  // OCR実行
  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "OCR処理に失敗しました");
        return;
      }

      setScanResult(data);

      // 解析結果を編集用にコピー
      if (data.parsedData) {
        setEditedData({ ...data.parsedData });
      }

      // 履歴を更新
      fetchRecentScans();
    } catch (err) {
      setError(`OCR処理中にエラーが発生しました: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  // 解析結果のフィールド編集
  function updateEditedField<K extends keyof ParsedOrderData>(
    field: K,
    value: ParsedOrderData[K]
  ) {
    if (!editedData) return;
    setEditedData({ ...editedData, [field]: value });
  }

  // 明細行の編集
  function updateEditedItem(
    index: number,
    field: keyof ParsedLineItem,
    value: string | number
  ) {
    if (!editedData) return;
    const updatedItems = [...editedData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setEditedData({ ...editedData, items: updatedItems });
  }

  // 発注データ作成（確認画面への遷移など、ここでは簡易版）
  async function handleCreateOrder() {
    if (!scanResult || !editedData) return;

    // 実際の実装では、会社・ユーザー選択UIを経由してconfirm APIを呼ぶ
    alert(
      "発注データ作成機能: 実装では /api/ocr/[id]/confirm エンドポイントに" +
        "会社ID・ユーザーID・修正済み明細行を送信します。\n\n" +
        `スキャンID: ${scanResult.id}\n` +
        `書類種別: ${DOCUMENT_TYPE_LABELS[editedData.documentType]}\n` +
        `明細行数: ${editedData.items.length}`
    );
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          AI-OCR 注文書読取
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          発注書・納品書・請求書の画像をアップロードすると、AIが自動で内容を解析します。
        </p>
      </div>

      {/* ファイルアップロードエリア */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold text-blue-600">
              クリックしてファイルを選択
            </span>
            {" "}またはドラッグ&ドロップ
          </p>
          <p className="mt-1 text-xs text-gray-500">
            JPEG, PNG, GIF, WebP, TIFF対応
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
            className="hidden"
          />
        </div>

        {/* 選択されたファイル情報 */}
        {file && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {preview && (
                <img
                  src={preview}
                  alt="プレビュー"
                  className="h-16 w-16 rounded-md border object-cover"
                />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  処理中...
                </span>
              ) : (
                "読み取り開始"
              )}
            </button>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* 処理状態インジケーター */}
      {loading && (
        <div className="rounded-lg bg-blue-50 p-6 shadow">
          <div className="flex items-center gap-3">
            <LoadingSpinner size="lg" />
            <div>
              <p className="font-medium text-blue-900">OCR処理中...</p>
              <p className="text-sm text-blue-700">
                画像からテキストを読み取り、内容を解析しています。
              </p>
            </div>
          </div>
          <div className="mt-4">
            <ProcessingSteps currentStep={loading ? 1 : 3} />
          </div>
        </div>
      )}

      {/* 解析結果表示 */}
      {scanResult && scanResult.status === "COMPLETED" && (
        <div className="space-y-6">
          {/* 解析完了バナー */}
          <div className="rounded-lg bg-green-50 p-4 shadow">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-medium text-green-800">解析完了</p>
              {scanResult.confidence !== undefined && (
                <ConfidenceBadge confidence={scanResult.confidence} />
              )}
              {scanResult.documentType && (
                <span className="ml-2 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-800">
                  {DOCUMENT_TYPE_LABELS[scanResult.documentType] || scanResult.documentType}
                </span>
              )}
            </div>
          </div>

          {/* 2カラムレイアウト: 原文 / 解析結果 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 左カラム: 原文テキスト */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                原文テキスト
              </h2>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm text-gray-800">
                {scanResult.rawText || "テキストが検出されませんでした"}
              </pre>
            </div>

            {/* 右カラム: 解析結果（編集可能） */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                解析結果
              </h2>
              {editedData ? (
                <ParsedDataForm
                  data={editedData}
                  matchedItems={scanResult.matchedItems}
                  onUpdateField={updateEditedField}
                  onUpdateItem={updateEditedItem}
                />
              ) : (
                <p className="text-sm text-gray-500">
                  解析結果がありません。
                </p>
              )}
            </div>
          </div>

          {/* 明細行マッチング結果 */}
          {scanResult.matchedItems && scanResult.matchedItems.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                商品マッチング結果
              </h2>
              <MatchedItemsTable matchedItems={scanResult.matchedItems} />
            </div>
          )}

          {/* 発注データ作成ボタン */}
          <div className="flex justify-end">
            <button
              onClick={handleCreateOrder}
              className="rounded-md bg-green-600 px-8 py-3 text-sm font-medium text-white shadow-sm hover:bg-green-700"
            >
              発注データ作成
            </button>
          </div>
        </div>
      )}

      {/* 最近のスキャン履歴 */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          最近のスキャン履歴
        </h2>
        {recentScans.length === 0 ? (
          <p className="text-sm text-gray-500">スキャン履歴がありません。</p>
        ) : (
          <RecentScansTable scans={recentScans} />
        )}
      </div>
    </div>
  );
}

// ======== サブコンポーネント ========

/** ローディングスピナー */
function LoadingSpinner({ size = "sm" }: { size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <svg
      className={`${sizeClass} animate-spin text-current`}
      xmlns="http://www.w3.org/2000/svg"
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/** 信頼度バッジ */
function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  let colorClass = "bg-red-100 text-red-800";
  if (confidence >= 0.8) {
    colorClass = "bg-green-100 text-green-800";
  } else if (confidence >= 0.5) {
    colorClass = "bg-yellow-100 text-yellow-800";
  }

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      信頼度 {percentage}%
    </span>
  );
}

/** 処理ステップ表示 */
function ProcessingSteps({ currentStep }: { currentStep: number }) {
  const steps = [
    { label: "画像アップロード", step: 0 },
    { label: "テキスト読取（OCR）", step: 1 },
    { label: "内容解析・構造化", step: 2 },
    { label: "商品マッチング", step: 3 },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map(({ label, step }) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              step < currentStep
                ? "bg-blue-600 text-white"
                : step === currentStep
                  ? "bg-blue-100 text-blue-600 ring-2 ring-blue-600"
                  : "bg-gray-200 text-gray-500"
            }`}
          >
            {step < currentStep ? (
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              step + 1
            )}
          </div>
          <span
            className={`text-xs ${
              step <= currentStep ? "text-blue-700" : "text-gray-500"
            }`}
          >
            {label}
          </span>
          {step < steps.length - 1 && (
            <div
              className={`h-0.5 w-4 ${
                step < currentStep ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/** 解析結果フォーム（編集可能） */
function ParsedDataForm({
  data,
  matchedItems,
  onUpdateField,
  onUpdateItem,
}: {
  data: ParsedOrderData;
  matchedItems?: MatchedItem[];
  onUpdateField: <K extends keyof ParsedOrderData>(
    field: K,
    value: ParsedOrderData[K]
  ) => void;
  onUpdateItem: (
    index: number,
    field: keyof ParsedLineItem,
    value: string | number
  ) => void;
}) {
  return (
    <div className="space-y-4">
      {/* 書類情報 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500">
            書類種別
          </label>
          <select
            value={data.documentType}
            onChange={(e) =>
              onUpdateField(
                "documentType",
                e.target.value as ParsedOrderData["documentType"]
              )
            }
            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="ORDER">発注書</option>
            <option value="DELIVERY_NOTE">納品書</option>
            <option value="INVOICE">請求書</option>
            <option value="UNKNOWN">不明</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">
            伝票番号
          </label>
          <input
            type="text"
            value={data.documentNumber || ""}
            onChange={(e) => onUpdateField("documentNumber", e.target.value)}
            placeholder="未検出"
            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 会社名 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500">
            発注元
          </label>
          <input
            type="text"
            value={data.buyerName || ""}
            onChange={(e) => onUpdateField("buyerName", e.target.value)}
            placeholder="未検出"
            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">
            受注先
          </label>
          <input
            type="text"
            value={data.supplierName || ""}
            onChange={(e) => onUpdateField("supplierName", e.target.value)}
            placeholder="未検出"
            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 日付 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500">
            発注日
          </label>
          <input
            type="date"
            value={data.orderDate || ""}
            onChange={(e) => onUpdateField("orderDate", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">
            納品日
          </label>
          <input
            type="date"
            value={data.deliveryDate || ""}
            onChange={(e) => onUpdateField("deliveryDate", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 明細行 */}
      <div>
        <label className="block text-xs font-medium text-gray-500">
          明細行
        </label>
        {data.items.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">
            明細行が検出されませんでした
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {data.items.map((item, index) => {
              const matched = matchedItems?.[index];
              return (
                <div
                  key={index}
                  className="rounded-md border border-gray-200 p-3"
                >
                  <div className="flex items-start gap-2">
                    {/* マッチング信頼度インジケーター */}
                    {matched && (
                      <MatchConfidenceIndicator
                        confidence={matched.matchConfidence}
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) =>
                          onUpdateItem(index, "productName", e.target.value)
                        }
                        className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="商品名"
                      />
                      {matched?.matchedProduct && (
                        <p className="text-xs text-gray-500">
                          マッチ: {matched.matchedProduct.name} (
                          {matched.matchedProduct.code})
                          {matched.isExactMatch && (
                            <span className="ml-1 text-green-600">
                              完全一致
                            </span>
                          )}
                        </p>
                      )}
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-xs text-gray-400">数量</label>
                          <input
                            type="number"
                            value={item.quantity ?? ""}
                            onChange={(e) =>
                              onUpdateItem(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">単位</label>
                          <input
                            type="text"
                            value={item.unit || ""}
                            onChange={(e) =>
                              onUpdateItem(index, "unit", e.target.value)
                            }
                            className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">単価</label>
                          <input
                            type="number"
                            value={item.unitPrice ?? ""}
                            onChange={(e) =>
                              onUpdateItem(
                                index,
                                "unitPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">金額</label>
                          <input
                            type="number"
                            value={item.amount ?? ""}
                            onChange={(e) =>
                              onUpdateItem(
                                index,
                                "amount",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 合計 */}
      <div className="grid grid-cols-3 gap-3 border-t pt-3">
        <div>
          <label className="block text-xs font-medium text-gray-500">
            小計
          </label>
          <input
            type="number"
            value={data.subtotal ?? ""}
            onChange={(e) =>
              onUpdateField("subtotal", parseFloat(e.target.value) || undefined)
            }
            placeholder="未検出"
            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">
            消費税
          </label>
          <input
            type="number"
            value={data.tax ?? ""}
            onChange={(e) =>
              onUpdateField("tax", parseFloat(e.target.value) || undefined)
            }
            placeholder="未検出"
            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">
            合計金額
          </label>
          <input
            type="number"
            value={data.totalAmount ?? ""}
            onChange={(e) =>
              onUpdateField(
                "totalAmount",
                parseFloat(e.target.value) || undefined
              )
            }
            placeholder="未検出"
            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 備考 */}
      <div>
        <label className="block text-xs font-medium text-gray-500">備考</label>
        <textarea
          value={data.notes || ""}
          onChange={(e) => onUpdateField("notes", e.target.value)}
          placeholder="未検出"
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

/** マッチング信頼度インジケーター */
function MatchConfidenceIndicator({
  confidence,
}: {
  confidence: number;
}) {
  let bgColor = "bg-red-500";
  let title = "マッチなし - 手動選択が必要";

  if (confidence >= 0.8) {
    bgColor = "bg-green-500";
    title = "高信頼度マッチ";
  } else if (confidence >= 0.5) {
    bgColor = "bg-yellow-500";
    title = "部分マッチ - 確認推奨";
  }

  return (
    <div className="mt-2 flex-shrink-0" title={title}>
      <div className={`h-3 w-3 rounded-full ${bgColor}`} />
    </div>
  );
}

/** 商品マッチング結果テーブル */
function MatchedItemsTable({
  matchedItems,
}: {
  matchedItems: MatchedItem[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
              状態
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
              OCR読取結果
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
              マッチ商品
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
              商品コード
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
              信頼度
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {matchedItems.map((item, index) => (
            <tr key={index}>
              <td className="px-4 py-2">
                <MatchConfidenceIndicator
                  confidence={item.matchConfidence}
                />
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {item.parsedItem.productName}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {item.matchedProduct?.name || (
                  <span className="text-gray-400">マッチなし</span>
                )}
              </td>
              <td className="px-4 py-2 text-sm text-gray-500">
                {item.matchedProduct?.code || "-"}
              </td>
              <td className="px-4 py-2 text-right text-sm">
                <span
                  className={`font-medium ${
                    item.matchConfidence >= 0.8
                      ? "text-green-600"
                      : item.matchConfidence >= 0.5
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {Math.round(item.matchConfidence * 100)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 最近のスキャン履歴テーブル */
function RecentScansTable({ scans }: { scans: OcrScanResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
              日時
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
              ファイル名
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
              書類種別
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
              状態
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
              信頼度
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
              発注番号
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {scans.map((scan) => (
            <tr key={scan.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
                {new Date(scan.createdAt).toLocaleString("ja-JP")}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {scan.imageUrl}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {scan.documentType
                  ? DOCUMENT_TYPE_LABELS[scan.documentType] || scan.documentType
                  : "-"}
              </td>
              <td className="px-4 py-2">
                <StatusBadge status={scan.status} />
              </td>
              <td className="px-4 py-2 text-right text-sm">
                {scan.confidence !== null && scan.confidence !== undefined
                  ? `${Math.round(scan.confidence * 100)}%`
                  : "-"}
              </td>
              <td className="px-4 py-2 text-sm text-gray-500">
                {scan.order?.orderNumber || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** ステータスバッジ */
function StatusBadge({
  status,
}: {
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
}) {
  const config = {
    PENDING: { label: "待機中", color: "bg-gray-100 text-gray-800" },
    PROCESSING: { label: "処理中", color: "bg-blue-100 text-blue-800" },
    COMPLETED: { label: "完了", color: "bg-green-100 text-green-800" },
    FAILED: { label: "失敗", color: "bg-red-100 text-red-800" },
  };

  const { label, color } = config[status];

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}
