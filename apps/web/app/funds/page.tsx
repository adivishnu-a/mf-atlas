import { db, funds } from "@mf-atlas/db";
import { desc } from "drizzle-orm";
import { ScreenerClient } from "@/components/screener/ScreenerClient";

export default async function FundsScreenerPage() {
  // Fetch a broad initial set. The new ScreenerClient handles the client-side fluid filtering
  const initialFunds = await db
    .select()
    .from(funds)
    .orderBy(desc(funds.atlas_score))
    .limit(150);

  return <ScreenerClient initialData={initialFunds} />;
}
