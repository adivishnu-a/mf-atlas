import { db, funds, categoryAverages } from "@mf-atlas/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AtlasRadarChart } from "@/components/dashboard/AtlasRadarChart";
import NextLink from "next/link";

export default async function FundDashboardPage({
  params,
}: {
  params: Promise<{ isin: string }>;
}) {
  const { isin } = await params;

  const fundRecords = await db
    .select()
    .from(funds)
    .where(eq(funds.id, isin))
    .limit(1);

  const fund = fundRecords[0];

  if (!fund) {
    notFound();
  }

  let catAvg = null;
  if (fund.fund_category) {
    const avgRecords = await db
      .select()
      .from(categoryAverages)
      .where(eq(categoryAverages.category, fund.fund_category))
      .limit(1);

    catAvg = avgRecords.length > 0 ? avgRecords[0] : null;
  }

  const formatPercentage = (val: number | null) => {
    if (val === null || val === undefined) return "—";
    return `${val > 0 ? "+" : ""}${val.toFixed(2)}%`;
  };

  const getMetricColor = (val: number | null) => {
    if (val === null || val === undefined) return "text-text-muted";
    return val > 0 ? "text-positive" : "text-destructive";
  };

  return (
    <div className="flex-1 overflow-y-auto w-full flex flex-col items-center bg-stark-white">
      <div className="max-w-7xl mx-auto px-6 py-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* LEFT COLUMN (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                Equity
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-surface text-text-muted border border-border-subtle">
                {fund.fund_category || fund.category}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-surface text-text-muted border border-border-subtle">
                {fund.amc}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main tracking-tight">
              {fund.name}
            </h1>
            <p className="text-text-muted mt-2 text-lg">
              Growth • Direct Plan • ISIN: {fund.id}
            </p>
          </div>

          {/* ATLAS SCORE BOX */}
          <div className="bg-stark-white rounded-2xl border border-border-subtle shadow-sm p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <span className="material-symbols-outlined text-9xl">radar</span>
            </div>
            <div className="flex flex-col md:flex-row gap-10 items-start md:items-center justify-between relative z-10">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">
                  Atlas Score
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-7xl font-display font-bold text-primary">
                    {fund.atlas_score
                      ? Number(fund.atlas_score).toFixed(1)
                      : "—"}
                  </span>
                  {fund.atlas_score && (
                    <div className="flex items-center gap-1 text-positive bg-green-50 px-3 py-1 rounded-full border border-green-100">
                      <span className="material-symbols-outlined text-lg">
                        trending_up
                      </span>
                      <span className="font-bold font-mono">Top %</span>
                    </div>
                  )}
                </div>
                <p className="text-text-muted mt-2 text-sm">
                  Quantitatively evaluated based on 3Y and 5Y performance models
                </p>
              </div>
            </div>
          </div>

          {/* PERFORMANCE TRAJECTORY */}
          <div className="mt-4">
            <h3 className="text-xl font-display font-semibold mb-6 text-text-main">
              Performance Trajectory
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 bg-surface rounded-xl border border-border-subtle">
                <div className="text-sm text-text-muted mb-1">1 Year</div>
                <div
                  className={`text-2xl font-bold font-mono ${getMetricColor(fund.return_1y)}`}
                >
                  {formatPercentage(fund.return_1y)}
                </div>
              </div>
              <div className="p-5 bg-surface rounded-xl border border-border-subtle">
                <div className="text-sm text-text-muted mb-1">3 Years</div>
                <div
                  className={`text-2xl font-bold font-mono ${getMetricColor(fund.return_3y)}`}
                >
                  {formatPercentage(fund.return_3y)}
                </div>
              </div>
              <div className="p-5 bg-surface rounded-xl border border-border-subtle">
                <div className="text-sm text-text-muted mb-1">5 Years</div>
                <div
                  className={`text-2xl font-bold font-mono ${getMetricColor(fund.return_5y)}`}
                >
                  {formatPercentage(fund.return_5y)}
                </div>
              </div>
              <div className="p-5 bg-surface rounded-xl border border-border-subtle">
                <div className="text-sm text-text-muted mb-1">Volatility</div>
                <div className="text-2xl font-bold font-mono text-text-main">
                  {fund.volatility
                    ? `${Number(fund.volatility).toFixed(2)}%`
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* RADAR COMPONENT */}
          <div className="mt-6 border border-border-subtle rounded-2xl h-[400px] bg-stark-white flex flex-col relative overflow-hidden p-6 shadow-sm">
            <h3 className="text-lg font-display font-semibold mb-4 text-text-main">
              Factor Analysis
            </h3>
            <div className="flex-1 w-full h-full flex items-center justify-center">
              {fund.atlas_score ? (
                <AtlasRadarChart fund={fund} categoryAverage={catAvg} />
              ) : (
                <div className="text-sm font-mono text-text-muted">
                  Insufficient data for analysis.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex gap-4">
            <NextLink
              href={`/backtest`}
              className="flex-1 bg-primary text-stark-white flex items-center justify-center py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm text-sm"
            >
              Launch Backtester
            </NextLink>
            <button className="flex-shrink-0 w-14 bg-surface border border-border-subtle rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors">
              <span className="material-symbols-outlined text-text-main">
                star
              </span>
            </button>
          </div>

          {/* FUND ESSENTIALS */}
          <div>
            <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Fund Essentials
            </h4>
            <div className="bg-stark-white border border-border-subtle rounded-xl overflow-hidden divide-y divide-border-subtle">
              <div className="p-4 flex justify-between items-center">
                <span className="text-text-muted text-sm">Expense Ratio</span>
                <span className="font-medium font-mono text-sm text-text-main">
                  {fund.expense_ratio !== null ? `${fund.expense_ratio}%` : "—"}
                </span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-text-muted text-sm">Fund Size (AUM)</span>
                <span className="font-medium font-mono text-sm text-text-main">
                  {fund.aum ? `₹${fund.aum.toLocaleString()} Cr` : "—"}
                </span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-text-muted text-sm">AMC</span>
                <span className="font-medium font-display text-sm text-text-main text-right line-clamp-1 max-w-[150px]">
                  {fund.amc}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
