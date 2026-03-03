import { NextRequest, NextResponse } from "next/server";
import { db, funds, categoryAverages } from "@mf-atlas/db";
import { eq } from "drizzle-orm"; // Monorepo node_modules will resolve this

export async function GET(
  request: NextRequest,
  { params }: { params: { isin: string } },
) {
  try {
    const isin = params.isin;

    if (!isin) {
      return NextResponse.json({ error: "ISIN is required" }, { status: 400 });
    }

    // 1. Fetch Fund Data including Atlas Scores
    const fundRecords = await db
      .select()
      .from(funds)
      .where(eq(funds.id, isin))
      .limit(1);
    const fund = fundRecords[0];

    if (!fund) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    // 2. Fetch Category Averages for Radar Chart Comparison
    let catAvg = null;
    if (fund.fund_category) {
      const avgRecords = await db
        .select()
        .from(categoryAverages)
        .where(eq(categoryAverages.category, fund.fund_category))
        .limit(1);

      catAvg = avgRecords.length > 0 ? avgRecords[0] : null;
    }

    // Combine them into a standardized API Contract shape defined by our Frontend needs
    return NextResponse.json({
      fund,
      categoryAverage: catAvg,
    });
  } catch (error) {
    console.error("Fund fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
