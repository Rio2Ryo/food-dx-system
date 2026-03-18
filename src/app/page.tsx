import Link from "next/link";

const features = [
  {
    title: "発注管理",
    href: "/orders",
    icon: "📋",
    description: "発注の作成・管理・ステータス追跡",
  },
  {
    title: "商品マスタ",
    href: "/products",
    icon: "📦",
    description: "商品情報の登録・管理",
  },
  {
    title: "在庫管理",
    href: "/inventory",
    icon: "🏭",
    description: "在庫数量のリアルタイム管理",
  },
  {
    title: "返品管理",
    href: "/returns",
    icon: "🔄",
    description: "返品処理・赤伝管理",
  },
  {
    title: "会計連携",
    href: "/accounting",
    icon: "💰",
    description: "請求書・仕訳・会計ソフト連携",
  },
  {
    title: "OCR読取",
    href: "/ocr",
    icon: "📷",
    description: "伝票のOCR読取・データ化",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 pb-16 pt-24 text-center sm:px-6 lg:px-8">
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
          <span className="ml-2" aria-hidden="true">→</span>
        </Link>
      </section>

      {/* Feature Cards */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
            >
              <span className="text-4xl" role="img" aria-label={feature.title}>
                {feature.icon}
              </span>
              <h2 className="mt-4 text-xl font-bold text-gray-900 group-hover:text-indigo-600">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
