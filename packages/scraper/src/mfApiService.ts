import axios from "axios";

export interface MfApiFund {
  schemeCode: number;
  schemeName: string;
  isinGrowth: string | null;
  isinDivReinvestment: string | null;
}

export class MfApiService {
  private readonly baseUrl = "https://api.mfapi.in";

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
