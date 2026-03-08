export interface NavPoint {
  date: string; // YYYY-MM-DD
  close: number;
}

export interface FundHistory {
  isin: string;
  data: NavPoint[];
}

export async function getFundHistory(
  isin: string,
): Promise<FundHistory | null> {
  try {
    const remoteUrl = `https://raw.githubusercontent.com/adivishnu-a/mf-atlas/data-branch/data/funds/${isin}.json`;
    const res = await fetch(remoteUrl);

    if (!res.ok) {
      return null;
    }

    const rawData = await res.text();
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
