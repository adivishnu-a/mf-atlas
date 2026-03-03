import { NextRequest, NextResponse } from "next/server";
import { db, funds } from "@mf-atlas/db";
import { like, or, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  try {
    let query = db.select().from(funds).$dynamic();

    if (q) {
      query = query.where(
        or(like(funds.name, `%${q}%`), like(funds.id, `%${q}%`)),
      );
    }

    // Sort by atlas score descending to show top funds natively
    const results = await query.orderBy(desc(funds.atlas_score)).limit(50);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Funds API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
