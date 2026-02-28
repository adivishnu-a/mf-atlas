import * as fs from "fs";
import * as path from "path";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { funds, indices, categoryAverages } from "./schema";

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

  type FundData = any; // Just use any since JSON parsed structure is massive
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

        lump_available: data.lump_available,
        sip_available: data.sip_available,
        lump_min: data.lump_min,
        sip_min: data.sip_min,
        lock_in_period: data.lock_in_period,
        detail_info: data.detail_info,
        tax_period: data.tax_period,
        small_screen_name: data.small_screen_name,
        volatility: data.volatility,
        start_date: data.start_date,
        fund_type: data.fund_type,
        fund_category: data.fund_category,
        expense_ratio: data.expense_ratio,
        expense_ratio_date: data.expense_ratio_date,
        fund_manager: data.fund_manager,
        crisil_rating: data.crisil_rating,
        investment_objective: data.investment_objective,
        portfolio_turnover: data.portfolio_turnover,
        aum: data.aum,
        fund_rating: data.fund_rating,
        comparison: data.comparison,

        latest_nav: data.latest_nav,
        latest_nav_date: data.latest_nav_date,
        return_1d: data.return_1d,
        return_1w: data.return_1w,
        return_1m: data.return_1m,
        return_3m: data.return_3m,
        return_6m: data.return_6m,
        return_1y: data.return_1y,
        return_2y: data.return_2y,
        return_3y: data.return_3y,
        return_5y: data.return_5y,
        return_10y: data.return_10y,
        return_since_inception: data.return_since_inception,
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

          lump_available: sql`excluded.lump_available`,
          sip_available: sql`excluded.sip_available`,
          lump_min: sql`excluded.lump_min`,
          sip_min: sql`excluded.sip_min`,
          lock_in_period: sql`excluded.lock_in_period`,
          detail_info: sql`excluded.detail_info`,
          tax_period: sql`excluded.tax_period`,
          small_screen_name: sql`excluded.small_screen_name`,
          volatility: sql`excluded.volatility`,
          start_date: sql`excluded.start_date`,
          fund_type: sql`excluded.fund_type`,
          fund_category: sql`excluded.fund_category`,
          expense_ratio: sql`excluded.expense_ratio`,
          expense_ratio_date: sql`excluded.expense_ratio_date`,
          fund_manager: sql`excluded.fund_manager`,
          crisil_rating: sql`excluded.crisil_rating`,
          investment_objective: sql`excluded.investment_objective`,
          portfolio_turnover: sql`excluded.portfolio_turnover`,
          aum: sql`excluded.aum`,
          fund_rating: sql`excluded.fund_rating`,
          comparison: sql`excluded.comparison`,

          latest_nav: sql`excluded.latest_nav`,
          latest_nav_date: sql`excluded.latest_nav_date`,
          return_1d: sql`excluded.return_1d`,
          return_1w: sql`excluded.return_1w`,
          return_1m: sql`excluded.return_1m`,
          return_3m: sql`excluded.return_3m`,
          return_6m: sql`excluded.return_6m`,
          return_1y: sql`excluded.return_1y`,
          return_2y: sql`excluded.return_2y`,
          return_3y: sql`excluded.return_3y`,
          return_5y: sql`excluded.return_5y`,
          return_10y: sql`excluded.return_10y`,
          return_since_inception: sql`excluded.return_since_inception`,
        },
      });

    inserted += batch.length;
    console.log(`Inserted ${inserted}/${fundEntries.length} funds into DB...`);
  }

  console.log("--- Starting Market Indices DB Seed ---");
  const indicesIndexPath = path.join(dataDir, "indices", "master_indices.json");

  if (fs.existsSync(indicesIndexPath)) {
    const rawIndicesData = fs.readFileSync(indicesIndexPath, "utf8");
    const parsedIndicesData = JSON.parse(rawIndicesData) as any[];

    console.log(`Found ${parsedIndicesData.length} market indices.`);

    const indicesPayloads = parsedIndicesData.map((data) => ({
      id: data.id,
      name: data.name,
      fund_category: data.fund_category,
      latest_date: data.latest_date,
      latest_close: data.latest_close,
      return_1d: data.returns["1d"],
      return_1w: data.returns["1w"],
      return_1m: data.returns["1m"],
      return_3m: data.returns["3m"],
      return_6m: data.returns["6m"],
      return_1y: data.returns["1y"],
      return_2y: data.returns["2y"],
      return_3y: data.returns["3y"],
      return_5y: data.returns["5y"],
      return_10y: data.returns["10y"],
    }));

    await db
      .insert(indices)
      .values(indicesPayloads)
      .onConflictDoUpdate({
        target: indices.id,
        set: {
          name: sql`excluded.name`,
          fund_category: sql`excluded.fund_category`,
          latest_date: sql`excluded.latest_date`,
          latest_close: sql`excluded.latest_close`,
          return_1d: sql`excluded.return_1d`,
          return_1w: sql`excluded.return_1w`,
          return_1m: sql`excluded.return_1m`,
          return_3m: sql`excluded.return_3m`,
          return_6m: sql`excluded.return_6m`,
          return_1y: sql`excluded.return_1y`,
          return_2y: sql`excluded.return_2y`,
          return_3y: sql`excluded.return_3y`,
          return_5y: sql`excluded.return_5y`,
          return_10y: sql`excluded.return_10y`,
        },
      });

    console.log(
      `[SUCCESS] Imported ${parsedIndicesData.length} market indices into Turso DB.`,
    );
  }

  console.log("--- Starting Category Averages DB Seed ---");
  const catAvgsPath = path.join(dataDir, "category_averages.json");

  if (fs.existsSync(catAvgsPath)) {
    const rawCatData = fs.readFileSync(catAvgsPath, "utf8");
    const parsedCatData = JSON.parse(rawCatData) as any[];

    console.log(`Found ${parsedCatData.length} category averages.`);

    const catPayloads = parsedCatData.map((data) => ({
      category: data.category,
      latest_date: data.latest_date,
      latest_close: data.latest_close,
      return_1d: data.return_1d,
      return_1w: data.return_1w,
      return_1m: data.return_1m,
      return_3m: data.return_3m,
      return_6m: data.return_6m,
      return_1y: data.return_1y,
      return_2y: data.return_2y,
      return_3y: data.return_3y,
      return_5y: data.return_5y,
      return_10y: data.return_10y,
      return_since_inception: data.return_since_inception,
    }));

    await db
      .insert(categoryAverages)
      .values(catPayloads)
      .onConflictDoUpdate({
        target: categoryAverages.category,
        set: {
          latest_date: sql`excluded.latest_date`,
          latest_close: sql`excluded.latest_close`,
          return_1d: sql`excluded.return_1d`,
          return_1w: sql`excluded.return_1w`,
          return_1m: sql`excluded.return_1m`,
          return_3m: sql`excluded.return_3m`,
          return_6m: sql`excluded.return_6m`,
          return_1y: sql`excluded.return_1y`,
          return_2y: sql`excluded.return_2y`,
          return_3y: sql`excluded.return_3y`,
          return_5y: sql`excluded.return_5y`,
          return_10y: sql`excluded.return_10y`,
          return_since_inception: sql`excluded.return_since_inception`,
        },
      });

    console.log(
      `[SUCCESS] Imported ${parsedCatData.length} category averages into Turso DB.`,
    );
  }

  console.log("--- DB Seed Complete ---");
  process.exit(0);
}

main().catch((e) => {
  console.error("Database seed failed");
  console.error(e);
  process.exit(1);
});
