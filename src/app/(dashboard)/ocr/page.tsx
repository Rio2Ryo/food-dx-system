"use client";

import { useState, useCallback, useRef } from "react";

// ======== 型定義 ========

type ScanStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

interface OcrScanRecord {
  scanId: string;
  documentType: string;
  status: ScanStatus;
  confidence: number | null;
  scannedAt: string;
}

// ======== サンプルデータ ========

const SAMPLE_SCANS: OcrScanRecord[] = [
  {
    scanId: "SCAN-001",
    documentType: "納品書",
    status: "COMPLETED",
    confidence: 0.95,
    scannedAt: "2026-03-10 14:30",
  },
  {
    scanId: "SCAN-002",
    documentType: "請求書",
    status: "COMPLETED",
    confidence: 0.88,
    scannedAt: "2026-03-12 09:15",
  },
  {
    scanId: "SCAN-003",
    documentType: "発注書",
    status: "PROCESSING",
    confidence: null,
    scannedAt: "2026-03-15 16:45",
  },
  {
    scanId: "SCAN-004",
    documentType: "納品書",
    status: "FAILED",
    confidence: null,
    scannedAt: "2026-03-16 11:00",
  },
];

// ======== メインコンポーネント ========

export default function OcrPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (file.type.startsWith("image/")) {
      setSelectedFile(file);
    }
  }, []);

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
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-8">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          AI-OCR 伝票読取
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          納品書・請求書・発注書の画像をアップロードすると、AIが自動で内容を読み取ります。
        </p>
      </div>

      {/* アップロードエリア */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          画像アップロード
        </h2>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
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
          <p className="mt-4 text-sm text-gray-600">
            伝票画像をドラッグ&ドロップ または クリックしてアップロード
          </p>
          <p className="mt-2 text-xs text-gray-400">
            JPEG, PNG, GIF, WebP, TIFF対応
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        {/* 選択済みファイル表示 */}
        {selectedFile && (
          <div className="mt-4 flex items-center gap-3 rounded-md bg-blue-50 px-4 py-3">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <span className="text-sm font-medium text-blue-800">
              {selectedFile.name}
            </span>
            <span className="text-xs text-blue-600">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        )}
      </div>

      {/* 最近のスキャン履歴 */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          最近のスキャン履歴
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  スキャンID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  文書種別
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ステータス
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  信頼度
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  スキャン日時
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {SAMPLE_SCANS.map((scan) => (
                <tr key={scan.scanId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {scan.scanId}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {scan.documentType}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={scan.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <ConfidenceDisplay confidence={scan.confidence} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {scan.scannedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ======== サブコンポーネント ========

/** ステータスバッジ */
function StatusBadge({ status }: { status: ScanStatus }) {
  const config: Record<
    ScanStatus,
    { label: string; className: string }
  > = {
    PENDING: {
      label: "PENDING",
      className: "bg-gray-100 text-gray-800",
    },
    PROCESSING: {
      label: "PROCESSING",
      className: "bg-blue-100 text-blue-800 animate-pulse",
    },
    COMPLETED: {
      label: "COMPLETED",
      className: "bg-green-100 text-green-800",
    },
    FAILED: {
      label: "FAILED",
      className: "bg-red-100 text-red-800",
    },
  };

  const { label, className } = config[status];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

/** 信頼度表示 */
function ConfidenceDisplay({
  confidence,
}: {
  confidence: number | null;
}) {
  if (confidence === null) {
    return <span className="text-gray-400">-</span>;
  }

  const percentage = Math.round(confidence * 100);

  let colorClass = "text-red-600";
  if (percentage > 90) {
    colorClass = "text-green-600";
  } else if (percentage > 70) {
    colorClass = "text-yellow-600";
  }

  return (
    <span className={`font-medium ${colorClass}`}>{percentage}%</span>
  );
}
