import fs from "fs";
import path from "path";
import { KuveraService } from "./kuveraService";
import { MfApiService } from "./mfApiService";

async function runInitialSeed() {
  console.log("--- Starting MF Atlas Initial Seed Execution ---");

  const kuveraService = new KuveraService();
  const mfApiService = new MfApiService();

  const dataDir = path.resolve(__dirname, "../../../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  try {
    // 1. Fetch Master List from Kuvera
    const validFunds = await kuveraService.fetchFilteredFundCodes();

    // 2. Fetch Master List from MFAPI to map ISIN -> SchemeCode
    console.log("Fetching MFAPI complete list to build ISIN mapping...");
    const allMfApiFunds = await mfApiService.fetchAllFunds();

    const isinToSchemeCode = new Map<string, number>();
    for (const fund of allMfApiFunds) {
      if (fund.isinGrowth) {
        isinToSchemeCode.set(fund.isinGrowth, fund.schemeCode);
      }
    }
    console.log(
      `Successfully mapped ${isinToSchemeCode.size} ISINs to MFAPI Scheme Codes.`,
    );

    // Create a master index mapping
    const masterIndex: Record<
      string,
      {
        name: string;
        category: string;
        amc: string;
        isin: string;
        schemeCode: number | null;
      }
    > = {};

    console.log(`Processing ${validFunds.length} valid funds...`);

    for (let i = 0; i < validFunds.length; i++) {
      const fund = validFunds[i];
      if (!fund) continue;

      // This process is slow to prevent Kuvera IP blocks
      if (i % 25 === 0) console.log(`Processing ${i}/${validFunds.length}...`);

      const details = await kuveraService.getFundDetails(fund.code);
      const isin = details?.ISIN || "UNKNOWN";
      const schemeCode =
        isin !== "UNKNOWN" ? isinToSchemeCode.get(isin) || null : null;

      masterIndex[fund.code] = {
        name: fund.name,
        category: fund.category,
        amc: fund.fundHouse,
        isin: isin,
        schemeCode: schemeCode,
      };

      const fundHistoryPath = path.join(dataDir, `${isin}.json`);

      if (!fs.existsSync(fundHistoryPath) || true) {
        // Always override while seeding
        let historyArray: Array<{ date: string; nav: number }> = [];

        // Fetch historical NAVs mapping from mfapi.in
        if (schemeCode) {
          historyArray = await mfApiService.getHistoricalNav(schemeCode);
        }

        // If empty, fall back to at least saving today's NAV so the array isn't broken
        if (historyArray.length === 0) {
          const todayDate = new Date().toISOString().split("T")[0] ?? "UNKNOWN";
          historyArray = [{ date: todayDate, nav: fund.nav }];
        }

        fs.writeFileSync(fundHistoryPath, JSON.stringify(historyArray));
      }

      await new Promise((res) => setTimeout(res, 250)); // Respect mfapi and kuvera rate limits
    }

    // Write the master index map
    fs.writeFileSync(
      path.join(dataDir, "master_index.json"),
      JSON.stringify(masterIndex, null, 2),
    );

    console.log("--- Initial Seed Complete ---");
    console.log(`Data successfully written to ${dataDir}`);
  } catch (err) {
    console.error("Fatal Error running Initial Seed:", err);
    process.exit(1);
  }
}

runInitialSeed();
