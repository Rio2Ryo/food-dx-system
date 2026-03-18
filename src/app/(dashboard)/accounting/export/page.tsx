"use client";

import { useEffect, useState } from "react";

type ExportRecord = {
  id: string;
  format: string;
  periodStart: string;
  periodEnd: string;
  fileName: string;
  status: string;
  exportedAt: string | null;
  createdAt: string;
  company: { name: string };
};

const formatLabels: Record<string, string> = {
  YAYOI: "弥生会計",
  FREEE: "freee",
  MONEYFORWARD: "マネーフォワード",
  CSV_GENERIC: "汎用CSV",
};

const formatOptions = [
  { value: "YAYOI", label: "弥生会計" },
  { value: "FREEE", label: "freee" },
  { value: "MONEYFORWARD", label: "マネーフォワード" },
  { value: "CSV_GENERIC", label: "汎用CSV" },
];

const statusLabel: Record<string, string> = {
  PENDING: "処理中",
  COMPLETED: "完了",
  FAILED: "失敗",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function ExportPage() {
  const [format, setFormat] = useState("YAYOI");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 初期値設定：今月の期間
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setPeriodStart(start.toISOString().split("T")[0]);
    setPeriodEnd(end.toISOString().split("T")[0]);
  }, []);

  // 企業一覧取得（簡易的にinvoicesから取得）
  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json() as Promise<{ issuerCompanyId: string; issuerCompany: { id: string; name: string } }[]>)
      .then((invoices) => {
        const companyMap = new Map<string, string>();
        invoices.forEach((inv) => {
          companyMap.set(inv.issuerCompanyId, inv.issuerCompany.name);
        });
        const list = Array.from(companyMap.entries()).map(([id, name]) => ({
          id,
          name,
        }));
        setCompanies(list);
        if (list.length > 0 && !companyId) {
          setCompanyId(list[0].id);
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // エクスポート履歴取得
  useEffect(() => {
    const params = new URLSearchParams();
    if (companyId) params.set("companyId", companyId);

    fetch(`/api/accounting/export?${params.toString()}`)
      .then((res) => res.json() as Promise<ExportRecord[]>)
      .then(setExportHistory);
  }, [companyId]);

  async function handleExport() {
    if (!companyId || !periodStart || !periodEnd) {
      setMessage({ type: "error", text: "すべての項目を入力してください" });
      return;
    }

    setExporting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/accounting/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          format,
          periodStart,
          periodEnd,
        }),
      });

      const data = await res.json() as { error?: string; csvContent: string; fileName: string; formatLabel: string; entryCount: number };

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "エクスポートに失敗しました" });
        return;
      }

      // CSVファイルのダウンロード
      const blob = new Blob(["\uFEFF" + data.csvContent], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({
        type: "success",
        text: `${data.formatLabel}形式で${data.entryCount}件のデータをエクスポートしました`,
      });

      // 履歴を再取得
      const params = new URLSearchParams();
      if (companyId) params.set("companyId", companyId);
      const historyRes = await fetch(
        `/api/accounting/export?${params.toString()}`
      );
      const history = await historyRes.json() as ExportRecord[];
      setExportHistory(history);
    } catch {
      setMessage({ type: "error", text: "エクスポート処理中にエラーが発生しました" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        データエクスポート
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        会計ソフトにインポートするためのデータを出力します
      </p>

      {/* エクスポートフォーム */}
      <div className="mt-6 rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-medium text-gray-900">エクスポート設定</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 企業選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              対象企業
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="">選択してください</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* フォーマット選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              会計ソフト
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              {formatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 期間開始 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              期間（開始）
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* 期間終了 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              期間（終了）
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* メッセージ */}
        {message && (
          <div
            className={`mt-4 rounded-md p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleExport}
            disabled={exporting || !companyId}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting ? "エクスポート中..." : "エクスポート実行"}
          </button>
        </div>
      </div>

      {/* エクスポート履歴 */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">エクスポート履歴</h2>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ファイル名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  フォーマット
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  対象期間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  状態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  エクスポート日時
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {exportHistory.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    エクスポート履歴がありません
                  </td>
                </tr>
              )}
              {exportHistory.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {record.fileName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {formatLabels[record.format] ?? record.format}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(record.periodStart).toLocaleDateString("ja-JP")}
                    {" - "}
                    {new Date(record.periodEnd).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        statusColor[record.status] ??
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabel[record.status] ?? record.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {record.exportedAt
                      ? new Date(record.exportedAt).toLocaleString("ja-JP")
                      : "-"}
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
