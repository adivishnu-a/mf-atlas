import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getFundHistory, simulateSIP, SIPConfig } from "@mf-atlas/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { isin, config } = body as { isin: string; config: SIPConfig };

    if (!isin || !config) {
      return NextResponse.json(
        { error: "ISIN and SIP config are required" },
        { status: 400 },
      );
    }

    // Resolve the data directory (apps/web runs from monorepo/apps/web)
    // The data folder is at the root of the monorepo: monorepo/data/funds
    const dataDir = path.join(process.cwd(), "../../data/funds");

    const history = getFundHistory(isin, dataDir);

    if (!history) {
      return NextResponse.json(
        { error: `Fund history not found for ISIN: ${isin}` },
        { status: 404 },
      );
    }

    const result = simulateSIP(history.data, config);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to simulate SIP. Check date ranges." },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("SIP API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
