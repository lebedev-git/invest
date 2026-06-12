import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateDealMetrics, DealMetrics } from '../utils/mathCore';

export type DealStatus = 'Сбор' | 'Сделка' | 'Регистрация' | 'Стройка' | 'Ремонт' | 'Поиск арендатора' | 'Аренда' | 'Продажа' | 'Закрыта' | 'Рассматривается';

export interface StatusHistoryItem {
  id: string;
  status: string;
  date: string;
  comment?: string;
}

export interface DealInvestor {
  id: string;
  name: string;
  amount: number;
}

export interface Deal {
  id: string;
  name: string;
  type: string;
  city: string;
  address?: string;
  buildingType?: string;
  floorCount?: string;
  ceilingHeight?: number | string;
  cadastralNumber?: string;
  purchasePrice?: number;
  areaSqm?: number;
  rentRatePerSqm?: number;
  propertyTaxAnnual?: number;
  investors?: DealInvestor[];
  targetIrr: string;
  termDate: string;
  gracePeriod?: string;
  utilities?: number | string;
  status: DealStatus | string;
  invested?: number; 
  share?: number;
  paidOut?: number;
  description?: string;
  strategy?: string;
  statusHistory?: StatusHistoryItem[];

  // Overhauled parameters
  metrics?: DealMetrics;
  additional?: {
    floor?: string;
    separateEntrance?: boolean;
    showcases?: boolean;
    wetPoints?: number;
    electricalPower?: number;
    parking?: string;
  };
  participationFormat?: string;
  participationDetails?: any;
  financials?: {
    currency?: string;
    purchaseDate?: string;
    ownMoney?: number;
    creditMoney?: number;
    extraExpenses?: Array<{ id: string; category: string; amount: number }>;
  };
  loan?: {
    downPayment?: number;
    annualRate?: number;
    termMonths?: number;
    monthlyPayment?: number;
    paymentType?: string;
    currentDebtBalance?: number;
    startDate?: string;
  };
  rent?: {
    tenants?: Array<{
      id: string;
      name: string;
      areaSqm: number;
      monthlyRent: number;
      ratePerSqm?: number;
      startDate?: string;
      endDate?: string;
      indexationPercent?: number;
      securityDeposit?: number;
      paysUtilities?: string;
      rentHolidays?: boolean;
      vacateRisk?: string;
    }>;
  };
  expenses?: {
    utilities?: number;
    operating?: number;
    propertyTax?: number;
    insurance?: number;
    maintenance?: number;
    managementCompany?: number;
    accounting?: number;
    vacancyReserve?: number;
    repairReserve?: number;
    taxModel?: string;
    taxRate?: number;
  };
  comments?: {
    documents?: Array<{ id: string; name: string; tag: string }>;
    investorComment?: string;
    internalNote?: string;
  };
}

export function recalculateDeal(deal: Deal): Deal {
  const calculated = calculateDealMetrics(deal);
  
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

  return {
    ...deal,
    metrics: calculated,
    invested: calculated.investmentSum,
    purchasePrice: calculated.objectPrice,
    share: sharePercent / 100,
    areaSqm: Number(deal.areaSqm) || (deal.rent?.tenants || []).reduce((sum, t) => sum + (Number(t.areaSqm) || 0), 0)
  };
}

const INITIAL_DEALS: Deal[] = [
  { id: '1', name: 'Street Retail «Октябрь»', type: 'Стрит-ритейл', city: 'Москва', targetIrr: '12.5', termDate: '2025-12-01', gracePeriod: '2025-01-01', utilities: 0, status: 'Аренда', invested: 5000000, share: 0.15, statusHistory: [{ id: '1-status-1', status: 'Аренда', date: '2026-01-15T10:00:00.000Z', comment: 'Объект переведен в арендный этап.' }] },
  { id: '2', name: 'Self Storage «Восток»', type: 'Склад', city: 'Казань', targetIrr: '24.0', termDate: '2026-06-01', gracePeriod: '', utilities: 0, status: 'Стройка', invested: 4200000, share: 0.08, statusHistory: [{ id: '2-status-1', status: 'Стройка', date: '2026-02-10T10:00:00.000Z', comment: 'Проект находится на строительном этапе.' }] },
  { id: '3', name: 'Редевелопмент Loft Yard', type: 'Редевелопмент', city: 'СПБ', targetIrr: '0', termDate: '2025-12-31', gracePeriod: '', utilities: 0, status: 'Ремонт', invested: 3250000, share: 0.12, statusHistory: [{ id: '3-status-1', status: 'Ремонт', date: '2026-02-20T10:00:00.000Z', comment: 'Запущены ремонтные работы.' }] },
  { id: '4', name: 'ГАБ «Пятерочка»', type: 'ГАБ', city: 'Екатеринбург', targetIrr: '10.8', termDate: '2027-11-15', gracePeriod: '', utilities: 0, status: 'Аренда', invested: 7000000, share: 0.05, statusHistory: [{ id: '4-status-1', status: 'Аренда', date: '2026-03-01T10:00:00.000Z', comment: 'Объект работает в арендном режиме.' }] },
];

function ensureStatusHistory(deal: Deal): Deal {
  if (deal.statusHistory && deal.statusHistory.length > 0) return deal;
  return {
    ...deal,
    statusHistory: [{
      id: `${deal.id}-status-initial`,
      status: String(deal.status || 'Сбор заявок'),
      date: new Date().toISOString(),
      comment: 'Начальный статус зафиксирован автоматически.',
    }],
  };
}

interface DealContextType {
  deals: Deal[];
  saveDeal: (deal: Deal) => void;
  deleteDeal: (id: string) => void;
}

const DealContext = createContext<DealContextType | undefined>(undefined);
const DEALS_STORAGE_KEY = 'x7_deals';
const DEALS_BACKUP_STORAGE_KEY = 'x7_deals_backup';

function readStoredDeals() {
  for (const key of [DEALS_STORAGE_KEY, DEALS_BACKUP_STORAGE_KEY]) {
    const saved = localStorage.getItem(key);
    if (!saved) continue;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.map(ensureStatusHistory);
    } catch (e) {
      // Try the backup key before falling back to demo data.
    }
  }
  return null;
}

export function DealProvider({ children }: { children: React.ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>(() => {
    let storedDeals = readStoredDeals();
    if (!storedDeals) {
      storedDeals = INITIAL_DEALS.map(ensureStatusHistory);
    }

    // Run monthly cron simulation to update debt balance
    try {
      const lastCheckStr = localStorage.getItem('x7_last_cron_check');
      const today = new Date();
      
      if (!lastCheckStr) {
        localStorage.setItem('x7_last_cron_check', today.toISOString());
      } else {
        const lastCheck = new Date(lastCheckStr);
        let checkDate = new Date(lastCheck.getFullYear(), lastCheck.getMonth() + 1, 1);
        let ranSimulation = false;
        
        while (checkDate <= today) {
          ranSimulation = true;
          storedDeals = storedDeals.map(deal => {
            if (deal.financials?.creditMoney && deal.loan?.currentDebtBalance && deal.loan?.annualRate && deal.loan?.monthlyPayment) {
              const debt = Number(deal.loan.currentDebtBalance) || 0;
              const rate = Number(deal.loan.annualRate) || 0;
              const payment = Number(deal.loan.monthlyPayment) || 0;
              
              const monthlyInterest = (debt * rate / 100) / 12;
              const principalRepay = Math.max(0, payment - monthlyInterest);
              const nextDebt = Math.max(0, debt - principalRepay);
              
              return {
                ...deal,
                loan: {
                  ...deal.loan,
                  currentDebtBalance: nextDebt
                }
              };
            }
            return deal;
          });
          
          checkDate.setMonth(checkDate.getMonth() + 1);
        }
        
        if (ranSimulation) {
          storedDeals = storedDeals.map(recalculateDeal);
          localStorage.setItem('x7_last_cron_check', today.toISOString());
        }
      }
    } catch (e) {
      console.error('Failed to run debt simulation', e);
    }
    
    return storedDeals;
  });

  useEffect(() => {
    const serialized = JSON.stringify(deals);
    localStorage.setItem(DEALS_STORAGE_KEY, serialized);
    localStorage.setItem(DEALS_BACKUP_STORAGE_KEY, serialized);
  }, [deals]);

  const saveDeal = (deal: Deal) => {
    const recalculated = recalculateDeal(deal);
    setDeals(prev => {
      const exists = prev.find(d => d.id === recalculated.id);
      if (exists) {
        return prev.map(d => {
          if (d.id !== recalculated.id) return d;
          const previous = ensureStatusHistory(d);
          const next = ensureStatusHistory(recalculated);
          if (String(previous.status) === String(next.status)) return { ...next, statusHistory: previous.statusHistory };
          return {
            ...next,
            statusHistory: [
              ...(previous.statusHistory || []),
              {
                id: `${recalculated.id}-status-${Date.now()}`,
                status: String(next.status),
                date: new Date().toISOString(),
                comment: `Статус изменен с "${previous.status}" на "${next.status}".`,
              },
            ],
          };
        });
      }
      return [ensureStatusHistory(recalculated), ...prev];
    });
  };

  const deleteDeal = (id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id));
  };

  return (
    <DealContext.Provider value={{ deals, saveDeal, deleteDeal }}>
      {children}
    </DealContext.Provider>
  );
}

export function useDeals() {
  const context = useContext(DealContext);
  if (!context) throw new Error('useDeals must be used within DealProvider');
  return context;
}

