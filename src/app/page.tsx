import Link from "next/link";

const steps = [
  {
    number: 1,
    icon: "📩",
    title: "受注",
    description: "FAX/PDFを受信し、OCRで読み取り",
    href: "/ocr",
    color: "from-blue-500 to-blue-600",
    ring: "ring-blue-200",
    accent: "text-blue-600",
    hoverAccent: "group-hover:text-blue-600",
    border: "border-blue-200 hover:border-blue-400",
  },
  {
    number: 2,
    icon: "✅",
    title: "発注確認",
    description: "OCR結果を確認・修正して発注データ化",
    href: "/orders",
    color: "from-emerald-500 to-emerald-600",
    ring: "ring-emerald-200",
    accent: "text-emerald-600",
    hoverAccent: "group-hover:text-emerald-600",
    border: "border-emerald-200 hover:border-emerald-400",
  },
  {
    number: 3,
    icon: "📦",
    title: "在庫確認",
    description: "在庫を照合し、引当処理",
    href: "/inventory",
    color: "from-amber-500 to-amber-600",
    ring: "ring-amber-200",
    accent: "text-amber-600",
    hoverAccent: "group-hover:text-amber-600",
    border: "border-amber-200 hover:border-amber-400",
  },
  {
    number: 4,
    icon: "🚚",
    title: "出荷処理",
    description: "出荷指示を作成し、配送手配",
    href: "/orders",
    color: "from-purple-500 to-purple-600",
    ring: "ring-purple-200",
    accent: "text-purple-600",
    hoverAccent: "group-hover:text-purple-600",
    border: "border-purple-200 hover:border-purple-400",
  },
  {
    number: 5,
    icon: "💰",
    title: "請求書発行",
    description: "請求書を自動生成し、会計ソフト連携",
    href: "/accounting",
    color: "from-rose-500 to-rose-600",
    ring: "ring-rose-200",
    accent: "text-rose-600",
    hoverAccent: "group-hover:text-rose-600",
    border: "border-rose-200 hover:border-rose-400",
  },
  {
    number: 6,
    icon: "🔄",
    title: "返品処理",
    description: "返品・赤伝の処理（必要に応じて）",
    href: "/returns",
    color: "from-slate-500 to-slate-600",
    ring: "ring-slate-200",
    accent: "text-slate-600",
    hoverAccent: "group-hover:text-slate-600",
    border: "border-slate-200 hover:border-slate-400",
  },
];

function VerticalConnector() {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="h-8 w-0.5 bg-gradient-to-b from-gray-300 to-gray-400" />
      <div className="text-lg leading-none text-gray-400">▼</div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 pb-12 pt-24 text-center sm:px-6 lg:px-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Citta Handcho
        </h1>
        <p className="mt-4 text-xl text-gray-600 sm:text-2xl">
          食品業界向け受発注DXシステム
        </p>
        <Link
          href="/orders"
          className="mt-10 inline-flex items-center rounded-lg bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300"
        >
          ダッシュボードへ
          <span className="ml-2" aria-hidden="true">
            →
          </span>
        </Link>
      </section>

      {/* Workflow Section Header */}
      <section className="mx-auto max-w-5xl px-4 pb-4 pt-8 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl">
          業務フロー
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          受注から出荷・請求まで、一貫したワークフローで業務を効率化
        </p>
      </section>

      {/* Workflow Steps — Mobile: vertical single column */}
      <section className="mx-auto max-w-md px-4 pb-24 sm:px-6 lg:hidden">
        {steps.map((step, index) => (
          <div key={step.number}>
            {index > 0 && <VerticalConnector />}
            <StepCard step={step} />
          </div>
        ))}
      </section>

      {/* Workflow Steps — Desktop (lg+): 3-column grid with row connectors */}
      <section className="mx-auto hidden max-w-5xl px-4 pb-24 sm:px-6 lg:block lg:px-8">
        {/* Row 1: Steps 1, 2, 3 */}
        <div className="grid grid-cols-3 gap-8">
          {steps.slice(0, 3).map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>

        {/* Connector between rows: centered arrow */}
        <div className="flex justify-center">
          <VerticalConnector />
        </div>

        {/* Row 2: Steps 4, 5, 6 */}
        <div className="grid grid-cols-3 gap-8">
          {steps.slice(3, 6).map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      </section>
    </main>
  );
}

function StepCard({
  step,
}: {
  step: (typeof steps)[number];
}) {
  return (
    <Link
      href={step.href}
      className={`group relative flex w-full flex-col items-center rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${step.border}`}
    >
      {/* Step Number Circle */}
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold text-white shadow-md ring-4 ${step.color} ${step.ring}`}
      >
        {step.number}
      </div>

      {/* Icon */}
      <span className="mt-4 text-4xl" role="img" aria-label={step.title}>
        {step.icon}
      </span>

      {/* Title */}
      <h3
        className={`mt-3 text-lg font-bold text-gray-900 transition-colors ${step.hoverAccent}`}
      >
        {step.title}
      </h3>

      {/* Description */}
      <p className="mt-1 text-center text-sm leading-relaxed text-gray-500">
        {step.description}
      </p>

      {/* CTA */}
      <span
        className={`mt-4 inline-flex items-center text-sm font-semibold ${step.accent} opacity-0 transition-opacity group-hover:opacity-100`}
      >
        開始する
        <span className="ml-1" aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}
