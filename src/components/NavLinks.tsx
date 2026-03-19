"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { handleSignOut } from "@/lib/actions";

interface NavItem {
  href: string;
  label: string;
}

export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  function isActive(href: string): boolean {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Desktop nav links */}
      <div className="ml-8 hidden items-center gap-1 lg:flex">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.label}
              {active && (
                <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-indigo-600" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Mobile nav (slide-down menu could be added later; for now horizontal scroll) */}
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 lg:hidden">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Auth status indicator (desktop) */}
      <div className="hidden items-center gap-2 lg:flex">
        {isLoading ? (
          <span className="text-sm text-slate-400">Loading...</span>
        ) : session?.user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              {session.user.name || session.user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Login
          </Link>
        )}
      </div>
    </>
  );
}
