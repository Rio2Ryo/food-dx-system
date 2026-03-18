"use client";

import Link from "next/link";

type JournalEntry = {
  id: string;
  date: string;
  description: string;
  debit: string;
  credit: string;
  amount: number;
};

const sampleJournalEntries: JournalEntry[] = [
  {
    id: "JE-001",
    date: "2026-03-15",
    description: "ホテルオーシャン 冷凍食品売上",
    debit: "売掛金",
    credit: "売上高",
    amount: 312000,
  },
  {
    id: "JE-002",
    date: "2026-03-10",
    description: "スーパーマーケット吉田 精肉卸売",
    debit: "売掛金",
    credit: "売上高",
    amount: 234500,
  },
  {
    id: "JE-003",
    date: "2026-03-05",
    description: "レストラン花園 水産物納品",
    debit: "売掛金",
    credit: "売上高",
    amount: 89400,
  },
  {
    id: "JE-004",
    date: "2026-03-01",
    description: "株式会社マルシェ 青果卸売",
    debit: "普通預金",
    credit: "売掛金",
    amount: 156800,
  },
  {
    id: "JE-005",
    date: "2026-03-01",
    description: "株式会社マルシェ 青果卸売 入金",
    debit: "普通預金",
    credit: "売掛金",
    amount: 156800,
  },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function AccountingPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">会計連携</h1>
        <p className="mt-1 text-sm text-slate-500">
          売上・仕訳・請求の概況を確認できます
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* 今月の売上 */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
              <svg
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">今月の売上</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                ¥1,245,600
              </p>
            </div>
          </div>
        </div>

        {/* 未払請求 */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50">
              <svg
                className="h-6 w-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">未払請求</p>
              <p className="mt-1 text-2xl font-bold text-red-600">3件</p>
              <p className="mt-0.5 text-sm font-medium text-red-400">
                ¥234,500
              </p>
            </div>
          </div>
        </div>

        {/* 今月の仕訳 */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <svg
                className="h-6 w-6 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">今月の仕訳</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">12件</p>
            </div>
          </div>
        </div>

        {/* エクスポート済 */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
              <svg
                className="h-6 w-6 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">
                エクスポート済
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">2件</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Link
          href="/accounting/invoices"
          className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50 transition-colors group-hover:bg-indigo-100">
              <svg
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-slate-900">
                請求書一覧
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                請求書の作成・管理を行います
              </p>
            </div>
            <svg
              className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
        </Link>

        <Link
          href="/accounting/export"
          className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50 transition-colors group-hover:bg-indigo-100">
              <svg
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-slate-900">
                会計エクスポート
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                会計ソフト連携用のデータを出力します
              </p>
            </div>
            <svg
              className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
        </Link>
      </div>

      {/* Recent Journal Entries */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">最近の仕訳</h2>
          <span className="text-sm text-slate-500">直近5件を表示</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  日付
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  摘要
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  借方科目
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  貸方科目
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  金額
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sampleJournalEntries.map((entry, idx) => (
                <tr
                  key={entry.id}
                  className={`transition-colors hover:bg-slate-50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {formatDate(entry.date)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-800">
                    {entry.description}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {entry.debit}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {entry.credit}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold tabular-nums text-slate-900">
                    ¥{entry.amount.toLocaleString()}
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
