"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface FundMin {
  id: string;
  name: string;
  amc?: string;
  category?: string;
}

interface SIPResult {
  summary: {
    totalInvested: number;
    totalValue: number;
    xirr: number;
  };
  series: Array<{
    date: string;
    totalValue: number;
  }>;
}

export function BacktesterClient({
  fundUniverse,
}: {
  fundUniverse: FundMin[];
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SIPResult | null>(null);

  // Form State
  const [selectedFund, setSelectedFund] = useState("");
  const [sipAmount, setSipAmount] = useState(5000);
  const [stepUp, setStepUp] = useState(10);
  const [startDate, setStartDate] = useState("2015-01-01");
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFund) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/atlas/sip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isin: selectedFund,
          config: {
            monthlyAmount: Number(sipAmount),
            startDate,
            endDate,
            yearlyStepUpPercentage: Number(stepUp),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to run simulation");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) =>
    `₹${Math.round(val).toLocaleString()}`;

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[600px]">
      {/* LEFT PANEL: CONFIGURATION (35%) */}
      <div className="w-full lg:w-[35%] h-full border-r border-border-subtle bg-surface p-6 flex flex-col shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-6">
          Simulation Parameters
        </h2>

        <form onSubmit={onSubmit} className="flex-1 flex flex-col gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
              Asset Selection
            </label>
            <select
              value={selectedFund}
              onChange={(e) => setSelectedFund(e.target.value)}
              className="w-full h-10 bg-stark-white border border-border-subtle rounded-sm text-sm font-mono px-3 text-text-main focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              required
            >
              <option value="" disabled>
                Select Target Identity...
              </option>
              {fundUniverse.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
              Monthly Capital Commitment (₹)
            </label>
            <input
              type="number"
              value={sipAmount}
              onChange={(e) => setSipAmount(Number(e.target.value))}
              min="100"
              className="w-full h-10 bg-stark-white border border-border-subtle rounded-sm text-sm font-mono px-3 text-text-main focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
              Annual Step-Up Frequency (%)
            </label>
            <input
              type="number"
              value={stepUp}
              onChange={(e) => setStepUp(Number(e.target.value))}
              min="0"
              max="100"
              className="w-full h-10 bg-stark-white border border-border-subtle rounded-sm text-sm font-mono px-3 text-text-main focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                Inception Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 bg-stark-white border border-border-subtle rounded-sm text-[12px] font-mono px-3 text-text-main focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                Terminal Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 bg-stark-white border border-border-subtle rounded-sm text-[12px] font-mono px-3 text-text-main focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-auto w-full h-12 bg-primary text-stark-white font-bold uppercase tracking-wider text-xs rounded-sm hover:bg-[length:100%] hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "COMPUTING TENSOR..." : "RUN BACKTEST"}
          </button>
        </form>
      </div>

      {/* RIGHT PANEL: ANALYTICS (65%) */}
      <div className="w-full lg:w-[65%] h-full bg-stark-white flex flex-col min-h-0">
        {!result ? (
          <div className="flex-1 flex flex-col items-center justify-center border-b border-border-subtle text-text-muted opacity-50 p-6">
            <div className="w-16 h-16 border border-border-subtle mb-4 flex items-center justify-center">
              <span className="font-mono text-2xl text-primary">⚡</span>
            </div>
            <p className="font-mono text-xs uppercase tracking-wider">
              Awaiting Simulation Parameters
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 shrink-0 border-b border-border-subtle">
              <div className="p-6 border-r border-border-subtle bg-surface">
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">
                  Total Capital Invested
                </div>
                <div className="text-2xl font-mono text-text-main">
                  {formatCurrency(result.summary.totalInvested)}
                </div>
              </div>
              <div className="p-6 border-r border-border-subtle bg-surface">
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">
                  Terminal Wealth Projection
                </div>
                <div className="text-2xl font-mono text-positive font-bold">
                  {formatCurrency(result.summary.totalValue)}
                </div>
              </div>
              <div className="p-6 bg-surface relative overflow-hidden">
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">
                  Realized XIRR
                </div>
                <div className="text-3xl font-mono text-primary font-bold">
                  {result.summary.xirr.toFixed(2)}%
                </div>
                <div className="absolute right-0 bottom-0 text-[120px] font-bold font-mono text-border-subtle/50 leading-none pointer-events-none select-none -mb-6 -mr-4">
                  X
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 p-6 relative">
              <h2 className="text-[10px] text-text-muted uppercase tracking-wider mb-6 absolute top-6 left-6 z-10">
                Wealth Accumulation Trajectory
              </h2>
              <div className="w-full h-full pt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={result.series}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#000000"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#000000"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E2E4E8"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{
                        fill: "#5D6679",
                        fontSize: 10,
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}
                      tickFormatter={(str) => {
                        const limit = Math.ceil(result.series.length / 5);
                        const idx = result.series.findIndex(
                          (s: { date: string }) => s.date === str,
                        );
                        if (
                          idx % limit === 0 ||
                          idx === result.series.length - 1
                        ) {
                          return str.substring(0, 4);
                        }
                        return "";
                      }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#F5F6F7",
                        borderColor: "#E2E4E8",
                        borderRadius: "4px",
                        color: "#0A0B0D",
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: "12px",
                        fontWeight: "500",
                        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                      }}
                      formatter={(value: string | number | undefined) => [
                        formatCurrency(Number(value || 0)),
                        "Portfolio Value",
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                      type="linear"
                      dataKey="totalValue"
                      stroke="#000000"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      strokeWidth={2}
                      isAnimationActive={true}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
