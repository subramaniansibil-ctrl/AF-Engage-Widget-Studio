export const CURRENCY_CODE = 'ZAR';
export const CURRENCY_SYMBOL = 'R';
export const CURRENCY_LOCALE = 'en-ZA';

export const zarCurrency = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: CURRENCY_CODE,
  maximumFractionDigits: 0,
});

export const compactZarCurrency = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: CURRENCY_CODE,
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatZAR(value: number) {
  return zarCurrency.format(value);
}
