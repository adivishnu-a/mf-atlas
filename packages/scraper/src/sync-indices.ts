import fs from "fs";
import path from "path";
import * as yf from "yahoo-finance2";

const YahooFinance = yf.default || yf;
const yahooFinance = new YahooFinance({ suppressNotices: ["ripHistorical"] });

const indicesMap = {
  "nifty-50": "^NSEI",
  "nifty-midcap-150": "NIFTYMIDCAP150.NS",
  "nifty-smallcap-250": "NIFTYSMLCAP250.NS",
  "nifty-500": "^CRSLDX",
};

const userTargeted = [
  "nifty-50",
  "nifty-midcap-150",
  "nifty-smallcap-250",
  "nifty-500",
];
const outDir = path.resolve(__dirname, "../../../data/indices");

async function syncIndices() {
  console.log("--- Starting Daily Indices Sync from Yahoo Finance ---");

  for (const id of userTargeted) {
    const symbol = indicesMap[id as keyof typeof indicesMap];
    if (!symbol) continue;

    const file = path.join(outDir, `${id}.json`);
    if (!fs.existsSync(file)) {
      console.log(
        `[SKIP] No existing JSON for ${id}. Please run the seed script first.`,
      );
      continue;
    }

    let data: Array<{ date: string; close: number }> = [];
    try {
      data = JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch (_e) {
      console.log(`[ERROR] Parsing ${id}.json failed.`);
      continue;
    }

    if (data.length === 0) {
      console.log(
        `[SKIP] Empty JSON for ${id}. Cannot determine sync start date.`,
      );
      continue;
    }

    // The array should be grouped newest first.
    const latestDateStr = data[0]?.date;
    if (!latestDateStr) continue;

    const latestDate = new Date(latestDateStr);
    console.log(`Syncing ${id} (${symbol}) from ${latestDateStr}...`);

    try {
      const queryDate = new Date(latestDate);
      queryDate.setDate(queryDate.getDate() - 3); // Pre-fetch 3 days purely for buffer robustness

      const results = (await yahooFinance.chart(symbol, {
        period1: queryDate.toISOString().split("T")[0] as string,
        interval: "1d",
      })) as any;

      let added = 0;
      // results.quotes includes { date, close, open, high, low, volume }
      for (const quote of results.quotes) {
        if (quote.close === null || quote.close === undefined) continue;

        const dateObj = new Date(quote.date);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const dd = String(dateObj.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        // Verify if the parsed quote date is strictly newer than our latest stored date
        if (new Date(dateStr) > latestDate) {
          data.unshift({ date: dateStr, close: quote.close }); // Insert at beginning
          added++;
          latestDate.setTime(new Date(dateStr).getTime()); // Keep advancing internal high-water mark
        }
      }

      if (added > 0) {
        // Safe to sort newest first just to be completely certain
        data.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        fs.writeFileSync(file, JSON.stringify(data));
        console.log(`[SUCCESS] Appended ${added} new daily records for ${id}.`);
      } else {
        console.log(`[INFO] ${id} is already up to date.`);
      }
    } catch (err: any) {
      console.error(
        `[ERROR] Failed to fetch Yahoo Finance data for ${id}:`,
        err.message,
      );
    }
  }
}

syncIndices();
