import fs from "fs";
import path from "path";

// --- The Atlas Normalization Engine (0 to 100) ---

function normalizeCrisil(rating: number | string | undefined): number {
  if (!rating) return 50; // Unrated baseline
  const rStr = String(rating);
  if (rStr.includes("5")) return 100;
  if (rStr.includes("4")) return 80;
  if (rStr.includes("3")) return 60;
  if (rStr.includes("2")) return 40;
  if (rStr.includes("1")) return 20;
  return 50;
}

// Logarithmic AUM Normalization:
// Rewards the Goldilocks Zone (Stable but Agile).
// NOTE: Kuvera returns AUM in multiples of 10 Lakhs.
// Example: aum = 12000 means 12000 * 10L = 120000L = 1200 Cr.
function normalizeAUM(aum_in_10L: number | undefined): number {
  if (!aum_in_10L || aum_in_10L <= 0) return 0;

  const aumCr = aum_in_10L / 10;

  // The Sweet Spot: 10,000 Cr to 50,000 Cr
  if (aumCr > 50000) {
    const penalty = (aumCr - 50000) / 10000; // Deduct 1 pt per 10k Cr over 50k
    return Math.max(0, 100 - penalty);
  } else if (aumCr < 10000) {
    const penalty = (10000 - aumCr) / 500; // Deduct 1 pt per 500 Cr under 10k
    return Math.max(0, 100 - penalty);
  }

  // Sweet spot bounds (10,000 - 50,000)
  return 100;
}

// Computes the total AUM of an AMC to determine its institutional reputation
function computeAmcReputations(funds: [string, any][]): Record<string, number> {
  const amcAums: Record<string, number> = {};

  for (const [, fund] of funds) {
    if (fund.amc && fund.aum) {
      amcAums[fund.amc] = (amcAums[fund.amc] || 0) + fund.aum;
    }
  }

  const maxAum = Math.max(...Object.values(amcAums));
  const reputations: Record<string, number> = {};

  for (const [amc, totalAum] of Object.entries(amcAums)) {
    const ratio = totalAum / maxAum;
    reputations[amc] = Math.max(50, ratio * 100);
  }

  return reputations;
}

async function runAtlasScoreCompute() {
  console.log("--- Computing Atlas Engine Scores ---");
  const dataDir = path.resolve(__dirname, "../../../data");
  const masterIndexPath = path.join(dataDir, "master_index.json");
  const masterIndicesPath = path.join(
    dataDir,
    "indices",
    "master_indices.json",
  );

  if (!fs.existsSync(masterIndexPath) || !fs.existsSync(masterIndicesPath)) {
    console.warn("Required master files missing. Skipping compute.");
    return;
  }

  const masterIndexData = JSON.parse(fs.readFileSync(masterIndexPath, "utf-8"));
  const indicesData = JSON.parse(
    fs.readFileSync(masterIndicesPath, "utf-8"),
  ) as any[];

  const benchmarks: Record<string, any> = {};
  for (const index of indicesData) {
    benchmarks[index.id] = index;
  }

  const fundsList = Object.entries(masterIndexData) as [string, any][];
  const amcReputations = computeAmcReputations(fundsList);

  // Pass 1: Categorize and Compute Raw Alphas
  const categoryAlphas: Record<
    string,
    {
      "1y": number[];
      "3y": number[];
      "5y": number[];
    }
  > = {};

  const nullifyScores = (key: string, fund: any) => {
    masterIndexData[key] = {
      ...fund,
      atlas_score: null,
      score_perf: null,
      score_crisil: null,
      score_aum: null,
      score_rep: null,
      alpha_1y: null,
      alpha_3y: null,
      alpha_5y: null,
    };
  };

  for (const [key, fund] of fundsList) {
    if (fund.category !== "Equity") {
      nullifyScores(key, fund);
      continue;
    }

    const categoryName = fund.fund_category || "";
    let benchmarkId = "";

    // Strict Categories
    if (
      categoryName === "Flexi Cap Fund" ||
      categoryName === "Multi Cap Fund"
    ) {
      benchmarkId = "nifty-500";
    } else if (categoryName === "Large Cap Fund") {
      benchmarkId = "nifty-50";
    } else if (categoryName === "Mid Cap Fund") {
      benchmarkId = "nifty-midcap-150";
    } else if (categoryName === "Small Cap Fund") {
      benchmarkId = "nifty-smallcap-250";
    } else {
      nullifyScores(key, fund);
      continue;
    }

    const benchmark = benchmarks[benchmarkId];
    if (!benchmark) {
      nullifyScores(key, fund);
      continue;
    }

    // Temporarily attach alpha logic back to the fund object for Pass 2
    fund._internal_benchmark = benchmarkId;
    fund._alpha_1y =
      typeof fund.return_1y === "number" &&
      typeof benchmark.returns["1y"] === "number"
        ? fund.return_1y - benchmark.returns["1y"]
        : null;
    fund._alpha_3y =
      typeof fund.return_3y === "number" &&
      typeof benchmark.returns["3y"] === "number"
        ? fund.return_3y - benchmark.returns["3y"]
        : null;
    fund._alpha_5y =
      typeof fund.return_5y === "number" &&
      typeof benchmark.returns["5y"] === "number"
        ? fund.return_5y - benchmark.returns["5y"]
        : null;

    // Seed Categorical Alpha Arrays
    if (!categoryAlphas[benchmarkId]) {
      categoryAlphas[benchmarkId] = { "1y": [], "3y": [], "5y": [] };
    }

    const cat = categoryAlphas[benchmarkId]!;
    if (fund._alpha_1y !== null) cat["1y"].push(fund._alpha_1y);
    if (fund._alpha_3y !== null) cat["3y"].push(fund._alpha_3y);
    if (fund._alpha_5y !== null) cat["5y"].push(fund._alpha_5y);
  }

  // Pre-Compute Min/Max Bounds per Category
  const categoryBounds: Record<
    string,
    {
      "1y": { min: number; max: number };
      "3y": { min: number; max: number };
      "5y": { min: number; max: number };
    }
  > = {};

  for (const [benchmarkId, alphas] of Object.entries(categoryAlphas)) {
    categoryBounds[benchmarkId] = {
      // Find actual min and max in category. Fallback to 0 / 0.0001 if array is empty
      "1y": {
        min: alphas["1y"].length > 0 ? Math.min(...alphas["1y"]) : 0,
        max: alphas["1y"].length > 0 ? Math.max(...alphas["1y"]) : 0.0001,
      },
      "3y": {
        min: alphas["3y"].length > 0 ? Math.min(...alphas["3y"]) : 0,
        max: alphas["3y"].length > 0 ? Math.max(...alphas["3y"]) : 0.0001,
      },
      "5y": {
        min: alphas["5y"].length > 0 ? Math.min(...alphas["5y"]) : 0,
        max: alphas["5y"].length > 0 ? Math.max(...alphas["5y"]) : 0.0001,
      },
    };
  }

  // Helper dynamic Min-Max Normalization (0-100)
  const normalizeAlphaWithinCategory = (
    alpha: number | null,
    min: number,
    max: number,
  ): number | null => {
    if (alpha === null) return null;
    if (max === min) return 50;

    const normalized = ((alpha - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, normalized));
  };

  // Pass 2: The Scoring Loop
  let scoredCount = 0;

  for (const [key, fund] of fundsList) {
    if (fund.category !== "Equity" || !fund._internal_benchmark) {
      continue;
    }

    const bounds = categoryBounds[fund._internal_benchmark];
    if (!bounds) continue;

    const norm1y = normalizeAlphaWithinCategory(
      fund._alpha_1y,
      bounds["1y"].min,
      bounds["1y"].max,
    );
    const norm3y = normalizeAlphaWithinCategory(
      fund._alpha_3y,
      bounds["3y"].min,
      bounds["3y"].max,
    );
    const norm5y = normalizeAlphaWithinCategory(
      fund._alpha_5y,
      bounds["5y"].min,
      bounds["5y"].max,
    );

    let scorePerf = 0;
    if (norm1y !== null && norm3y !== null && norm5y !== null) {
      scorePerf = norm1y * 0.3 + norm3y * 0.45 + norm5y * 0.25;
    } else if (norm1y !== null && norm3y !== null) {
      scorePerf = norm1y * 0.4 + norm3y * 0.6;
    } else if (norm1y !== null) {
      scorePerf = norm1y;
    } else {
      scorePerf = 50;
    }

    const scoreCrisil = normalizeCrisil(fund.fund_rating);
    const scoreAUM = normalizeAUM(fund.aum);
    const scoreRep = amcReputations[fund.amc] || 50;

    const atlasScore =
      scorePerf * 0.86 + scoreCrisil * 0.1 + scoreAUM * 0.02 + scoreRep * 0.02;

    masterIndexData[key] = {
      ...fund,
      atlas_score: parseFloat(atlasScore.toFixed(2)),
      score_perf: parseFloat(scorePerf.toFixed(2)),
      score_crisil: parseFloat(scoreCrisil.toFixed(2)),
      score_aum: parseFloat(scoreAUM.toFixed(2)),
      score_rep: parseFloat(scoreRep.toFixed(2)),
      alpha_1y:
        fund._alpha_1y !== null ? parseFloat(fund._alpha_1y.toFixed(2)) : null,
      alpha_3y:
        fund._alpha_3y !== null ? parseFloat(fund._alpha_3y.toFixed(2)) : null,
      alpha_5y:
        fund._alpha_5y !== null ? parseFloat(fund._alpha_5y.toFixed(2)) : null,
    };

    // Sandbox Cleanup
    delete masterIndexData[key]._internal_benchmark;
    delete masterIndexData[key]._alpha_1y;
    delete masterIndexData[key]._alpha_3y;
    delete masterIndexData[key]._alpha_5y;

    scoredCount++;
  }

  // Write the heavily refined Master payload back to disk
  fs.writeFileSync(masterIndexPath, JSON.stringify(masterIndexData, null, 2));
  console.log(
    `[SUCCESS] The Atlas Engine successfully scored ${scoredCount} Active Equity Funds. Overwrote ${masterIndexPath}`,
  );
}

runAtlasScoreCompute();
