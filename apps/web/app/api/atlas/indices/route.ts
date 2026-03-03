import { NextResponse } from "next/server";
import { db, indices } from "@mf-atlas/db";

export async function GET() {
  try {
    const results = await db.select().from(indices);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Indices API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
