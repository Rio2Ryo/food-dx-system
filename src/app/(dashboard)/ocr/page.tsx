"use client";

import { useState, useCallback, useRef } from "react";

// ======== Types ========

type ScanStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

interface OcrScanRecord {
  scanId: string;
  documentType: string;
  status: ScanStatus;
  confidence: number | null;
  scannedAt: string;
}

// ======== Sample Data ========

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

// ======== Main Component ========

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

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          AI-OCR 伝票読取
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          納品書・請求書・発注書の画像をアップロードすると、AIが自動で内容を読み取ります。
        </p>
      </div>

      {/* Upload Area Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          画像アップロード
        </h2>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`group cursor-pointer rounded-xl border-2 border-dashed px-6 py-16 text-center transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100"
              : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30"
          }`}
        >
          {/* Document / Camera Icon */}
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
              isDragging
                ? "bg-indigo-100"
                : "bg-slate-100 group-hover:bg-indigo-100"
            }`}
          >
            <svg
              className={`h-8 w-8 transition-colors ${
                isDragging
                  ? "text-indigo-600"
                  : "text-slate-400 group-hover:text-indigo-500"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <p className="mt-5 text-sm font-medium text-slate-700">
            伝票画像をドラッグ&ドロップ
          </p>
          <p className="mt-1 text-sm text-slate-500">
            または{" "}
            <span className="font-medium text-indigo-600">
              クリックしてアップロード
            </span>
          </p>
          <p className="mt-3 text-xs text-slate-400">
            JPEG, PNG, TIFF対応
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        {/* Selected file display */}
        {selectedFile && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
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
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-indigo-600">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="rounded-md p-1.5 text-indigo-400 transition-colors hover:bg-indigo-100 hover:text-indigo-600"
              >
                <svg
                  className="h-4 w-4"
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
              <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700">
                スキャン開始
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scan History Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            スキャン履歴
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  スキャンID
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  文書種別
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ステータス
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  信頼度
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  スキャン日時
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SAMPLE_SCANS.map((scan, index) => (
                <tr
                  key={scan.scanId}
                  className={`transition-colors ${
                    index % 2 === 0
                      ? "bg-white hover:bg-slate-50"
                      : "bg-slate-50/50 hover:bg-slate-100/60"
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className="font-mono font-medium text-slate-900">
                      {scan.scanId}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {scan.documentType}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={scan.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <ConfidenceBar confidence={scan.confidence} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
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

// ======== Sub-components ========

/** Status Badge */
function StatusBadge({ status }: { status: ScanStatus }) {
  const config: Record<
    ScanStatus,
    { label: string; dotClass: string; badgeClass: string }
  > = {
    PENDING: {
      label: "PENDING",
      dotClass: "bg-slate-400",
      badgeClass: "bg-slate-100 text-slate-700",
    },
    PROCESSING: {
      label: "PROCESSING",
      dotClass: "bg-blue-500 animate-pulse",
      badgeClass: "bg-blue-50 text-blue-700 animate-pulse",
    },
    COMPLETED: {
      label: "COMPLETED",
      dotClass: "bg-emerald-500",
      badgeClass: "bg-emerald-50 text-emerald-700",
    },
    FAILED: {
      label: "FAILED",
      dotClass: "bg-red-500",
      badgeClass: "bg-red-50 text-red-700",
    },
  };

  const { label, dotClass, badgeClass } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

/** Confidence Progress Bar */
function ConfidenceBar({ confidence }: { confidence: number | null }) {
  if (confidence === null) {
    return <span className="text-sm text-slate-300">--</span>;
  }

  const percentage = Math.round(confidence * 100);

  let barColor = "bg-red-500";
  let textColor = "text-red-700";
  let bgColor = "bg-red-100";
  if (percentage > 90) {
    barColor = "bg-emerald-500";
    textColor = "text-emerald-700";
    bgColor = "bg-emerald-100";
  } else if (percentage > 70) {
    barColor = "bg-amber-500";
    textColor = "text-amber-700";
    bgColor = "bg-amber-100";
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`h-2 w-24 overflow-hidden rounded-full ${bgColor}`}>
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
        {percentage}%
      </span>
    </div>
  );
}
