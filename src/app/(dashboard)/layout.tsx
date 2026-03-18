import Link from "next/link";

const navItems = [
  { href: "/orders", label: "発注管理" },
  { href: "/products", label: "商品マスタ" },
  { href: "/inventory", label: "在庫管理" },
  { href: "/returns", label: "返品管理" },
  { href: "/accounting", label: "会計連携" },
  { href: "/ocr", label: "OCR読取" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <Link
                href="/"
                className="flex shrink-0 items-center font-bold text-gray-900"
              >
                Citta Handcho
              </Link>
              <div className="ml-10 flex items-center space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
