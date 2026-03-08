"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ScreenerClient({ initialData }: { initialData: any[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const formatReturn = (val: number | null) => {
    if (val === null || val === undefined) return "—";
    const formatted = val.toFixed(2) + "%";
    return val > 0 ? `+${formatted}` : formatted;
  };

  const getReturnColor = (val: number | null) => {
    if (val === null || val === undefined) return "text-text-muted";
    return val > 0 ? "text-primary" : "text-destructive";
  };

  const filteredData = initialData.filter((fund) => {
    if (!searchQuery) return true;
    const lower = searchQuery.toLowerCase();
    return (
      fund.name?.toLowerCase().includes(lower) ||
      fund.id?.toLowerCase().includes(lower) ||
      fund.fund_category?.toLowerCase().includes(lower)
    );
  });

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Left Filter Rail (Fixed Width 280px) */}
      <aside className="flex-none w-[280px] h-full flex flex-col border-r border-border-subtle bg-stark-white overflow-y-auto no-scrollbar pb-20">
        <div className="p-6 sticky top-0 bg-stark-white/95 backdrop-blur-sm z-10 border-b border-transparent">
          <div className="flex items-center justify-between">
            <h1 className="text-text-main text-sm font-bold tracking-widest uppercase">
              Filters
            </h1>
            <button className="text-primary text-xs font-medium hover:underline">
              Reset
            </button>
          </div>
        </div>

        {/* Asset Class Section */}
        <div className="px-6 py-4 border-b border-border-subtle/50">
          <h3 className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-4">
            Asset Class
          </h3>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="peer h-4 w-4 appearance-none rounded-sm border border-border-subtle bg-white checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 transition-all"
                />
                <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none mt-0.5">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "14px" }}
                  >
                    check
                  </span>
                </span>
              </div>
              <span className="text-text-main text-sm font-medium group-hover:text-primary transition-colors">
                Equity
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="peer h-4 w-4 appearance-none rounded-sm border border-border-subtle bg-white checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 transition-all"
                />
                <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none mt-0.5">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "14px" }}
                  >
                    check
                  </span>
                </span>
              </div>
              <span className="text-text-main text-sm font-medium group-hover:text-primary transition-colors">
                Debt
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="peer h-4 w-4 appearance-none rounded-sm border border-border-subtle bg-white checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 transition-all"
                />
                <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none mt-0.5">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "14px" }}
                  >
                    check
                  </span>
                </span>
              </div>
              <span className="text-text-main text-sm font-medium group-hover:text-primary transition-colors">
                Hybrid
              </span>
            </label>
          </div>
        </div>

        {/* Category Section */}
        <div className="px-6 py-6 border-b border-border-subtle/50">
          <h3 className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-4">
            Category
          </h3>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1.5 rounded-sm bg-primary/10 text-primary text-xs font-medium border border-transparent hover:border-primary/20 transition-all">
              Large Cap
            </button>
            <button className="px-3 py-1.5 rounded-sm bg-surface text-text-muted text-xs font-medium border border-transparent hover:bg-gray-200 hover:text-text-main transition-all">
              Mid Cap
            </button>
            <button className="px-3 py-1.5 rounded-sm bg-surface text-text-muted text-xs font-medium border border-transparent hover:bg-gray-200 hover:text-text-main transition-all">
              Small Cap
            </button>
            <button className="px-3 py-1.5 rounded-sm bg-surface text-text-muted text-xs font-medium border border-transparent hover:bg-gray-200 hover:text-text-main transition-all">
              Flexi Cap
            </button>
          </div>
        </div>
      </aside>

      {/* Right Data Grid (Fluid Width) */}
      <section className="flex flex-1 flex-col h-full overflow-hidden bg-stark-white relative">
        {/* Global Search Input */}
        <div className="flex-none h-16 w-full relative z-20">
          <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none">
            <span
              className="material-symbols-outlined text-text-muted mt-0.5"
              style={{ fontSize: "20px" }}
            >
              search
            </span>
          </div>
          <input
            type="text"
            placeholder="Search by ISIN, Ticker, or Fund Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full h-full pl-16 pr-8 text-lg text-text-main placeholder-text-muted bg-stark-white border-0 border-b border-border-subtle focus:ring-0 focus:border-primary transition-colors font-display outline-none"
          />
        </div>

        {/* The Grid Container */}
        <div className="flex-1 overflow-auto relative">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead className="bg-stark-white sticky top-0 z-10 shadow-sm shadow-black/[0.02]">
              <tr>
                <th className="py-4 pl-8 pr-4 font-display text-xs font-semibold tracking-wider text-text-muted uppercase border-b border-border-subtle w-[40%]">
                  Fund Name
                </th>
                <th className="py-4 px-4 font-display text-xs font-semibold tracking-wider text-text-muted uppercase border-b border-border-subtle w-[15%]">
                  Category
                </th>
                <th className="py-4 px-4 font-display text-xs font-semibold tracking-wider text-text-muted uppercase border-b border-border-subtle text-right w-[15%]">
                  Atlas Score
                </th>
                <th className="py-4 px-4 font-display text-xs font-semibold tracking-wider text-text-muted uppercase border-b border-border-subtle text-right w-[15%]">
                  1Y Return
                </th>
                <th className="py-4 pl-4 pr-8 font-display text-xs font-semibold tracking-wider text-text-muted uppercase border-b border-border-subtle text-right w-[15%]">
                  3Y Return
                </th>
              </tr>
            </thead>
            <tbody className="bg-stark-white divide-y divide-border-subtle/60">
              {filteredData.map((fund: any) => (
                <tr
                  key={fund.id}
                  className="group hover:bg-surface transition-colors h-[56px] relative cursor-pointer"
                  onClick={() => router.push(`/funds/${fund.id}`)}
                >
                  <td className="py-3 pl-8 pr-4">
                    <div className="flex flex-col">
                      <span
                        className="text-sm font-medium text-text-main truncate max-w-[320px]"
                        title={fund.name}
                      >
                        {fund.name}
                      </span>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                        ISIN: {fund.id}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface text-text-main border border-border-subtle">
                      {fund.fund_category || "Equity"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-mono text-text-main font-bold">
                      {fund.atlas_score
                        ? Number(fund.atlas_score).toFixed(1)
                        : "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`text-sm font-mono font-medium ${getReturnColor(fund.return_1y)}`}
                    >
                      {formatReturn(fund.return_1y)}
                    </span>
                  </td>
                  <td className="py-3 pl-4 pr-8 text-right relative">
                    <span
                      className={`text-sm font-mono font-medium group-hover:hidden ${getReturnColor(fund.return_3y)}`}
                    >
                      {formatReturn(fund.return_3y)}
                    </span>
                    <div className="hidden group-hover:flex absolute inset-y-0 right-8 items-center justify-end bg-surface pl-4">
                      <button className="flex items-center justify-center h-8 px-4 bg-primary text-stark-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-primary/90 transition-all">
                        Analyze
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="p-12 text-center text-text-muted">
              No funds found matching your search.
            </div>
          )}
        </div>

        <div className="flex-none flex items-center justify-between px-8 py-3 border-t border-border-subtle bg-stark-white">
          <span className="text-xs text-text-muted font-mono">
            Showing {Math.min(filteredData.length, initialData.length)} of{" "}
            {initialData.length} indexed funds
          </span>
        </div>
      </section>
    </div>
  );
}
