import fs from "fs";
import path from "path";
import { AmfiService } from "./amfiService";
import { MfApiService, NavEntry } from "./mfApiService";

async function runDailySync() {
  console.log("--- Starting MF Atlas Daily Incremental Fund Sync ---");
  const dataDir = path.resolve(__dirname, "../../../data");
  const masterIndexPath = path.join(dataDir, "master_index.json");

  if (!fs.existsSync(masterIndexPath)) {
    console.warn("master_index.json not found. Run seed first.");
    return;
  }

  const masterIndex = JSON.parse(fs.readFileSync(masterIndexPath, "utf-8"));
  const amfiService = new AmfiService();
  const mfApiService = new MfApiService();

  const amfiNavs = await amfiService.fetchLatestNavs();

  const navMap = new Map<number, any>();
  for (const record of amfiNavs) {
    navMap.set(record.schemeCode, record);
  }

  let updateCount = 0;

  for (const fundCode of Object.keys(masterIndex)) {
    const fundDetails = masterIndex[fundCode];
    const { isin, schemeCode } = fundDetails;

    if (!schemeCode || !isin) continue;

    const amfiRecord = navMap.get(schemeCode);
    if (!amfiRecord) continue;

    // AMFI date is typically DD-MMM-YYYY, e.g., 27-Feb-2026
    const dateObj = new Date(amfiRecord.date);
    if (isNaN(dateObj.getTime())) continue;

    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    const fundHistoryPath = path.join(dataDir, `${isin}.json`);
    let history: NavEntry[] = [];

    if (fs.existsSync(fundHistoryPath)) {
      try {
        history = JSON.parse(fs.readFileSync(fundHistoryPath, "utf-8"));
      } catch (_e) {
        // ignore JSON parse errors and overwrite
      }
    }

    const latestExistingDateStr =
      history.length > 0 ? history[0]?.date : "1900-01-01";

    // Append the delta if it's uniquely newer
    if (
      !latestExistingDateStr ||
      new Date(formattedDate) > new Date(latestExistingDateStr)
    ) {
      history.unshift({ date: formattedDate, nav: amfiRecord.nav });
      // Ensure strictly newest-first sorting
      history.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      fs.writeFileSync(fundHistoryPath, JSON.stringify(history));

      const trailingReturns = mfApiService.calculateTrailingReturns(history);

      // Update master index mutating in place
      Object.assign(fundDetails, trailingReturns);
      fundDetails.latest_nav = amfiRecord.nav;
      fundDetails.latest_nav_date = formattedDate;

      updateCount++;
    }
  }

  fs.writeFileSync(masterIndexPath, JSON.stringify(masterIndex, null, 2));
  console.log(
    `[SUCCESS] Incremental AMFI sync complete. Updated ${updateCount} funds.`,
  );
}

runDailySync();
