import { Cashflow, calculateXIRR } from "./xirr";
import { NavPoint, getNavOnOrBefore } from "./retrieval";

export interface SIPConfig {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  monthlyAmount: number;
  stepUpPercent?: number; // e.g. 10 for 10% annual increase
  stepUpMonth?: number; // 1-12, default to the month of the startDate
}

export interface SIPResult {
  totalInvested: number;
  finalValue: number;
  xirr: number | null;
  absoluteReturn: number;
  unitsAccumulated: number;
  cashflows: Cashflow[];
  validDates: boolean;
}

export function simulateSIP(
  history: NavPoint[],
  config: SIPConfig,
): SIPResult | null {
  if (!history || history.length === 0) return null;

  const start = new Date(config.startDate);
  const end = new Date(config.endDate);

  if (start > end) return null;

  const earliestDatum = new Date(history[history.length - 1]!.date);
  if (start < earliestDatum) {
    // Fund didn't exist when the SIP was supposed to start.
    return {
      totalInvested: 0,
      finalValue: 0,
      xirr: null,
      absoluteReturn: 0,
      unitsAccumulated: 0,
      cashflows: [],
      validDates: false,
    };
  }

  const cashflows: Cashflow[] = [];
  let currentAmount = config.monthlyAmount;
  let totalUnits = 0;
  let totalInvested = 0;

  // We loop month by month
  // Step-Up happens when the loop hits the designated Step-Up Month
  const stepUpMonth = config.stepUpMonth ?? start.getMonth() + 1; // 1-12
  const currentDate = new Date(start);

  while (currentDate <= end) {
    // 1. Get the NAV exactly on this date, or fallback strictly backwards
    const navPoint = getNavOnOrBefore(currentDate, history);

    if (navPoint) {
      // 2. Buy units
      const unitsBought = currentAmount / navPoint.close;
      totalUnits += unitsBought;
      totalInvested += currentAmount;

      // 3. Record outward cashflow (negative since it leaves our pocket)
      cashflows.push({
        date: navPoint.date,
        amount: -currentAmount,
      });
    }

    // Move Forward 1 Month
    currentDate.setMonth(currentDate.getMonth() + 1);

    // Check if we hit the step up month in a NEW year (so not the 1st installment)
    // Actually, stepup happens annually.
    // If the month matches, and we aren't in the exact same year we started.
    if (
      config.stepUpPercent &&
      config.stepUpPercent > 0 &&
      currentDate.getMonth() + 1 === stepUpMonth &&
      currentDate.getFullYear() > start.getFullYear()
    ) {
      currentAmount = currentAmount * (1 + config.stepUpPercent / 100);
    }
  }

  // Final Valuation
  const finalNavPoint = getNavOnOrBefore(end, history);
  if (!finalNavPoint || cashflows.length === 0) {
    return null;
  }

  const finalValue = totalUnits * finalNavPoint.close;

  // To compute XIRR, we must add the final "withdrawal" (positive inflow to us)
  cashflows.push({
    date: finalNavPoint.date,
    amount: finalValue,
  });

  const xirrVal = calculateXIRR(cashflows);
  const absoluteReturnFloat =
    ((finalValue - totalInvested) / totalInvested) * 100;

  return {
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    finalValue: parseFloat(finalValue.toFixed(2)),
    xirr: xirrVal,
    absoluteReturn: parseFloat(absoluteReturnFloat.toFixed(2)),
    unitsAccumulated: parseFloat(totalUnits.toFixed(4)),
    cashflows: cashflows.slice(0, cashflows.length - 1), // Don't expose fake withdrawal to users
    validDates: true,
  };
}
