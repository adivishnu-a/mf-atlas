import { db, funds } from "@mf-atlas/db";
import { asc } from "drizzle-orm";
import { BacktesterClient } from "@/components/backtester/BacktesterClient";
import { Suspense } from "react";

export default async function BacktestWorkbenchPage() {
  // Fetch a lightweight dictionary of all funds for the Select dropdown
  const allFunds = await db
    .select({
      id: funds.id,
      name: funds.name,
      amc: funds.amc,
      category: funds.category,
    })
    .from(funds)
    .orderBy(asc(funds.name));

  return (
    <div className="flex-1 p-0 m-0 h-full overflow-hidden flex flex-col bg-stark-white">
      <div className="border-b border-border-subtle p-6 shrink-0 bg-stark-white">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-main leading-none">
          Precision Backtester
        </h1>
        <p className="text-[10px] text-text-muted mt-2 font-mono uppercase tracking-wider">
          Simulation Workbench • XIRR Projection Engine
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center font-mono text-sm text-text-muted">
            INITIALIZING WORKBENCH...
          </div>
        }
      >
        <div className="flex-1 overflow-y-auto">
          <BacktesterClient fundUniverse={allFunds} />
        </div>
      </Suspense>
    </div>
  );
}
