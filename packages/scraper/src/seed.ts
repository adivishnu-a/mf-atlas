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
    const masterIndex: Record<string, any> = {};

    console.log(`Processing ${validFunds.length} valid funds...`);

    for (let i = 0; i < validFunds.length; i++) {
      const fund = validFunds[i];
      if (!fund) continue;

      if (i % 25 === 0) console.log(`Processing ${i}/${validFunds.length}...`);

      const details = await kuveraService.getFundDetails(fund.code);
      if (!details) continue;

      // Ensure the detail payload matches the strict Atlas filter
      if (details.direct !== "Y" || details.reinvestment !== "Z") {
        continue;
      }

      const isin = details.ISIN || "UNKNOWN";
      const schemeCode =
        isin !== "UNKNOWN" ? isinToSchemeCode.get(isin) || null : null;

      const fundHistoryPath = path.join(dataDir, `${isin}.json`);
      let historyArray: Array<{ date: string; nav: number }> = [];

      // Fetch historical NAVs mapping from mfapi.in
      if (schemeCode) {
        historyArray = await mfApiService.getHistoricalNav(schemeCode);
      }

      // If empty, fall back to at least saving today's NAV
      if (historyArray.length === 0) {
        const todayDate = new Date().toISOString().split("T")[0] ?? "UNKNOWN";
        historyArray = [{ date: todayDate, nav: fund.nav }];
      }

      // Explicitly write the JSON history
      fs.writeFileSync(fundHistoryPath, JSON.stringify(historyArray));

      // Calculate the Return Math Off The Historical Array
      const trailingReturns =
        mfApiService.calculateTrailingReturns(historyArray);

      // Hydrate the Master Record
      masterIndex[fund.code] = {
        name: details.name,
        category: details.category,
        amc: details.fund_house,
        isin: isin,
        schemeCode: schemeCode,

        lump_available: details.lump_available,
        sip_available: details.sip_available,
        lump_min: details.lump_min,
        sip_min: details.sip_min,
        lock_in_period: details.lock_in_period,
        detail_info: details.detail_info,
        tax_period: details.tax_period,
        small_screen_name: details.small_screen_name,
        volatility: details.volatility,
        start_date: details.start_date,
        fund_type: details.fund_type,
        fund_category: details.fund_category,
        expense_ratio: details.expense_ratio,
        expense_ratio_date: details.expense_ratio_date,
        fund_manager: details.fund_manager,
        crisil_rating: details.crisil_rating,
        investment_objective: details.investment_objective,
        portfolio_turnover:
          typeof details.portfolio_turnover === "string"
            ? parseFloat(details.portfolio_turnover)
            : details.portfolio_turnover,
        aum: details.aum,
        fund_rating: details.fund_rating,
        comparison: JSON.stringify(
          (details.comparison || []).map((peer: any) => ({
            code: peer.code,
            info_ratio: peer.info_ratio,
          })),
        ),

        ...trailingReturns,
        latest_nav: historyArray.length > 0 ? historyArray[0]!.nav : null,
        latest_nav_date: historyArray.length > 0 ? historyArray[0]!.date : null,
      };

      await new Promise((res) => setTimeout(res, 250)); // Respect API rate limits
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
