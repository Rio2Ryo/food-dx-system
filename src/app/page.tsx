import Link from "next/link";

const steps = [
  {
    number: 1,
    title: "受注(OCR)",
    description: "FAX/PDFを受信し、OCRで自動読取",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
        />
      </svg>
    ),
  },
  {
    number: 2,
    title: "発注確認",
    description: "OCR結果を確認・修正し発注データ化",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
  },
  {
    number: 3,
    title: "在庫確認",
    description: "在庫を照合し引当処理を実行",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
        />
      </svg>
    ),
  },
  {
    number: 4,
    title: "出荷処理",
    description: "出荷指示を作成し配送を手配",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
        />
      </svg>
    ),
  },
  {
    number: 5,
    title: "請求書発行",
    description: "請求書を自動生成し会計連携",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
        />
      </svg>
    ),
  },
  {
    number: 6,
    title: "返品処理",
    description: "返品・赤伝の処理を管理",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
        />
      </svg>
    ),
  },
];

const metrics = [
  { label: "本日の受注", value: "8件", accent: "text-indigo-600" },
  { label: "処理待ち", value: "5件", accent: "text-amber-600" },
  { label: "出荷完了", value: "12件", accent: "text-emerald-600" },
  { label: "今月売上", value: "¥2,847,600", accent: "text-blue-600" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50">
      {/* Hero Section */}
      <section className="px-4 pb-16 pt-28 text-center sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          Citta Handcho
        </h1>
        <p className="mx-auto mt-4 text-xl font-medium text-indigo-600 sm:text-2xl">
          食品業界向け 受発注DXシステム
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-500">
          FAX受注からOCR読取、在庫管理、請求書発行まで、食品業界の受発注業務をワンストップでデジタル化
        </p>
      </section>

      {/* Business Flow Diagram */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-slate-800">
          業務フロー
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          受注から出荷・請求まで、一貫したワークフローで業務を効率化
        </p>

        {/* Desktop: horizontal stepper */}
        <div className="mt-12 hidden lg:block">
          <div className="relative flex items-start justify-between">
            {/* Connecting line */}
            <div className="absolute left-[calc(8.33%)] right-[calc(8.33%)] top-5 h-0.5 bg-slate-200" />

            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative flex w-1/6 flex-col items-center px-2"
              >
                {/* Number circle */}
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-indigo-600 bg-white text-sm font-bold text-indigo-600">
                  {step.number}
                </div>

                {/* Arrow between circles (except after last) */}
                {index < steps.length - 1 && (
                  <svg
                    className="absolute -right-2 top-[14px] z-20 h-3 w-3 text-slate-300"
                    fill="currentColor"
                    viewBox="0 0 12 12"
                  >
                    <path d="M2 1l8 5-8 5V1z" />
                  </svg>
                )}

                {/* Icon */}
                <div className="mt-4 text-indigo-500">{step.icon}</div>

                {/* Title */}
                <h3 className="mt-2 text-center text-sm font-semibold text-slate-800">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="mt-1 text-center text-xs leading-relaxed text-slate-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical stepper */}
        <div className="mt-10 lg:hidden">
          <div className="relative ml-5">
            {/* Vertical connecting line */}
            <div className="absolute bottom-0 left-0 top-0 w-0.5 bg-slate-200" />

            {steps.map((step) => (
              <div key={step.number} className="relative pb-10 pl-10 last:pb-0">
                {/* Number circle on the line */}
                <div className="absolute -left-[15px] flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white text-xs font-bold text-indigo-600">
                  {step.number}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-500">{step.icon}</span>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-100 bg-white px-4 py-6 text-center shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {metric.label}
              </p>
              <p className={`mt-2 text-2xl font-bold ${metric.accent}`}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-28 text-center">
        <Link
          href="/ocr"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-md transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300"
        >
          業務を始める
          <svg
            className="ml-2 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>
      </section>
    </main>
  );
}
