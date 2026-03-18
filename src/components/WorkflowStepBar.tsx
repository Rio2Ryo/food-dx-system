"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  title: string;
  subtitle: string;
  href: string;
  countKey: keyof typeof DEFAULT_COUNTS;
  pathMatch: string;
}

const STEPS: StepDef[] = [
  {
    number: 1,
    title: "受注",
    subtitle: "FAX/PDF → OCR",
    href: "/ocr",
    countKey: "ocr",
    pathMatch: "/ocr",
  },
  {
    number: 2,
    title: "発注確認",
    subtitle: "確認・修正",
    href: "/orders",
    countKey: "confirm",
    pathMatch: "/orders",
  },
  {
    number: 3,
    title: "在庫確認",
    subtitle: "照合・引当",
    href: "/inventory",
    countKey: "inventory",
    pathMatch: "/inventory",
  },
  {
    number: 4,
    title: "出荷処理",
    subtitle: "出荷指示・配送",
    href: "/orders",
    countKey: "shipping",
    pathMatch: "/orders",
  },
  {
    number: 5,
    title: "請求書発行",
    subtitle: "会計連携",
    href: "/accounting",
    countKey: "invoice",
    pathMatch: "/accounting",
  },
  {
    number: 6,
    title: "返品処理",
    subtitle: "必要に応じて",
    href: "/returns",
    countKey: "returns",
    pathMatch: "/returns",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Determine step state relative to the currently-active step. */
function getStepState(
  stepIndex: number,
  activeIndex: number,
): "completed" | "active" | "future" {
  if (activeIndex < 0) return "future"; // nothing matched
  if (stepIndex < activeIndex) return "completed";
  if (stepIndex === activeIndex) return "active";
  return "future";
}

/** Checkmark SVG for completed steps */
function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-white"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={3}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function WorkflowStepBar({ counts }: WorkflowStepBarProps) {
  const pathname = usePathname();
  const merged = { ...DEFAULT_COUNTS, ...counts };

  // Find the active step index (-1 if no match)
  const activeIndex = STEPS.findIndex((step) => {
    if (!pathname) return false;
    return (
      pathname === step.pathMatch || pathname.startsWith(step.pathMatch + "/")
    );
  });

  return (
    <nav
      aria-label="Workflow steps"
      className="animate-fade-in w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {/* ── Desktop: horizontal stepper with connected lines ──── */}
      <ol className="hidden items-start justify-between md:flex">
        {STEPS.map((step, idx) => {
          const state = getStepState(idx, activeIndex);
          const count = merged[step.countKey];
          const isLast = idx === STEPS.length - 1;

          return (
            <li
              key={step.number}
              className="group relative flex flex-1 items-start"
            >
              {/* Step content */}
              <Link
                href={step.href}
                className="relative z-10 flex flex-col items-center text-center"
                style={{ width: "100%" }}
              >
                {/* Circle */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    state === "completed"
                      ? "border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-200"
                      : state === "active"
                        ? "border-indigo-600 bg-indigo-600 shadow-md shadow-indigo-200"
                        : "border-slate-300 bg-white group-hover:border-slate-400"
                  }`}
                >
                  {state === "completed" ? (
                    <CheckIcon />
                  ) : state === "active" ? (
                    <span className="text-sm font-bold text-white">
                      {step.number}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-500">
                      {step.number}
                    </span>
                  )}
                </div>

                {/* Title */}
                <span
                  className={`mt-2.5 text-sm leading-tight ${
                    state === "active"
                      ? "font-bold text-indigo-700"
                      : state === "completed"
                        ? "font-semibold text-slate-700"
                        : "font-medium text-slate-400"
                  }`}
                >
                  {step.title}
                </span>

                {/* Subtitle */}
                <span
                  className={`mt-0.5 text-[11px] leading-tight ${
                    state === "active"
                      ? "text-indigo-500"
                      : "text-slate-400"
                  }`}
                >
                  {step.subtitle}
                </span>

                {/* Count badge */}
                <span
                  className={`mt-2 inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold transition-all ${
                    count > 0
                      ? state === "active"
                        ? "badge-pulse bg-indigo-100 text-indigo-700"
                        : "badge-pulse bg-slate-100 text-slate-600"
                      : "bg-slate-50 text-slate-300"
                  }`}
                >
                  {count}
                </span>
              </Link>

              {/* Connector line (not after last step) */}
              {!isLast && (
                <div
                  className="absolute left-1/2 top-5 -z-0 h-0.5 w-full -translate-y-1/2"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full w-full origin-left transition-all duration-500 ${
                      state === "completed"
                        ? "animate-grow-line bg-emerald-400"
                        : state === "active"
                          ? "animate-grow-line bg-indigo-300"
                          : "bg-slate-200"
                    }`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* ── Mobile: compact vertical stepper ────────────────────── */}
      <ol className="flex flex-col gap-1 md:hidden">
        {STEPS.map((step, idx) => {
          const state = getStepState(idx, activeIndex);
          const count = merged[step.countKey];
          const isLast = idx === STEPS.length - 1;

          return (
            <li key={step.number} className="relative">
              <Link
                href={step.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  state === "active"
                    ? "bg-indigo-50"
                    : "hover:bg-slate-50"
                }`}
              >
                {/* Circle */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      state === "completed"
                        ? "border-emerald-500 bg-emerald-500"
                        : state === "active"
                          ? "border-indigo-600 bg-indigo-600 shadow-sm shadow-indigo-200"
                          : "border-slate-300 bg-white"
                    }`}
                  >
                    {state === "completed" ? (
                      <CheckIcon />
                    ) : (
                      <span
                        className={`text-xs font-bold ${
                          state === "active"
                            ? "text-white"
                            : "text-slate-400"
                        }`}
                      >
                        {step.number}
                      </span>
                    )}
                  </div>
                  {/* Vertical connector for mobile */}
                  {!isLast && (
                    <div
                      className={`absolute top-8 h-4 w-0.5 ${
                        state === "completed"
                          ? "bg-emerald-400"
                          : "bg-slate-200"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Text */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={`text-sm leading-tight ${
                      state === "active"
                        ? "font-bold text-indigo-700"
                        : state === "completed"
                          ? "font-semibold text-slate-700"
                          : "font-medium text-slate-500"
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="truncate text-[11px] text-slate-400">
                    {step.subtitle}
                  </span>
                </div>

                {/* Count badge */}
                <span
                  className={`inline-flex min-w-[1.5rem] shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                    count > 0
                      ? state === "active"
                        ? "badge-pulse bg-indigo-100 text-indigo-700"
                        : "badge-pulse bg-slate-100 text-slate-600"
                      : "bg-slate-50 text-slate-300"
                  }`}
                >
                  {count}
                </span>

                {/* Chevron */}
                <svg
                  className={`h-4 w-4 shrink-0 ${
                    state === "active" ? "text-indigo-400" : "text-slate-300"
                  }`}
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
