import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const indices = [
  "nifty-50",
  "nifty-midcap-150",
  "nifty-smallcap-250",
  "nifty-500",
];

const rawDir = path.resolve(__dirname, "../../../data/indices/raw");
const outDir = path.resolve(__dirname, "../../../data/indices");

// Ensure directories exist
if (!fs.existsSync(rawDir)) {
  fs.mkdirSync(rawDir, { recursive: true });
}
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function processCsvs() {
  console.log("--- Starting Market Indices CSV Seed ---");
  for (const id of indices) {
    const csvFile = path.join(rawDir, `${id}.csv`);

    if (!fs.existsSync(csvFile)) {
      console.log(
        `[SKIP] Missing raw data for ${id}. Please place ${id}.csv in data/indices/raw/`,
      );
      continue;
    }

    const fileContent = fs.readFileSync(csvFile, "utf-8");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
    });

    const outData: Array<{ date: string; close: number }> = [];

    for (const row of records) {
      // Investing.com CSV has columns 'Date', 'Price'
      // Example row: "Feb 26, 2026", "23,448.50"
      const dateRaw = row["Date"] || row["date"];
      const priceRaw =
        row["Price"] || row["price"] || row["Close"] || row["close"];

      if (!dateRaw || !priceRaw) {
        continue;
      }

      // Parse Date (Investing Handles multiple formats, handle DD-MM-YYYY)
      let parsedDateStr = dateRaw;
      if (dateRaw.includes("-")) {
        const parts = dateRaw.split("-");
        if (
          parts.length === 3 &&
          parts[0].length === 2 &&
          parts[2].length === 4
        ) {
          parsedDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      } else if (dateRaw.includes("/")) {
        const parts = dateRaw.split("/");
        if (
          parts.length === 3 &&
          parts[0].length === 2 &&
          parts[2].length === 4
        ) {
          parsedDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const dateObj = new Date(parsedDateStr);
      if (isNaN(dateObj.getTime())) continue; // Invalid date

      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // Parse Price (Strip commas)
      const parsedPrice = parseFloat(priceRaw.replace(/[^0-9.-]+/g, ""));

      outData.push({ date: dateStr, close: parsedPrice });
    }

    // Sort newest first (highest Date value at index 0)
    outData.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(outData));
    console.log(`[SUCCESS] Seeded ${id} with ${outData.length} records.`);
  }
}

processCsvs();
