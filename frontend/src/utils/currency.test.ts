import { describe, expect, it } from 'vitest';
import { compactZarCurrency, formatZAR } from './currency';

describe('ZAR currency formatting', () => {
  it('formats standard and chart values as South African rand', () => {
    expect(formatZAR(875000)).toMatch(/^R\s*875[\s,]000$/);
    expect(compactZarCurrency.format(1420000)).toMatch(/^R\s*1[,.]4M$/);
  });
});
