"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface WorkflowStepBarProps {
  counts?: {
    ocr: number;
    confirm: number;
    inventory: number;
    shipping: number;
    invoice: number;
    returns: number;
  };
}

const DEFAULT_COUNTS = {
  ocr: 3,
  confirm: 5,
  inventory: 2,
  shipping: 4,
  invoice: 3,
  returns: 1,
};

interface StepDef {
  number: number;
  icon: string;
  title: string;
  subtitle: string;
  href: string;
  countKey: keyof typeof DEFAULT_COUNTS;
  pathMatch: string;
}

const STEPS: StepDef[] = [
  {
    number: 1,
    icon: "\u{1F4E9}",
    title: "\u53D7\u6CE8",
    subtitle: "FAX/PDF\u53D7\u4FE1 \u2192 OCR\u8AAD\u53D6",
    href: "/ocr",
    countKey: "ocr",
    pathMatch: "/ocr",
  },
  {
    number: 2,
    icon: "\u2705",
    title: "\u767A\u6CE8\u78BA\u8A8D",
    subtitle: "OCR\u7D50\u679C\u306E\u78BA\u8A8D\u30FB\u4FEE\u6B63",
    href: "/orders",
    countKey: "confirm",
    pathMatch: "/orders",
  },
  {
    number: 3,
    icon: "\u{1F4E6}",
    title: "\u5728\u5EAB\u78BA\u8A8D",
    subtitle: "\u5728\u5EAB\u7167\u5408\u30FB\u5F15\u5F53",
    href: "/inventory",
    countKey: "inventory",
    pathMatch: "/inventory",
  },
  {
    number: 4,
    icon: "\u{1F69A}",
    title: "\u51FA\u8377\u51E6\u7406",
    subtitle: "\u51FA\u8377\u6307\u793A\u30FB\u914D\u9001",
    href: "/orders",
    countKey: "shipping",
    pathMatch: "/orders",
  },
  {
    number: 5,
    icon: "\u{1F4B0}",
    title: "\u8ACB\u6C42\u66F8\u767A\u884C",
    subtitle: "\u4F1A\u8A08\u9023\u643A",
    href: "/accounting",
    countKey: "invoice",
    pathMatch: "/accounting",
  },
  {
    number: 6,
    icon: "\u{1F504}",
    title: "\u8FD4\u54C1\u51E6\u7406",
    subtitle: "\u5FC5\u8981\u306B\u5FDC\u3058\u3066",
    href: "/returns",
    countKey: "returns",
    pathMatch: "/returns",
  },
];

function StepArrow() {
  return (
    <div className="hidden items-center md:flex" aria-hidden="true">
      <svg
        className="h-5 w-8 flex-shrink-0 text-gray-300"
        viewBox="0 0 32 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 10H28M28 10L20 2M28 10L20 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function WorkflowStepBar({ counts }: WorkflowStepBarProps) {
  const pathname = usePathname();
  const merged = { ...DEFAULT_COUNTS, ...counts };

  function isActive(step: StepDef): boolean {
    if (!pathname) return false;
    return pathname === step.pathMatch || pathname.startsWith(step.pathMatch + "/");
  }

  return (
    <nav
      aria-label="Workflow steps"
      className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      {/* Desktop: horizontal flow */}
      <ol className="hidden items-center justify-between md:flex">
        {STEPS.map((step, idx) => {
          const active = isActive(step);
          const count = merged[step.countKey];

          return (
            <li key={step.number} className="flex items-center">
              {idx > 0 && <StepArrow />}
              <Link
                href={step.href}
                className={`group relative flex flex-col items-center rounded-lg px-4 py-3 transition-all hover:bg-blue-50 ${
                  active
                    ? "bg-blue-50 ring-2 ring-blue-500 ring-offset-1"
                    : ""
                }`}
              >
                {/* Step number circle */}
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                  }`}
                >
                  {step.number}
                </div>

                {/* Icon + Title */}
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-base" role="img" aria-hidden="true">
                    {step.icon}
                  </span>
                  <span
                    className={`text-sm font-semibold whitespace-nowrap ${
                      active ? "text-blue-700" : "text-gray-800"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                {/* Subtitle */}
                <span className="mt-0.5 text-xs whitespace-nowrap text-gray-500">
                  {step.subtitle}
                </span>

                {/* Count badge */}
                <span
                  className={`mt-1.5 inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                    count > 0
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* Mobile: vertical stack */}
      <ol className="flex flex-col gap-2 md:hidden">
        {STEPS.map((step) => {
          const active = isActive(step);
          const count = merged[step.countKey];

          return (
            <li key={step.number}>
              <Link
                href={step.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-all ${
                  active
                    ? "bg-blue-50 ring-2 ring-blue-500"
                    : "hover:bg-gray-50"
                }`}
              >
                {/* Step number circle */}
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {step.number}
                </div>

                {/* Icon */}
                <span className="text-lg" role="img" aria-hidden="true">
                  {step.icon}
                </span>

                {/* Title + subtitle */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={`text-sm font-semibold ${
                      active ? "text-blue-700" : "text-gray-800"
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="truncate text-xs text-gray-500">
                    {step.subtitle}
                  </span>
                </div>

                {/* Count badge */}
                <span
                  className={`inline-flex min-w-[1.5rem] flex-shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                    count > 0
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {count}
                </span>

                {/* Arrow indicator on mobile */}
                <svg
                  className="h-4 w-4 flex-shrink-0 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
