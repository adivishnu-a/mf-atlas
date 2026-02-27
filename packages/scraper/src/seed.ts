import fs from 'fs';
import path from 'path';
import { AmfiService } from './amfiService';
import { KuveraService } from './kuveraService';

async function runInitialSeed() {
  console.log('--- Starting MF Atlas Initial Seed Execution ---');

  const kuveraService = new KuveraService();
  const amfiService = new AmfiService();

  const dataDir = path.resolve(__dirname, '../../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  try {
    // 1. Fetch Master List from Kuvera
    const validFunds = await kuveraService.fetchFilteredFundCodes();
    
    // Create a master index mapping
    const masterIndex: Record<string, { name: string, category: string, amc: string, isin: string }> = {};

    console.log(`Processing ${validFunds.length} valid funds...`);
    
    for (let i = 0; i < validFunds.length; i++) {
        const fund = validFunds[i];
        
        // This process is slow to prevent Kuvera IP blocks
        if (i % 25 === 0) console.log(`Processing ${i}/${validFunds.length}...`);

        const details = await kuveraService.getFundDetails(fund.code);
        const isin = details?.ISIN || 'UNKNOWN';

        masterIndex[fund.code] = {
            name: fund.name,
            category: fund.category,
            amc: fund.fundHouse,
            isin: isin
        };
        
        // Save initial placeholder JSON file for the fund history.
        // We will hydrate history from AMFI inside the Daily Sync moving forward
        const fundHistoryPath = path.join(dataDir, `${isin}.json`);
        
        if (!fs.existsSync(fundHistoryPath) && isin !== 'UNKNOWN') {
            fs.writeFileSync(fundHistoryPath, JSON.stringify([
                { date: new Date().toISOString().split('T')[0], nav: fund.nav }
            ]));
        }

        await new Promise(res => setTimeout(res, 50));
    }

    // Write the master index map
    fs.writeFileSync(path.join(dataDir, 'master_index.json'), JSON.stringify(masterIndex, null, 2));

    console.log('--- Initial Seed Complete ---');
    console.log(`Data successfully written to ${dataDir}`);

  } catch (err) {
    console.error('Fatal Error running Initial Seed:', err);
    process.exit(1);
  }
}

runInitialSeed();
