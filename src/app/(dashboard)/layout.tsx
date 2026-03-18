import Link from "next/link";
import WorkflowStepBar from "@/components/WorkflowStepBar";

const navItems = [
  { href: "/ocr", label: "受注(OCR)" },
  { href: "/orders", label: "発注管理" },
  { href: "/inventory", label: "在庫管理" },
  { href: "/accounting", label: "会計連携" },
  { href: "/returns", label: "返品管理" },
  { href: "/products", label: "商品マスタ" },
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
              <div className="ml-10 hidden items-center space-x-4 lg:flex">
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
      {/* Workflow Step Bar */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <WorkflowStepBar />
      </div>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
