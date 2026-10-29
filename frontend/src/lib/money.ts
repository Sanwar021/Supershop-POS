// Utility functions for money and currency formatting
// All money amounts are stored in minor units (BIGINT integer poisha/cents)

const BANGLA_DIGITS: { [key: string]: string } = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
  '.': '.',
};

export function formatMoney(
  amountMinor: number,
  currency: string = 'BDT',
  useBanglaDigits: boolean = false
): string {
  const units = (amountMinor || 0) / 100;
  const formatted = units.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const symbol = currency === 'BDT' ? '৳' : currency === 'USD' ? '$' : currency;

  if (useBanglaDigits) {
    const banglaStr = formatted.replace(/[0-9.]/g, (d) => BANGLA_DIGITS[d] || d);
    return `${symbol} ${banglaStr}`;
  }

  return `${symbol} ${formatted}`;
}

export function toMinorUnits(majorAmount: number | string): number {
  const val = typeof majorAmount === 'string' ? parseFloat(majorAmount) : majorAmount;
  if (isNaN(val)) return 0;
  return Math.round(val * 100);
}

export function toMajorUnits(minorAmount: number): number {
  return (minorAmount || 0) / 100;
}
