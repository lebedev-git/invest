export interface DealMetrics {
  investmentSum: number;
  objectPrice: number;
  totalRentalFlow: number;
  monthlyBankInterest: number;
  principalRepayment: number;
  totalOpex: number;
  taxes: number;
  noi: number;
  cashFlow: number;
  currentEquity: number;
  capRate: number;
  roe: number;
  paybackYears: number | string;
}

export function calculateDealMetrics(deal: any): DealMetrics {
  // 1. Basic Money Inputs
  const ownMoney = Number(deal.financials?.ownMoney) || 0;
  const creditMoney = Number(deal.financials?.creditMoney) || 0;
  const extraExpenses = (deal.financials?.extraExpenses || []).reduce(
    (sum: number, exp: any) => sum + (Number(exp.amount) || 0),
    0
  );

  const investmentSum = ownMoney + creditMoney + extraExpenses;
  const objectPrice = ownMoney + creditMoney;

  // 2. Share / Ownership
  let sharePercent = 100;
  const format = deal.participationFormat;
  const details = deal.participationDetails || {};

  if (format === 'fractional_ownership') {
    sharePercent = Number(details.sharePercent) || 100;
  } else if (format === 'legal_entity_share') {
    sharePercent = Number(details.companySharePercent) || 100;
  } else if (format === 'zpif_units') {
    sharePercent = Number(details.fundSharePercent) || 100;
  } else if (format === 'partner_syndicate') {
    sharePercent = Number(details.sharePercent) || 100;
  }
  const shareRatio = sharePercent / 100;

  // 3. Bank Loan / Debt split
  const currentDebtBalance = Number(deal.loan?.currentDebtBalance) || 0;
  const annualRate = Number(deal.loan?.annualRate) || 0;
  const monthlyPayment = Number(deal.loan?.monthlyPayment) || 0;
  
  const monthlyBankInterest = ((currentDebtBalance * annualRate) / 100) / 12;
  const principalRepayment = Math.max(0, monthlyPayment - monthlyBankInterest);

  // 4. Gross Rental Income and OPEX
  const totalRentalFlow = (deal.rent?.tenants || []).reduce(
    (sum: number, tenant: any) => sum + (Number(tenant.monthlyRent) || 0),
    0
  );

  const totalOpex =
    (Number(deal.expenses?.utilities) || 0) +
    (Number(deal.expenses?.operating) || 0) +
    (Number(deal.expenses?.propertyTax) || 0) +
    (Number(deal.expenses?.insurance) || 0) +
    (Number(deal.expenses?.maintenance) || 0) +
    (Number(deal.expenses?.managementCompany) || 0) +
    (Number(deal.expenses?.accounting) || 0) +
    (Number(deal.expenses?.vacancyReserve) || 0) +
    (Number(deal.expenses?.repairReserve) || 0);

  const taxModel = deal.expenses?.taxModel;
  const taxRate = Number(deal.expenses?.taxRate) || 0;

  // 5. Calculations based on deal format (Property vs Financial-only)
  const isFinancialOnly =
    format === 'zpif_units' ||
    format === 'collateral_loan' ||
    format === 'non_collateral_loan' ||
    format === 'investment_participation';

  let noi = 0;
  let taxes = 0;
  let cashFlow = 0;
  let adjustedRentalFlow = 0;
  let adjustedOpex = 0;

  if (isFinancialOnly) {
    // Financial asset calculation
    let rawMonthlyIncome = 0;
    const expectedYieldPercent = Number(deal.performance?.expectedYield) || 0;

    if (format === 'collateral_loan' || format === 'non_collateral_loan') {
      const loanRate = Number(details.annualRate) || expectedYieldPercent;
      const loanAmt = Number(details.loanAmount) || ownMoney;
      rawMonthlyIncome = (loanAmt * (loanRate / 100)) / 12;
    } else {
      // ZPIF / Investment
      rawMonthlyIncome = (ownMoney * (expectedYieldPercent / 100)) / 12;
    }

    taxes = rawMonthlyIncome * (taxRate / 100);
    noi = rawMonthlyIncome - taxes;
    cashFlow = noi - monthlyPayment; // monthlyPayment is credit cost if they leveraged to buy the loan/asset
  } else {
    // Real estate / Property asset calculation
    adjustedRentalFlow = totalRentalFlow * shareRatio;
    adjustedOpex = totalOpex * shareRatio;

    if (taxModel === 'usn_income' || taxModel === 'ndfl') {
      taxes = adjustedRentalFlow * (taxRate / 100);
    } else if (taxModel === 'usn_income_expenses') {
      const classicTax = (adjustedRentalFlow - adjustedOpex - monthlyBankInterest) * (taxRate / 100);
      const minTax = adjustedRentalFlow * 0.01;
      taxes = Math.max(classicTax, minTax);
    }

    noi = adjustedRentalFlow - adjustedOpex - taxes;
    cashFlow = noi - monthlyPayment;
  }

  // 6. Current Equity
  let currentEquity = 0;
  const currentMarketValue = Number(deal.performance?.currentMarketValue) || 0;

  if (format === 'zpif_units') {
    const unitCount = Number(details.unitCount) || 0;
    const unitPrice = Number(details.unitPrice) || 0;
    currentEquity = unitCount * unitPrice || ownMoney;
  } else if (format === 'collateral_loan' || format === 'non_collateral_loan') {
    currentEquity = Number(details.loanAmount) || ownMoney;
  } else if (format === 'investment_participation') {
    currentEquity = ownMoney;
  } else {
    // Property asset equity
    currentEquity = currentMarketValue * shareRatio - currentDebtBalance;
  }

  // 7. Cap Rate and ROE
  const capRate = objectPrice > 0 ? (noi * 12) / objectPrice * 100 : 0;

  const equityIn = ownMoney + extraExpenses;
  const roe = equityIn > 0 ? ((cashFlow * 12) + (principalRepayment * 12)) / equityIn * 100 : 0;

  // 8. Payback Years
  let paybackYears: number | string = '—';
  if (cashFlow > 0 && equityIn > 0) {
    paybackYears = equityIn / (cashFlow * 12);
  } else if (cashFlow <= 0) {
    paybackYears = '—'; // dashboard will display negative/zero payback years as "-" or "Требует дотаций"
  }

  return {
    investmentSum,
    objectPrice,
    totalRentalFlow,
    monthlyBankInterest,
    principalRepayment,
    totalOpex,
    taxes,
    noi,
    cashFlow,
    currentEquity,
    capRate,
    roe,
    paybackYears
  };
}
