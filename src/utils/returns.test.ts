import { describe, it, expect } from 'vitest';
import { xirr, computeDealReturns, computePortfolioReturns, type CashFlow } from './returns';
import type { Deal, Payout } from '../context/DealContext';

const d = (s: string) => new Date(s);

const baseDeal = (over: Partial<Deal>): Deal => ({
  id: '1', name: 'x', type: '', city: '', targetIrr: '0', termDate: '', status: 'Аренда',
  ...over,
}) as Deal;

const payout = (over: Partial<Payout>): Payout => ({
  id: 'p', deal: '1', date: '2025-01-01', amount: 0, kind: 'dividend', ...over,
});

describe('xirr', () => {
  it('считает 10% для −1000 @ t0 и +1100 через год', () => {
    const flows: CashFlow[] = [
      { date: d('2024-01-01'), amount: -1000 },
      { date: d('2025-01-01'), amount: 1100 },
    ];
    const r = xirr(flows);
    expect(r).not.toBeNull();
    expect(r as number).toBeCloseTo(0.10, 2);
  });

  it('многолетний поток с промежуточными выплатами', () => {
    // −10000 в начале, +3000 через год, +9000 через два года → ~14.3% годовых
    const flows: CashFlow[] = [
      { date: d('2023-01-01'), amount: -10000 },
      { date: d('2024-01-01'), amount: 3000 },
      { date: d('2025-01-01'), amount: 9000 },
    ];
    const r = xirr(flows) as number;
    expect(r).toBeGreaterThan(0.10);
    expect(r).toBeLessThan(0.20);
    // Проверяем, что NPV по найденной ставке ≈ 0
    const t0 = d('2023-01-01').getTime();
    const npv = flows.reduce((s, f) => s + f.amount / Math.pow(1 + r, (f.date.getTime() - t0) / (365 * 24 * 3600 * 1000)), 0);
    expect(Math.abs(npv)).toBeLessThan(1);
  });

  it('отрицательная доходность при убытке', () => {
    const flows: CashFlow[] = [
      { date: d('2024-01-01'), amount: -1000 },
      { date: d('2025-01-01'), amount: 800 },
    ];
    expect(xirr(flows) as number).toBeCloseTo(-0.20, 2);
  });

  it('null без смены знака потоков', () => {
    expect(xirr([{ date: d('2024-01-01'), amount: -1 }, { date: d('2025-01-01'), amount: -1 }])).toBeNull();
    expect(xirr([{ date: d('2024-01-01'), amount: 100 }])).toBeNull();
  });
});

describe('computeDealReturns', () => {
  const now = d('2025-01-01');

  it('MOIC/DPI/XIRR по equity (свои деньги, без кредита)', () => {
    const deal = baseDeal({
      financials: { ownMoney: 1000000, creditMoney: 500000, purchaseDate: '2024-01-01', extraExpenses: [] },
      performance: { currentMarketValue: 2000000 },
      share: 1,
      metrics: { currentEquity: 1100000 } as any,
    });
    const payouts = [payout({ amount: 100000, date: '2024-07-01' })];
    const r = computeDealReturns(deal, payouts, now);
    expect(r.equityInvested).toBe(1000000); // только own (кредит не учитывается)
    expect(r.distributed).toBe(100000);
    expect(r.currentValue).toBe(1100000); // metrics.currentEquity, т.к. оценка задана
    expect(r.dpi as number).toBeCloseTo(0.1, 5);
    expect(r.moic as number).toBeCloseTo(1.2, 5); // (100k + 1.1M) / 1M
    expect(r.xirr).not.toBeNull();
  });

  it('extraExpenses входят в equity', () => {
    const deal = baseDeal({
      financials: { ownMoney: 900000, creditMoney: 0, purchaseDate: '2024-01-01',
        extraExpenses: [{ id: '1', category: 'Комиссия', amount: 100000 }] },
      performance: { currentMarketValue: 1000000 },
      share: 1, metrics: { currentEquity: 1000000 } as any,
    });
    const r = computeDealReturns(deal, [], now);
    expect(r.equityInvested).toBe(1000000);
    expect(r.moic as number).toBeCloseTo(1.0, 5);
  });

  it('без оценки — актив по себестоимости (MOIC≥DPI, XIRR≈0 без выплат)', () => {
    const deal = baseDeal({
      financials: { ownMoney: 1000000, creditMoney: 0, purchaseDate: '2024-01-01', extraExpenses: [] },
      performance: { currentMarketValue: 0 }, share: 1, metrics: { currentEquity: 0 } as any,
    });
    const r = computeDealReturns(deal, [], now);
    expect(r.currentValue).toBe(1000000); // fallback = вложено
    expect(r.moic as number).toBeCloseTo(1.0, 5);
  });

  it('XIRR = null без даты входа', () => {
    const deal = baseDeal({
      financials: { ownMoney: 1000000, creditMoney: 0, purchaseDate: '', extraExpenses: [] },
      performance: { currentMarketValue: 1200000 }, share: 1, metrics: { currentEquity: 1200000 } as any,
    });
    const r = computeDealReturns(deal, [], now);
    expect(r.xirr).toBeNull();
    expect(r.moic as number).toBeCloseTo(1.2, 5); // MOIC считается без дат
  });
});

describe('computePortfolioReturns', () => {
  it('агрегирует equity/выплаты и считает портфельный MOIC', () => {
    const now = d('2025-01-01');
    const deals = [
      baseDeal({ id: 'a', financials: { ownMoney: 1000000, creditMoney: 0, purchaseDate: '2024-01-01', extraExpenses: [] },
        performance: { currentMarketValue: 1500000 }, share: 1, metrics: { currentEquity: 1500000 } as any }),
      baseDeal({ id: 'b', financials: { ownMoney: 1000000, creditMoney: 0, purchaseDate: '2024-01-01', extraExpenses: [] },
        performance: { currentMarketValue: 900000 }, share: 1, metrics: { currentEquity: 900000 } as any }),
    ];
    const payouts = [payout({ deal: 'a', amount: 200000, date: '2024-06-01' })];
    const r = computePortfolioReturns(deals, payouts, now);
    expect(r.equityInvested).toBe(2000000);
    expect(r.distributed).toBe(200000);
    expect(r.currentValue).toBe(2400000);
    expect(r.moic as number).toBeCloseTo((200000 + 2400000) / 2000000, 5); // 1.3
  });
});
