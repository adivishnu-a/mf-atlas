import fs from "fs";
import path from "path";

function runCategoryAverages() {
  console.log("--- Computing Category Trailing Return Averages ---");

  const dataDir = path.resolve(__dirname, "../../../data");
  const fundsPath = path.join(dataDir, "master_index.json");
  const targetPath = path.join(dataDir, "category_averages.json");

  if (!fs.existsSync(fundsPath)) {
    console.log("[SKIP] master_index.json not found.");
    return;
  }

  const fundsData = JSON.parse(fs.readFileSync(fundsPath, "utf-8"));

  // Find all distinct fund categories
  const allCategories = new Set<string>();
  for (const fund of Object.values(fundsData) as any[]) {
    if (fund.fund_category) {
      allCategories.add(fund.fund_category);
    }
  }

  const categoryAverages = [];

  for (const cat of Array.from(allCategories)) {
    const catFunds = Object.values(fundsData).filter(
      (f: any) => f.fund_category === cat,
    );
    if (catFunds.length === 0) continue;

    const returnsKeys = [
      "return_1d",
      "return_1w",
      "return_1m",
      "return_3m",
      "return_6m",
      "return_1y",
      "return_2y",
      "return_3y",
      "return_5y",
      "return_10y",
    ];

    const catReturns: Record<string, number | null> = {};

    for (const k of returnsKeys) {
      let sum = 0;
      let count = 0;
      for (const f of catFunds as any[]) {
        if (typeof f[k] === "number" && f[k] !== null) {
          sum += f[k];
          count++;
        }
      }
      catReturns[k] = count > 0 ? parseFloat((sum / count).toFixed(2)) : null;
    }

    categoryAverages.push({
      category: cat,
      latest_date: new Date().toISOString().split("T")[0],
      ...catReturns,
    });
  }

  fs.writeFileSync(targetPath, JSON.stringify(categoryAverages, null, 2));
  console.log(
    `[SUCCESS] Generated category_averages.json for ${categoryAverages.length} categories.`,
  );
}

runCategoryAverages();
