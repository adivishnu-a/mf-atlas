import fs from "fs";
import path from "path";

// Utility to calculate absolute % return
function calculateReturn(currentValue: number, pastValue: number): number {
  return parseFloat(
    (((currentValue - pastValue) / pastValue) * 100).toFixed(2),
  );
}

// Utility to calculate annualized % return (CAGR)
function calcAnnualized(
  currentValue: number,
  pastValue: number,
  years: number,
): number {
  return parseFloat(
    ((Math.pow(currentValue / pastValue, 1 / years) - 1) * 100).toFixed(2),
  );
}

async function runIndexCompute() {
  console.log("--- Computing Market Indices Trailing Returns ---");
  const indicesDir = path.resolve(__dirname, "../../../data/indices");

  if (!fs.existsSync(indicesDir)) {
    console.warn("No indices folder found. Skipping compute.");
    return;
  }

  const files = fs
    .readdirSync(indicesDir)
    .filter(
      (f) =>
        f.endsWith(".json") &&
        f !== "master_indices.json" &&
        !f.includes("master"),
    );
  const masterIndices: any[] = [];

  for (const file of files) {
    const filePath = path.join(indicesDir, file);
    const id = file.replace(".json", "");

    let history: Array<{ date: string; close: number }> = [];
    try {
      history = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {
      console.log(`Failed to parse ${file}`);
      continue;
    }

    if (history.length === 0) continue;

    const latest = history[0];
    if (!latest) continue;

    // The logic below perfectly mimics our MfApiService.calculateTrailingReturns logic
    const inceptionDate = new Date(
      history[history.length - 1]?.date || "1900-01-01",
    );

    const getCloseOnOrAfter = (targetDate: Date): number | null => {
      if (targetDate < inceptionDate) return null;
      for (let i = history.length - 1; i >= 0; i--) {
        const item = history[i];
        if (item && new Date(item.date) >= targetDate) {
          return item.close;
        }
      }
      return null;
    };

    const latestDate = new Date(latest.date);
    const currentDateStr = latestDate.toISOString().split("T")[0];
    const currentClose = latest.close;

    const intervals = [
      { key: "1d", days: 1 },
      { key: "1w", days: 7 },
      { key: "1m", days: 30 },
      { key: "3m", days: 90 },
      { key: "6m", days: 180 },
      { key: "1y", days: 365 },
      { key: "2y", days: 730 },
      { key: "3y", days: 1095 },
      { key: "5y", days: 1825 },
      { key: "10y", days: 3650 },
    ];

    const returns: Record<string, number | null> = {};

    for (const interval of intervals) {
      const pastDate = new Date(latestDate);
      pastDate.setDate(pastDate.getDate() - interval.days);
      const pastClose = getCloseOnOrAfter(pastDate);

      // Add special check for '1d' exactly matching standard logic - use index 1 if it exists
      if (interval.key === "1d" && history.length > 1) {
        returns[interval.key] = calculateReturn(
          currentClose,
          history[1]!.close,
        );
        continue;
      }

      if (pastClose === null) {
        returns[interval.key] = null;
        continue;
      }

      if (["1y", "2y", "3y", "5y", "10y"].includes(interval.key)) {
        const years = interval.days / 365;
        returns[interval.key] = calcAnnualized(currentClose, pastClose, years);
      } else {
        returns[interval.key] = calculateReturn(currentClose, pastClose);
      }
    }

    let name = id;
    if (id === "nifty-50") name = "Nifty 50 TRI";
    if (id === "nifty-midcap-150") name = "Nifty Midcap 150 TRI";
    if (id === "nifty-smallcap-250") name = "Nifty Smallcap 250 TRI";
    if (id === "nifty-500") name = "Nifty 500 TRI";

    masterIndices.push({
      id,
      name,
      latest_date: currentDateStr,
      latest_close: currentClose,
      returns,
    });
  }

  const targetPath = path.join(indicesDir, "master_indices.json");
  fs.writeFileSync(targetPath, JSON.stringify(masterIndices, null, 2));
  console.log(
    `[SUCCESS] Generated master_indices.json with ${masterIndices.length} benchmarks.`,
  );
}

runIndexCompute();
