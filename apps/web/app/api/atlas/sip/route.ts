import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { simulateSIP, SIPConfig } from "@mf-atlas/engine";

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

    const dataPath = path.join(process.cwd(), "../../data", `${isin}.json`);

    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: `Fund history not found for ISIN: ${isin}` },
        { status: 404 },
      );
    }

    const rawData = fs.readFileSync(dataPath, "utf-8");
    const parsedData = JSON.parse(rawData);

    parsedData.sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const result = simulateSIP(parsedData, config);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to simulate SIP. Check date ranges." },
        { status: 400 },
      );
    }

    let currentUnits = 0;
    const series = result.cashflows.map((cf) => {
      const navPoint = parsedData.find((p: any) => p.date === cf.date);
      if (navPoint) {
        const unitsBought = Math.abs(cf.amount) / navPoint.close;
        currentUnits += unitsBought;
        return {
          date: cf.date,
          totalValue: parseFloat((currentUnits * navPoint.close).toFixed(2)),
        };
      }
      return { date: cf.date, totalValue: 0 };
    });

    const clientResponse = {
      summary: {
        totalInvested: result.totalInvested,
        totalValue: result.finalValue,
        xirr: result.xirr || 0,
      },
      series: series,
    };

    return NextResponse.json(clientResponse);
  } catch (error) {
    console.error("SIP API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
