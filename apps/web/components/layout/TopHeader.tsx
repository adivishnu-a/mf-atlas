"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopHeader() {
  const pathname = usePathname();

  return (
    <header className="flex-none flex items-center justify-between whitespace-nowrap border-b border-solid border-border-subtle px-6 lg:px-10 py-3 bg-stark-white z-50">
      <div className="flex items-center gap-4 text-text-main">
        <div className="flex items-center justify-center size-6 text-primary">
          <span
            className="material-symbols-outlined mt-0.5"
            style={{ fontSize: "24px" }}
          >
            token
          </span>
        </div>
        <h2 className="text-text-main text-lg font-bold leading-tight tracking-[-0.015em]">
          MF Atlas
        </h2>
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <div className="items-center gap-9 hidden md:flex">
          <Link
            href="/dashboard"
            className={`text-sm leading-normal transition-colors ${
              pathname.startsWith("/dashboard")
                ? "text-primary font-bold"
                : "text-text-main font-medium hover:text-primary"
            }`}
          >
            Portfolios
          </Link>
          <Link
            href="/funds"
            className={`text-sm leading-normal transition-colors ${
              pathname.startsWith("/funds")
                ? "text-primary font-bold"
                : "text-text-main font-medium hover:text-primary"
            }`}
          >
            Market
          </Link>
          <Link
            href="/backtest"
            className={`text-sm leading-normal transition-colors ${
              pathname.startsWith("/backtest")
                ? "text-primary font-bold"
                : "text-text-main font-medium hover:text-primary"
            }`}
          >
            Backtester
          </Link>
        </div>
        <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-sm h-9 px-4 bg-primary text-stark-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
          <span className="truncate">Profile</span>
        </button>
      </div>
    </header>
  );
}
