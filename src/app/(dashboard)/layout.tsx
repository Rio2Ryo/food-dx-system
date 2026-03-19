import Link from "next/link";
import WorkflowStepBar from "@/components/WorkflowStepBar";
import NavLinks from "@/components/NavLinks";

const navItems = [
  { href: "/ocr", label: "受注(OCR)" },
  { href: "/orders", label: "発注管理" },
  { href: "/inventory", label: "在庫管理" },
  { href: "/accounting", label: "会計連携" },
  { href: "/returns", label: "返品管理" },
  { href: "/products", label: "商品マスタ" },
];

/* ---------- Quick-stats for the desktop sidebar ------------------- */

interface StatCard {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}

const quickStats: StatCard[] = [
  { label: "本日の受注", value: "18件", delta: "+3", positive: true },
  { label: "出荷待ち", value: "7件", delta: "2件 急ぎ", positive: false },
  { label: "在庫アラート", value: "4品目" },
  { label: "月次売上", value: "¥2.4M", delta: "+12%", positive: true },
];

/* ================================================================== */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Top Navigation Bar ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              {/* Logo mark */}
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
                C
              </span>
              <span className="hidden text-lg font-bold tracking-tight text-slate-900 sm:inline">
                FoodFlow DX
              </span>
            </Link>

            {/* Nav links (client component for active state) */}
            <NavLinks items={navItems} />
          </div>

          {/* Right side – user area */}
          <div className="flex items-center gap-3">
            {/* Notification bell placeholder */}
            <button
              type="button"
              className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="通知"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
              {/* Red notification dot */}
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Divider */}
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            {/* User avatar + name */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                山美
              </div>
              <span className="hidden text-sm font-medium text-slate-700 sm:inline">
                山田美咲
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Body: Sidebar + Main ───────────────────────────────── */}
      <div className="mx-auto flex max-w-screen-2xl">
        {/* Desktop sidebar – quick stats */}
        <aside className="hidden w-[260px] shrink-0 border-r border-slate-200 bg-white px-5 py-6 xl:block">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            クイック統計
          </h2>
          <div className="flex flex-col gap-3">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="animate-slide-in rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition-shadow hover:shadow-sm"
              >
                <p className="text-xs font-medium text-slate-500">
                  {stat.label}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-slate-800">
                    {stat.value}
                  </span>
                  {stat.delta && (
                    <span
                      className={`text-xs font-semibold ${
                        stat.positive
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {stat.delta}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Mini footer in sidebar */}
          <div className="mt-8 rounded-lg bg-indigo-50 px-4 py-3">
            <p className="text-xs font-medium text-indigo-700">
              FoodFlow DX v0.1
            </p>
            <p className="mt-0.5 text-[11px] text-indigo-500">
              食品業界向け受発注DX
            </p>
          </div>
        </aside>

        {/* Main content area */}
        <div className="min-w-0 flex-1">
          {/* Workflow Step Bar */}
          <div className="px-4 pt-6 sm:px-6 lg:px-8">
            <WorkflowStepBar />
          </div>

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
