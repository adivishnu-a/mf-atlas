import axios from 'axios';
import { parse } from 'csv-parse/sync';

export interface NAVRecord {
  schemeCode: number;
  isinGrowth: string | null;
  isinReinvestment: string | null;
  schemeName: string;
  nav: number;
  date: string;
}

export class AmfiService {
  private readonly amfiUrl = 'https://portal.amfiindia.com/spages/NAVAll.txt';

  async fetchLatestNavs(): Promise<NAVRecord[]> {
    console.log('Fetching latest NAVs from AMFI...');
    const response = await axios.get(this.amfiUrl);
    
    return this.parseAmfiData(response.data);
  }

  private parseAmfiData(rawData: string): NAVRecord[] {
    const lines = rawData.split('\n');
    const records: NAVRecord[] = [];
    
    // Skip down to actual data, bypassing headers
    let inDataSection = false;

    for (const line of lines) {
      const trimmedInfo = line.trim();
      
      // Skip empty lines or category headers
      if (!trimmedInfo || trimmedInfo.includes('Open Ended Schemes') || trimmedInfo.includes('Close Ended Schemes') || !trimmedInfo.includes(';')) {
        continue;
      }

      // Check for the csv header line
      if (trimmedInfo.startsWith('Scheme Code;ISIN')) {
        inDataSection = true;
        continue;
      }

      if (!inDataSection) continue;

      const [schemeCode, isin1, isin2, schemeName, navStr, date] = trimmedInfo.split(';');

      if (!schemeCode || !schemeName || !navStr || !date) continue;

      const nav = parseFloat(navStr);
      if (isNaN(nav)) continue;

      records.push({
        schemeCode: parseInt(schemeCode, 10),
        isinGrowth: isin1 && isin1 !== '-' ? isin1 : null,
        isinReinvestment: isin2 && isin2 !== '-' ? isin2 : null,
        schemeName,
        nav,
        date
      });
    }

    console.log(`Parsed ${records.length} valid NAV records from AMFI.`);
    return records;
  }
}
