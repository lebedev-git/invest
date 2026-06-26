import { describe, it, expect } from 'vitest';
import { calculateDealMetrics } from './mathCore';

// Тесты проверяют РУЧНО просчитанные эталонные значения, а не фиксируют
// текущее поведение. Каждый кейс снабжён выкладкой в комментарии.

describe('calculateDealMetrics — недвижимость (property)', () => {
  it('УСН-доходы 6%, 100% доля, с кредитом — эталонный расчёт', () => {
    const deal = {
      participationFormat: 'full_ownership',
      financials: { ownMoney: 3_000_000, creditMoney: 0 },
      loan: { currentDebtBalance: 5_000_000, annualRate: 12, monthlyPayment: 70_000 },
      rent: { tenants: [{ monthlyRent: 100_000 }, { monthlyRent: 50_000 }] },
      expenses: { utilities: 20_000, taxModel: 'usn_income', taxRate: 6 },
    };
    const m = calculateDealMetrics(deal);

    // %/мес = 5 000 000 * 12% / 12 = 50 000; тело = 70 000 − 50 000 = 20 000
    expect(m.monthlyBankInterest).toBe(50_000);
    expect(m.principalRepayment).toBe(20_000);
    // аренда 150 000; налог 6% от 150 000 = 9 000
    expect(m.totalRentalFlow).toBe(150_000);
    expect(m.taxes).toBe(9_000);
    // noi = 150 000 − 20 000 (opex) − 9 000 (tax) = 121 000
    expect(m.noi).toBe(121_000);
    // cashFlow = 121 000 − 70 000 (платёж) = 51 000
    expect(m.cashFlow).toBe(51_000);
    // roe = 51 000 * 12 / 3 000 000 * 100 = 20.4%
    expect(m.roe).toBeCloseTo(20.4, 5);
    // payback = 3 000 000 / (51 000 * 12) = 4.902 лет
    expect(m.paybackYears).toBeCloseTo(4.90196, 4);
    // dscr = noi / платёж = 121 000 / 70 000 = 1.7286
    expect(m.dscr).toBeCloseTo(1.72857, 4);
  });

  it('долевое владение 50% — поток делится на долю', () => {
    const deal = {
      participationFormat: 'fractional_ownership',
      participationDetails: { sharePercent: 50 },
      financials: { ownMoney: 1_000_000, propertyPrice: 10_000_000 },
      rent: { tenants: [{ monthlyRent: 100_000 }] },
      expenses: { utilities: 20_000, taxModel: 'usn_income', taxRate: 6 },
    };
    const m = calculateDealMetrics(deal);

    // объект: налог 6% от 100 000 = 6 000; wholeNoi = 100 000 − 20 000 − 6 000 = 74 000
    // доля 50%: noi = 37 000, налог = 3 000
    expect(m.noi).toBe(37_000);
    expect(m.taxes).toBe(3_000);
    // нет кредита → cashFlow = wholeNoi * 0.5 = 37 000
    expect(m.cashFlow).toBe(37_000);
    // objectPrice берётся из propertyPrice для долевого
    expect(m.objectPrice).toBe(10_000_000);
  });

  it('УСН доходы-расходы: применяется минимальный налог 1% от выручки', () => {
    // Большой OPEX делает классический налог отрицательным → берётся min 1% от аренды
    const deal = {
      participationFormat: 'full_ownership',
      financials: { ownMoney: 1_000_000 },
      rent: { tenants: [{ monthlyRent: 100_000 }] },
      expenses: { operating: 95_000, taxModel: 'usn_income_expenses', taxRate: 15 },
    };
    const m = calculateDealMetrics(deal);

    // classic = (100 000 − 95 000) * 15% = 750; min = 100 000 * 1% = 1 000 → 1 000
    expect(m.taxes).toBe(1_000);
    // noi = 100 000 − 95 000 − 1 000 = 4 000
    expect(m.noi).toBe(4_000);
  });

  it('убыточная сделка — paybackYears = "—"', () => {
    const deal = {
      participationFormat: 'full_ownership',
      financials: { ownMoney: 1_000_000 },
      rent: { tenants: [{ monthlyRent: 10_000 }] },
      expenses: { utilities: 50_000, taxModel: 'usn_income', taxRate: 6 },
    };
    const m = calculateDealMetrics(deal);

    expect(m.cashFlow).toBeLessThan(0);
    expect(m.paybackYears).toBe('—');
  });
});

describe('calculateDealMetrics — финансовые форматы (financial-only)', () => {
  it('займ под залог: доход = сумма займа * ставка / 12', () => {
    const deal = {
      participationFormat: 'collateral_loan',
      participationDetails: { loanAmount: 2_000_000, annualRate: 24 },
      financials: { ownMoney: 2_000_000 },
      expenses: { taxRate: 0 },
    };
    const m = calculateDealMetrics(deal);

    // доход/мес = 2 000 000 * 24% / 12 = 40 000; налога нет
    expect(m.noi).toBe(40_000);
    expect(m.cashFlow).toBe(40_000);
    expect(m.currentEquity).toBe(2_000_000);
  });

  it('ЗПИФ: доход от ожидаемой доходности на собственные деньги', () => {
    const deal = {
      participationFormat: 'zpif_units',
      participationDetails: { unitCount: 100, unitPrice: 10_000 },
      financials: { ownMoney: 1_000_000 },
      performance: { expectedYield: 12 },
      expenses: { taxRate: 0 },
    };
    const m = calculateDealMetrics(deal);

    // доход/мес = 1 000 000 * 12% / 12 = 10 000
    expect(m.noi).toBe(10_000);
    // equity = unitCount * unitPrice = 100 * 10 000 = 1 000 000
    expect(m.currentEquity).toBe(1_000_000);
  });
});

describe('calculateDealMetrics — граничные случаи', () => {
  it('пустая сделка не падает и даёт нули', () => {
    const m = calculateDealMetrics({});
    expect(m.investmentSum).toBe(0);
    expect(m.noi).toBe(0);
    expect(m.cashFlow).toBe(0);
    expect(m.roe).toBe(0);
    expect(m.capRate).toBe(0);
    expect(m.dscr).toBe(0);
    expect(m.paybackYears).toBe('—');
  });

  it('investmentSum суммирует свои + кредит + доп.расходы', () => {
    const m = calculateDealMetrics({
      financials: {
        ownMoney: 1_000_000,
        creditMoney: 500_000,
        extraExpenses: [{ amount: 100_000 }, { amount: 50_000 }],
      },
    });
    expect(m.investmentSum).toBe(1_650_000);
  });

  it('нулевой собственный капитал → roe = 0 без деления на ноль', () => {
    const m = calculateDealMetrics({
      participationFormat: 'full_ownership',
      financials: { ownMoney: 0 },
      rent: { tenants: [{ monthlyRent: 50_000 }] },
    });
    expect(Number.isFinite(m.roe)).toBe(true);
    expect(m.roe).toBe(0);
  });
});
