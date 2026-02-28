import axios from "axios";

export interface KuveraFund {
  code: string;
  name: string;
  assetClass: string;
  category: string;
  fundHouse: string;
  nav: number;
  reinvestment: string;
}

export interface KuveraFundDetail {
  code: string;
  name: string;
  category: string;
  fund_house: string;
  lump_available: string;
  sip_available: string;
  lump_min: number;
  sip_min: number;
  lock_in_period: number;
  detail_info: string;
  tax_period: number;
  small_screen_name: string;
  volatility: number;
  start_date: string;
  fund_type: string;
  fund_category: string;
  expense_ratio: string;
  expense_ratio_date: string;
  fund_manager: string;
  crisil_rating: string;
  investment_objective: string;
  portfolio_turnover: string;
  aum: number;
  fund_rating: number;
  comparison: any[];
  direct: string;
  reinvestment: string;
  ISIN: string;
}

export class KuveraService {
  private readonly listApiUrl =
    "https://api.kuvera.in/mf/api/v4/fund_schemes/list.json";
  private readonly headers = {
    Accept: "application/json",
    "User-Agent": "MF-Atlas-Scraper/1.0",
  };

  private readonly allowedCategories = {
    Equity: [
      "Large Cap Fund",
      "Mid Cap Fund",
      "Small Cap Fund",
      "Flexi Cap Fund",
      "Multi Cap Fund",
      "Large & Mid Cap fund",
      "Value Fund",
      "Contra Fund",
    ],
    Hybrid: [
      "Aggressive Hybrid Fund",
      "Balanced Hybrid Fund",
      "Dynamic Asset Allocation or Balanced Advantage",
      "Multi Asset Allocation",
    ],
  };

  async fetchFilteredFundCodes(): Promise<KuveraFund[]> {
    console.log("Fetching master fund list from Kuvera...");

    try {
      const response = await axios.get(this.listApiUrl, {
        headers: this.headers,
      });
      const data = response.data;
      const filteredFunds: KuveraFund[] = [];

      for (const [assetClass, categories] of Object.entries(
        this.allowedCategories,
      )) {
        if (!data[assetClass]) continue;

        for (const category of categories) {
          if (!data[assetClass][category]) continue;

          for (const [fundHouse, funds] of Object.entries(
            data[assetClass][category],
          )) {
            if (!Array.isArray(funds)) continue;

            // Apply Atlas Filter: Direct Growth only
            const directGrowthFunds = funds.filter((fund) => {
              const hasCode = typeof fund.c === "string";
              // '-GR' suffix represents Growth. The Kuvera code itself usually distinguishes Direct vs Regular, but we'll refine this later.
              const isGrowth = hasCode && fund.c.endsWith("-GR");
              const hasReinvestment = fund.re === "Y" || fund.re === "Z";

              // We want Direct plan funds. Usually '1' indicates Direct in Kuvera's internal code convention, or we map it using MFAPI later.
              return hasCode && isGrowth && hasReinvestment;
            });

            for (const fund of directGrowthFunds) {
              // We remove the strict "DIRECT" name check here.
              // We will rely on the "direct": "Y" flag in the details API instead.
              filteredFunds.push({
                code: fund.c,
                name: fund.n,
                assetClass,
                category,
                fundHouse,
                nav:
                  typeof fund.v === "number"
                    ? fund.v
                    : parseFloat(fund.v || "0"),
                reinvestment: fund.re,
              });
            }
          }
        }
      }

      console.log(
        `Found ${filteredFunds.length} valid Direct Growth funds passing the Atlas Filter.`,
      );
      return filteredFunds;
    } catch (error) {
      console.error("Error fetching Kuvera list data:", error);
      throw error;
    }
  }

  async getFundDetails(code: string): Promise<KuveraFundDetail | null> {
    const url = `https://api.kuvera.in/mf/api/v5/fund_schemes/${code}.json`;
    try {
      const response = await axios.get(url, { headers: this.headers });
      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        return response.data[0] as KuveraFundDetail;
      }
      return null;
    } catch (err) {
      return null;
    }
  }
}
