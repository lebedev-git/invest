// Единый слой финансовых хелперов по сделке.
// Канон — metrics-aware версии: если у сделки есть пересчитанный снапшот
// `deal.metrics` (его пишет DealContext.saveDeal через calculateDealMetrics),
// берём значения из него; иначе — деградация к «сырым» полям формы.
import { Deal } from '../context/DealContext';

export const parsePercent = (value?: string): number => {
  const parsed = Number(String(value ?? '0').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const parseMoney = (value?: number | string): number => {
  const parsed = Number(String(value ?? '0').replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getInvestorsTotal = (deal: Deal): number =>
  (deal.investors || []).reduce((sum, investor) => sum + parseMoney(investor.amount), 0);

export const getDealCapital = (deal: Deal): number => {
  if (deal.metrics) return deal.metrics.investmentSum;
  return parseMoney(deal.purchasePrice) || getInvestorsTotal(deal) || parseMoney(deal.invested);
};

export const getAnnualRent = (deal: Deal): number =>
  parseMoney(deal.areaSqm) * parseMoney(deal.rentRatePerSqm) * 12;

export const hasRentModel = (deal: Deal): boolean =>
  parseMoney(deal.areaSqm) > 0 && parseMoney(deal.rentRatePerSqm) > 0;

export const getNetAnnualFlow = (deal: Deal): number => {
  if (deal.metrics) return deal.metrics.cashFlow * 12;
  if (hasRentModel(deal)) return getAnnualRent(deal) - parseMoney(deal.propertyTaxAnnual);
  return (parseMoney(deal.invested) || getDealCapital(deal)) * (parsePercent(deal.targetIrr) / 100)
    - parseMoney(deal.utilities) * 12;
};

// Возвращает срок окупаемости в годах либо null, если сделка не окупается
// (отрицательный/нулевой денежный поток). Раньше здесь молча возвращался 0,
// из-за чего убыточная сделка выглядела как «окупаемость 0 лет».
export const getPaybackYears = (deal: Deal): number | null => {
  if (deal.metrics) {
    return typeof deal.metrics.paybackYears === 'number' ? deal.metrics.paybackYears : null;
  }
  const capital = getDealCapital(deal);
  const annualFlow = getNetAnnualFlow(deal);
  return capital > 0 && annualFlow > 0 ? capital / annualFlow : null;
};
