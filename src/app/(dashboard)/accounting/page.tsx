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

export default function AccountingPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">会計連携</h1>
      </div>

      {/* サマリーカード */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            今月の売上
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-blue-600">
            ¥1,245,600
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            未払請求
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-red-600">
            3件
          </dd>
          <dd className="mt-1 text-sm text-gray-500">¥234,500</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            今月の仕訳
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            12件
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            エクスポート済
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600">
            2件
          </dd>
        </div>
      </div>

      {/* サブページリンク */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/accounting/invoices"
          className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center hover:border-blue-500 hover:bg-blue-50"
        >
          <div>
            <p className="text-lg font-medium text-gray-900">請求書一覧</p>
            <p className="mt-1 text-sm text-gray-500">
              請求書の作成・管理を行います
            </p>
          </div>
        </Link>
        <Link
          href="/accounting/export"
          className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center hover:border-blue-500 hover:bg-blue-50"
        >
          <div>
            <p className="text-lg font-medium text-gray-900">
              会計エクスポート
            </p>
            <p className="mt-1 text-sm text-gray-500">
              会計ソフト連携用のデータを出力します
            </p>
          </div>
        </Link>
      </div>

      {/* 最近の仕訳 */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">最近の仕訳</h2>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  日付
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  摘要
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  借方科目
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  貸方科目
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  金額
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sampleJournalEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {entry.date}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {entry.description}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {entry.debit}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {entry.credit}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
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
