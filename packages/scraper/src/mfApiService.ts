import axios from "axios";

export interface NavEntry {
  date: string; // YYYY-MM-DD
  nav: number;
}

export interface MfApiFund {
  schemeCode: number;
  schemeName: string;
  isinGrowth: string | null;
  isinDivReinvestment: string | null;
}

export interface TrailingReturns {
  return_1d: number | null;
  return_1w: number | null;
  return_1m: number | null;
  return_3m: number | null;
  return_6m: number | null;
  return_1y: number | null;
  return_2y: number | null;
  return_3y: number | null;
  return_5y: number | null;
  return_10y: number | null;
  return_since_inception: number | null;
}

export class MfApiService {
  private readonly baseUrl = "https://api.mfapi.in";

  /**
   * Calculates absolute (<1y) and annualized (>=1y) point-to-point returns.
   * Uses "fall forward" logic: if the exact past date is missing (holiday/weekend),
   * it grabs the immediate next available working day's NAV.
   */
  calculateTrailingReturns(history: NavEntry[]): TrailingReturns {
    const returns: TrailingReturns = {
      return_1d: null,
      return_1w: null,
      return_1m: null,
      return_3m: null,
      return_6m: null,
      return_1y: null,
      return_2y: null,
      return_3y: null,
      return_5y: null,
      return_10y: null,
      return_since_inception: null,
    };

    if (!history || history.length < 2) return returns;

    // Ensure history is sorted descending (newest first), as MFAPI usually provides it
    const sorted = [...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const latest = sorted[0]!;
    const latestDate = new Date(latest.date);
    const latestNav = latest.nav;

    const oldest = sorted[sorted.length - 1]!;
    const inceptionDate = new Date(oldest.date);

    // Helper to find the NAV on or immediately *after* the target past date
    const getNavOnOrAfter = (targetDate: Date): number | null => {
      if (targetDate < inceptionDate) {
        return null; // Fund did not exist yet!
      }
      // Because array is newest first, we iterate backwards from end (oldest) to find the first one >= targetDate
      for (let i = sorted.length - 1; i >= 0; i--) {
        const item = sorted[i];
        if (item && new Date(item.date) >= targetDate) {
          return item.nav;
        }
      }
      return null; // History doesn't go back this far
    };

    const calcAbsolute = (pastNav: number | null): number | null => {
      if (pastNav === null || pastNav === 0) return null;
      return (latestNav / pastNav - 1) * 100;
    };

    const calcAnnualized = (
      pastNav: number | null,
      years: number,
    ): number | null => {
      if (pastNav === null || pastNav === 0) return null;
      return (Math.pow(latestNav / pastNav, 1 / years) - 1) * 100;
    };

    // 1 Day
    const d1 = new Date(latestDate);
    d1.setDate(d1.getDate() - 1);
    returns.return_1d = calcAbsolute(getNavOnOrAfter(d1));

    // 1 Week
    const d1w = new Date(latestDate);
    d1w.setDate(d1w.getDate() - 7);
    returns.return_1w = calcAbsolute(getNavOnOrAfter(d1w));

    // 1 Month
    const d1m = new Date(latestDate);
    d1m.setMonth(d1m.getMonth() - 1);
    returns.return_1m = calcAbsolute(getNavOnOrAfter(d1m));

    // 3 Months
    const d3m = new Date(latestDate);
    d3m.setMonth(d3m.getMonth() - 3);
    returns.return_3m = calcAbsolute(getNavOnOrAfter(d3m));

    // 6 Months
    const d6m = new Date(latestDate);
    d6m.setMonth(d6m.getMonth() - 6);
    returns.return_6m = calcAbsolute(getNavOnOrAfter(d6m));

    // 1 Year (Annualized starts here)
    const d1y = new Date(latestDate);
    d1y.setFullYear(d1y.getFullYear() - 1);
    returns.return_1y = calcAbsolute(getNavOnOrAfter(d1y)); // 1Y is strictly absolute conventionally, but mathematically identical to ^1

    // 2 Years
    const d2y = new Date(latestDate);
    d2y.setFullYear(d2y.getFullYear() - 2);
    returns.return_2y = calcAnnualized(getNavOnOrAfter(d2y), 2);

    // 3 Years
    const d3y = new Date(latestDate);
    d3y.setFullYear(d3y.getFullYear() - 3);
    returns.return_3y = calcAnnualized(getNavOnOrAfter(d3y), 3);

    // 5 Years
    const d5y = new Date(latestDate);
    d5y.setFullYear(d5y.getFullYear() - 5);
    returns.return_5y = calcAnnualized(getNavOnOrAfter(d5y), 5);

    // 10 Years
    const d10y = new Date(latestDate);
    d10y.setFullYear(d10y.getFullYear() - 10);
    returns.return_10y = calcAnnualized(getNavOnOrAfter(d10y), 10);

    // Since Inception
    const daysSinceInception =
      (latestDate.getTime() - inceptionDate.getTime()) / (1000 * 3600 * 24);
    if (daysSinceInception > 365) {
      returns.return_since_inception = calcAnnualized(
        oldest.nav,
        daysSinceInception / 365.25,
      );
    } else {
      returns.return_since_inception = calcAbsolute(oldest.nav);
    }

    return returns;
  }

  async fetchAllFunds(): Promise<MfApiFund[]> {
    console.log("Fetching master scheme list from mfapi.in...");
    const response = await axios.get(`${this.baseUrl}/mf`);
    return response.data;
  }

  async getHistoricalNav(
    schemeCode: number,
  ): Promise<Array<{ date: string; nav: number }>> {
    const url = `${this.baseUrl}/mf/${schemeCode}`;
    try {
      const response = await axios.get(url);
      if (response.data && response.data.data) {
        // MFAPI returns dates as DD-MM-YYYY, convert to YYYY-MM-DD
        return response.data.data.map((entry: any) => {
          const parts = entry.date.split("-");
          let formattedDate = entry.date;
          if (parts.length === 3) {
            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          return {
            date: formattedDate,
            nav: parseFloat(entry.nav),
          };
        });
      }
      return [];
    } catch (err) {
      return [];
    }
  }
}
