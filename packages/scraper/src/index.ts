import { AmfiService } from './amfiService';
import { KuveraService } from './kuveraService';

async function runDataRefinery() {
  console.log('--- Starting MF Atlas Data Refinery (The Big Bang) ---');

  const kuveraService = new KuveraService();
  const amfiService = new AmfiService();

  try {
    // 1. Fetch Master List from Kuvera (direct growth only)
    const validFundsInfo = await kuveraService.fetchFilteredFundCodes();

    if (validFundsInfo.length === 0) {
      console.warn('No funds passed the Atlas Filter. Aborting.');
      return;
    }

    // 2. Extract detailed metadata for the first 5 to test Kuvera Endpoint limit logic
    console.log(`Processing the first 5 records of ${validFundsInfo.length} for test purposes:`);
    
    const testFunds = validFundsInfo.slice(0, 5);
    for (const fund of testFunds) {
      console.log(`Fetching metadata for [${fund.code}] ${fund.name}...`);
      const details = await kuveraService.getFundDetails(fund.code);
      if (details) {
        console.log(`\t> ISIN: ${details.ISIN || 'N/A'}`);
      } else {
        console.log(`\t> ISIN Fetch Failed for ${fund.code}`);
      }
      
      // Artificial delay to prevent API blocking
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 3. Fetch AMFI global sheet to test downloading functionality
    const amfiNavs = await amfiService.fetchLatestNavs();
    console.log(`Total active NAVs on AMFI today: ${amfiNavs.length}`);

    console.log('--- Refinery Test Complete ---');

  } catch (err) {
    console.error('Fatal Error running Data Refinery:', err);
    process.exit(1);
  }
}

runDataRefinery();
