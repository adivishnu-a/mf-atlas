import * as fs from "fs";
import * as path from "path";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { funds } from "./schema";

const dataDir = path.resolve(process.cwd(), "../../data");

async function main() {
  console.log("--- Starting MF Atlas DB Seed ---");

  // The path to the master_index.json relative to the db package root
  const dataDir = path.resolve(__dirname, "../../../data");
  const masterIndexPath = path.join(dataDir, "master_index.json");

  if (!fs.existsSync(masterIndexPath)) {
    console.error(`Error: Could not find master index at ${masterIndexPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(masterIndexPath, "utf8");
  const indexData = JSON.parse(rawData);

  type FundData = { isin: string; name: string; category: string; amc: string };
  const fundEntries = Object.entries(indexData) as [string, FundData][];
  console.log(`Found ${fundEntries.length} funds in master index.`);

  let inserted = 0;

  // Batch inserts for LibSQL Performance
  const BATCH_SIZE = 50;

  for (let i = 0; i < fundEntries.length; i += BATCH_SIZE) {
    const batch = fundEntries.slice(i, i + BATCH_SIZE);

    const insertPayloads = batch.map(([kuveraCode, data]) => {
      return {
        id: data.isin,
        name: data.name,
        category: data.category,
        amc: data.amc,
        kuveraId: kuveraCode,
      };
    });

    // Use ON CONFLICT DO UPDATE so this script is idempotent and can be run safely multiple times
    await db
      .insert(funds)
      .values(insertPayloads)
      .onConflictDoUpdate({
        target: funds.id,
        set: {
          name: sql`excluded.name`,
          category: sql`excluded.category`,
          amc: sql`excluded.amc`,
          kuveraId: sql`excluded.kuveraId`,
        },
      });

    inserted += batch.length;
    console.log(`Inserted ${inserted}/${fundEntries.length} funds into DB...`);
  }

  console.log("--- DB Seed Complete ---");
  process.exit(0);
}

main().catch((e) => {
  console.error("Database seed failed");
  console.error(e);
  process.exit(1);
});
