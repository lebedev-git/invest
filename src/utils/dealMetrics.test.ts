import { describe, it, expect } from 'vitest';
import {
  parsePercent,
  parseMoney,
  getInvestorsTotal,
  getDealCapital,
  getAnnualRent,
  hasRentModel,
  getNetAnnualFlow,
  getPaybackYears,
} from './dealMetrics';
import type { Deal } from '../context/DealContext';

const baseDeal = (over: Partial<Deal>): Deal => ({
  id: '1', name: 'x', type: '', city: '', targetIrr: '0', termDate: '', status: 'Аренда',
  ...over,
}) as Deal;

describe('parseMoney / parsePercent', () => {
  it('парсит числа с запятой и пробелами', () => {
    expect(parseMoney('1 000 000')).toBe(1_000_000);
    expect(parseMoney('12,5')).toBe(12.5);
    expect(parseMoney(undefined)).toBe(0);
    expect(parsePercent('7,5')).toBe(7.5);
    expect(parsePercent(undefined)).toBe(0);
  });
});

describe('getDealCapital — приоритет metrics над сырыми полями', () => {
  it('берёт investmentSum из metrics, если он есть', () => {
    const deal = baseDeal({ metrics: { investmentSum: 5_000_000 } as any, purchasePrice: 1 });
    expect(getDealCapital(deal)).toBe(5_000_000);
  });

  it('fallback на purchasePrice/инвесторов без metrics', () => {
    expect(getDealCapital(baseDeal({ purchasePrice: 2_000_000 }))).toBe(2_000_000);
    expect(getDealCapital(baseDeal({
      investors: [{ id: 'a', name: 'A', amount: 300_000 }, { id: 'b', name: 'B', amount: 200_000 }],
    }))).toBe(500_000);
  });
});

describe('getInvestorsTotal', () => {
  it('суммирует суммы инвесторов', () => {
    expect(getInvestorsTotal(baseDeal({
      investors: [{ id: 'a', name: 'A', amount: 100 }, { id: 'b', name: 'B', amount: 250 }],
    }))).toBe(350);
  });
  it('пустой список → 0', () => {
    expect(getInvestorsTotal(baseDeal({}))).toBe(0);
  });
});

describe('getAnnualRent / hasRentModel', () => {
  it('годовая аренда = площадь * ставка * 12', () => {
    expect(getAnnualRent(baseDeal({ areaSqm: 100, rentRatePerSqm: 1_000 }))).toBe(1_200_000);
  });
  it('hasRentModel требует и площадь, и ставку', () => {
    expect(hasRentModel(baseDeal({ areaSqm: 100, rentRatePerSqm: 1_000 }))).toBe(true);
    expect(hasRentModel(baseDeal({ areaSqm: 100 }))).toBe(false);
  });
});

describe('getNetAnnualFlow / getPaybackYears', () => {
  it('берёт cashFlow*12 из metrics', () => {
    expect(getNetAnnualFlow(baseDeal({ metrics: { cashFlow: 50_000 } as any }))).toBe(600_000);
  });

  it('payback из metrics, null если не окупается', () => {
    expect(getPaybackYears(baseDeal({ metrics: { paybackYears: 4.9 } as any }))).toBe(4.9);
    expect(getPaybackYears(baseDeal({ metrics: { paybackYears: '—' } as any }))).toBeNull();
  });

  it('payback fallback: капитал / годовой поток', () => {
    const deal = baseDeal({ purchasePrice: 1_200_000, areaSqm: 100, rentRatePerSqm: 1_000, propertyTaxAnnual: 0 });
    // годовой поток = 100*1000*12 = 1 200 000; payback = 1 200 000 / 1 200 000 = 1 год
    expect(getPaybackYears(deal)).toBeCloseTo(1, 5);
  });

  it('payback = null при нулевом/отрицательном потоке', () => {
    expect(getPaybackYears(baseDeal({ purchasePrice: 1_000_000 }))).toBeNull();
  });
});
