// eslint-disable-next-line @typescript-eslint/no-require-imports
const xirr = require("xirr");

/**
 * Represents a single cashflow event for XIRR calculation.
 */
export interface Cashflow {
  amount: number;
  date: Date | string;
}

/**
 * Calculates the XIRR (Extended Internal Rate of Return) for a series of cashflows.
 * Uses the Newton-Raphson approximation under the hood via the 'xirr' npm package.
 *
 * @param cashflows Array of cashflows containing Date strings and amounts.
 * @returns The annualized return percentage (e.g., 12.5 for 12.5%). Returns null if invalid or incalculable.
 */
export function calculateXIRR(cashflows: Cashflow[]): number | null {
  if (!cashflows || cashflows.length < 2) {
    return null;
  }

  try {
    const formattedCashflows = cashflows.map((cf) => ({
      amount: cf.amount,
      when: new Date(cf.date),
    }));

    // The xirr package returns a raw decimal (e.g. 0.125 for 12.5%).
    const rawRate = xirr(formattedCashflows);

    // We cap it to 2 decimals safely
    return parseFloat((rawRate * 100).toFixed(2));
  } catch (error) {
    // The library throws if Newton-Raphson fails to converge
    console.warn("XIRR computation failed to converge.", error);
    return null;
  }
}
