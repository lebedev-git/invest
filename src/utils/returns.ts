// Честная доходность инвестора: XIRR, MOIC/TVPI, DPI.
// Считаем «на собственные средства» (equity basis): на входе — деньги владельца
// (own money + расходы на сделку), распределения — фактические выплаты по датам,
// терминальная стоимость — текущая стоимость доли (net долга). Банковский кредит
// в поток не входит (это не деньги владельца).
import { Deal } from '../context/DealContext';
import type { Payout } from '../context/DealContext';
import { getDealCapital, parseMoney } from './dealMetrics';

export interface CashFlow {
  date: Date;
  amount: number; // отрицательное — отток (взнос), положительное — приток (выплата/NAV)
}

export interface ReturnsResult {
  equityInvested: number;
  distributed: number;
  currentValue: number;
  dpi: number | null; // distributed / equityInvested
  moic: number | null; // (distributed + currentValue) / equityInvested
  xirr: number | null; // годовая ставка (доля, напр. 0.123 = 12.3%)
}

// Деньги, реально вложенные владельцем (equity), без банковского кредита.
export const getEquityInvested = (deal: Deal): number => {
  const own = parseMoney(deal.financials?.ownMoney);
  const extra = (deal.financials?.extraExpenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const equity = own + extra;
  return equity > 0 ? equity : getDealCapital(deal);
};

// Текущая стоимость доли владельца. Если оценка не задана — актив «по себестоимости»
// (нереализованный доход = 0), чтобы MOIC не занижался до нуля.
export const getCurrentValue = (deal: Deal, equityInvested: number): number => {
  const marketValue = Number(deal.performance?.currentMarketValue) || 0;
  if (marketValue <= 0) return equityInvested;
  if (deal.metrics) return Number(deal.metrics.currentEquity) || 0;
  const share = typeof deal.share === 'number' ? deal.share : 1;
  return marketValue * share;
};

// Дата входа в сделку: дата покупки → первая запись истории статусов → null.
const getEntryDate = (deal: Deal): Date | null => {
  const raw = deal.financials?.purchaseDate || deal.statusHistory?.[0]?.date || '';
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

// XIRR: ставка r, при которой NPV потоков = 0. Newton-Raphson с откатом на бисекцию.
// Возвращает годовую ставку (доля) либо null, если решения нет/не сошлось.
export const xirr = (flows: CashFlow[], guess = 0.1): number | null => {
  if (flows.length < 2) return null;
  const amounts = flows.map(f => f.amount);
  if (!amounts.some(a => a > 0) || !amounts.some(a => a < 0)) return null;

  const t0 = Math.min(...flows.map(f => f.date.getTime()));
  const MS_PER_YEAR = 365 * 24 * 3600 * 1000;
  const years = flows.map(f => (f.date.getTime() - t0) / MS_PER_YEAR);

  const npv = (r: number) => amounts.reduce((s, a, i) => s + a / Math.pow(1 + r, years[i]), 0);
  const dnpv = (r: number) => amounts.reduce((s, a, i) => s - (years[i] * a) / Math.pow(1 + r, years[i] + 1), 0);

  // Newton-Raphson
  let r = guess;
  for (let i = 0; i < 50; i++) {
    const f = npv(r);
    const d = dnpv(r);
    if (!Number.isFinite(f) || !Number.isFinite(d) || d === 0) break;
    const next = r - f / d;
    if (!Number.isFinite(next) || next <= -0.9999) break;
    if (Math.abs(next - r) < 1e-7) return next;
    r = next;
  }

  // Откат: бисекция на [-0.9999, 10]
  let lo = -0.9999;
  let hi = 10;
  let flo = npv(lo);
  let fhi = npv(hi);
  if (!Number.isFinite(flo) || !Number.isFinite(fhi) || flo * fhi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fmid = npv(mid);
    if (Math.abs(fmid) < 1e-7 || hi - lo < 1e-9) return mid;
    if (flo * fmid < 0) {
      hi = mid;
      fhi = fmid;
    } else {
      lo = mid;
      flo = fmid;
    }
  }
  return (lo + hi) / 2;
};

// Показатели возврата по одной сделке. now передаётся явно (тестируемость/детерминизм).
export const computeDealReturns = (deal: Deal, dealPayouts: Payout[], now: Date = new Date()): ReturnsResult => {
  const equityInvested = getEquityInvested(deal);
  const distributed = dealPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const currentValue = getCurrentValue(deal, equityInvested);

  const dpi = equityInvested > 0 ? distributed / equityInvested : null;
  const moic = equityInvested > 0 ? (distributed + currentValue) / equityInvested : null;

  const entryDate = getEntryDate(deal);
  let xirrValue: number | null = null;
  if (entryDate && equityInvested > 0) {
    const flows: CashFlow[] = [{ date: entryDate, amount: -equityInvested }];
    for (const p of dealPayouts) {
      const d = new Date(p.date);
      if (!Number.isNaN(d.getTime())) flows.push({ date: d, amount: Number(p.amount) || 0 });
    }
    flows.push({ date: now, amount: currentValue });
    xirrValue = xirr(flows);
  }

  return { equityInvested, distributed, currentValue, dpi, moic, xirr: xirrValue };
};

// Портфельные показатели: единый поток по всем сделкам для XIRR; MOIC/DPI — суммами.
export const computePortfolioReturns = (deals: Deal[], payouts: Payout[], now: Date = new Date()): ReturnsResult => {
  const byDeal: Record<string, Payout[]> = {};
  for (const p of payouts) (byDeal[p.deal] ||= []).push(p);

  let equityInvested = 0;
  let distributed = 0;
  let currentValue = 0;
  const flows: CashFlow[] = [];

  for (const deal of deals) {
    const eq = getEquityInvested(deal);
    if (eq <= 0) continue;
    const dealPayouts = byDeal[deal.id] || [];
    const cv = getCurrentValue(deal, eq);

    equityInvested += eq;
    distributed += dealPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    currentValue += cv;

    const entryDate = getEntryDate(deal);
    if (entryDate) {
      flows.push({ date: entryDate, amount: -eq });
      for (const p of dealPayouts) {
        const d = new Date(p.date);
        if (!Number.isNaN(d.getTime())) flows.push({ date: d, amount: Number(p.amount) || 0 });
      }
      flows.push({ date: now, amount: cv });
    }
  }

  const dpi = equityInvested > 0 ? distributed / equityInvested : null;
  const moic = equityInvested > 0 ? (distributed + currentValue) / equityInvested : null;
  const xirrValue = flows.length >= 2 ? xirr(flows) : null;

  return { equityInvested, distributed, currentValue, dpi, moic, xirr: xirrValue };
};
