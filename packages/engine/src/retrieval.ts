import fs from "fs";
import path from "path";

/**
 * Standardized interface corresponding to parsed AMFI/Investing.com histories
 */
export interface NavPoint {
  date: string; // YYYY-MM-DD
  close: number;
}

/**
 * Validated response containing absolute file arrays
 */
export interface FundHistory {
  isin: string;
  data: NavPoint[];
}

/**
 * Retrieves the full historical NAV series for a unique fund ISIN.
 * Works seamlessly inside Node.js Back-Ends (Next.js server/cron).
 *
 * @param isin ISIN tracking code
 * @param dataDir Path pointing to the monorepo's `data/funds` dir
 * @returns Sorted array of NavPoints (Newest to Oldest) or null if unresolvable.
 */
export function getFundHistory(
  isin: string,
  dataDir: string,
): FundHistory | null {
  try {
    const filePath = path.join(dataDir, `${isin}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const rawData = fs.readFileSync(filePath, "utf-8");
    const parsedData = JSON.parse(rawData) as NavPoint[];

    // Enforce descending sort (newest array[0], oldest array[length-1])
    parsedData.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
      isin,
      data: parsedData,
    };
  } catch (err) {
    console.error(`Failed to ingest history for ISIN ${isin}`, err);
    return null;
  }
}

/**
 * Selects the highest allowable working NAV closest to but NOT PRECEDING the targetDate.
 * Handles holiday interpolation inherently by falling 'backwards' until the nearest active trading point.
 *
 * NOTE: The array must be sorted descendingly (newest first).
 */
export function getNavOnOrBefore(
  targetDate: Date,
  history: NavPoint[],
): NavPoint | null {
  if (history.length === 0) return null;

  const targetTime = targetDate.getTime();

  // Array is descending (newest -> oldest).
  // We want the most recent date that <= targetTime.
  let validPoint: NavPoint | null = null;
  for (let i = 0; i < history.length; i++) {
    const pointTime = new Date(history[i]!.date).getTime();
    if (pointTime <= targetTime) {
      validPoint = history[i]!;
      break;
    }
  }

  return validPoint;
}
