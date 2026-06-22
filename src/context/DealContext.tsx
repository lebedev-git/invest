import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { calculateDealMetrics, DealMetrics } from '../utils/mathCore';
import { pb } from '../lib/pb';
import { useAuth } from './AuthContext';

// Полный жизненный цикл статуса сделки — единый источник истины.
// Карты STATUS_COLORS/STAGE_ORDER в utils/dealDisplay типизированы как
// Record<DealStatus, …>, поэтому добавление статуса сюда без записи в картах
// сразу ловится компилятором.
export const DEAL_STATUSES = [
  'Рассматривается',
  'Сбор заявок',
  'Сбор',
  'Сделка',
  'Куплен',
  'Регистрация',
  'Стройка',
  'Ремонт',
  'Поиск арендатора',
  'Аренда',
  'В управлении',
  'Продажа',
  'Закрыта',
  'Завершен',
] as const;

// Поле deals.status в PocketBase — свободный text, поэтому на границе данных
// допускаем | string (значение из БД может не входить в каноничный список).
export type DealStatus = typeof DEAL_STATUSES[number];

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
    propertyPrice?: number;
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
  performance?: {
    currentMarketValue?: number;
    plannedTermMonths?: number;
    expectedYield?: number;
    plannedProfit?: number;
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
    areaSqm: Number(deal.areaSqm) || (deal.rent?.tenants || []).reduce((sum, t) => sum + (Number(t.areaSqm) || 0), 0),
  };
}

// --- PocketBase mapping -----------------------------------------------------

// Запись PocketBase → объект Deal (весь объект лежит в поле data, id берём из записи).
function recordToDeal(rec: any): Deal {
  const data = (rec.data || {}) as Partial<Deal>;
  return {
    ...data,
    id: rec.id,
    name: rec.name ?? data.name ?? '',
    type: rec.type ?? data.type ?? '',
    city: rec.city ?? data.city ?? '',
    status: (rec.status ?? data.status ?? '') as Deal['status'],
    targetIrr: (data.targetIrr ?? rec.target_irr ?? '0') as string,
    termDate: (data.termDate ?? rec.term_date ?? '') as string,
    statusHistory: [],
  } as Deal;
}

// Объект Deal → тело записи PocketBase (зеркалим ключевые поля в колонки + весь объект в data).
function dealToBody(deal: Deal) {
  const { id, statusHistory, ...rest } = deal;
  return {
    name: deal.name || 'Без названия',
    type: deal.type || '',
    city: deal.city || '',
    status: String(deal.status || ''),
    target_irr: String(deal.targetIrr ?? ''),
    term_date: deal.termDate || '',
    data: rest,
  };
}

interface DealContextType {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  saveDeal: (deal: Deal) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const DealContext = createContext<DealContextType | undefined>(undefined);

export function DealProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDeals = useCallback(async () => {
    if (!pb.authStore.isValid) {
      setDeals([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [dealRecs, historyRecs] = await Promise.all([
        pb.collection('deals').getFullList({ sort: '-created' }),
        pb.collection('status_history').getFullList({ sort: 'created' }),
      ]);

      const byDeal: Record<string, StatusHistoryItem[]> = {};
      for (const h of historyRecs as any[]) {
        (byDeal[h.deal] ||= []).push({ id: h.id, status: h.status, date: h.created, comment: h.comment });
      }

      setDeals((dealRecs as any[]).map(rec => {
        const deal = recordToDeal(rec);
        deal.statusHistory = byDeal[rec.id] || [];
        return deal;
      }));
    } catch (e: any) {
      // Техническая причина — в консоль; пользователю показываем русское сообщение.
      console.error('Не удалось загрузить сделки', e);
      setDeals([]);
      setError('Не удалось загрузить данные. Проверьте соединение с сервером и повторите.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [isAuthenticated, loadDeals]);

  const saveDeal = useCallback(async (deal: Deal) => {
    const recalculated = recalculateDeal(deal);
    const body = dealToBody(recalculated);
    const existing = deals.find(d => d.id === recalculated.id);
    try {
      if (existing) {
        const saved: any = await pb.collection('deals').update(existing.id, body);
        if (String(existing.status) !== String(recalculated.status)) {
          await pb.collection('status_history').create({
            deal: saved.id,
            status: String(recalculated.status),
            comment: `Статус изменён с "${existing.status}" на "${recalculated.status}".`,
          });
        }
      } else {
        const saved: any = await pb.collection('deals').create({
          ...body,
          created_by: pb.authStore.record?.id,
        });
        await pb.collection('status_history').create({
          deal: saved.id,
          status: String(recalculated.status),
          comment: 'Начальный статус зафиксирован.',
        });
      }
      await loadDeals();
    } catch (e) {
      console.error('Не удалось сохранить сделку', e);
      throw e;
    }
  }, [deals, loadDeals]);

  const deleteDeal = useCallback(async (id: string) => {
    try {
      await pb.collection('deals').delete(id);
      await loadDeals();
    } catch (e) {
      console.error('Не удалось удалить сделку', e);
      throw e;
    }
  }, [loadDeals]);

  return (
    <DealContext.Provider value={{ deals, loading, error, saveDeal, deleteDeal, reload: loadDeals }}>
      {children}
    </DealContext.Provider>
  );
}

export function useDeals() {
  const context = useContext(DealContext);
  if (!context) throw new Error('useDeals must be used within DealProvider');
  return context;
}
