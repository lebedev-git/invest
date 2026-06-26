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

export type PayoutKind = 'dividend' | 'return' | 'other';

export interface Payout {
  id: string;
  deal: string;
  date: string;
  amount: number;
  kind: PayoutKind;
  comment?: string;
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

  // Файлы PocketBase (имена файлов в одноимённых полях коллекции deals).
  images?: string[];
  documents?: string[];

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
    // Файловые поля берём из колонок записи (массивы имён файлов).
    images: Array.isArray(rec.images) ? rec.images : [],
    documents: Array.isArray(rec.documents) ? rec.documents : [],
  } as Deal;
}

// Объект Deal → тело записи PocketBase (зеркалим ключевые поля в колонки + весь объект в data).
function dealToBody(deal: Deal) {
  // images/documents — это файловые колонки PocketBase, ими управляют отдельные
  // FormData-вызовы (uploadDealFiles/removeDealFile), поэтому в JSON-данные их не кладём.
  const { id, statusHistory, images, documents, ...rest } = deal;
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
  // Выплаты по сделкам.
  payouts: Payout[];
  addPayout: (payout: Omit<Payout, 'id'>) => Promise<void>;
  deletePayout: (id: string) => Promise<void>;
  // Файлы сделки (изображения/документы).
  uploadDealFiles: (dealId: string, field: 'images' | 'documents', files: File[]) => Promise<void>;
  removeDealFile: (dealId: string, field: 'images' | 'documents', filename: string) => Promise<void>;
  // URL файла с file-токеном (доступ к owner-scoped файлам).
  fileUrl: (dealId: string, filename: string, thumb?: string) => string;
}

const DealContext = createContext<DealContextType | undefined>(undefined);

export function DealProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileToken, setFileToken] = useState('');

  const loadDeals = useCallback(async () => {
    if (!pb.authStore.isValid) {
      setDeals([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // file-токен нужен для доступа к owner-scoped файлам сделок (картинки/документы).
      pb.files.getToken().then(setFileToken).catch(() => setFileToken(''));

      const [dealRecs, historyRecs, payoutRecs] = await Promise.all([
        pb.collection('deals').getFullList({ sort: '-created' }),
        pb.collection('status_history').getFullList({ sort: 'created' }),
        pb.collection('payouts').getFullList({ sort: '-date' }),
      ]);

      const byDeal: Record<string, StatusHistoryItem[]> = {};
      for (const h of historyRecs as any[]) {
        (byDeal[h.deal] ||= []).push({ id: h.id, status: h.status, date: h.created, comment: h.comment });
      }

      // Сумма фактических выплат по каждой сделке → реальный paidOut.
      const paidByDeal: Record<string, number> = {};
      const payoutList: Payout[] = (payoutRecs as any[]).map(p => {
        paidByDeal[p.deal] = (paidByDeal[p.deal] || 0) + (Number(p.amount) || 0);
        return { id: p.id, deal: p.deal, date: p.date, amount: Number(p.amount) || 0, kind: p.kind || 'other', comment: p.comment };
      });
      setPayouts(payoutList);

      setDeals((dealRecs as any[]).map(rec => {
        const deal = recordToDeal(rec);
        deal.statusHistory = byDeal[rec.id] || [];
        // paidOut — сумма реальных выплат (с откатом на легаси-поле в data).
        deal.paidOut = paidByDeal[rec.id] ?? deal.paidOut ?? 0;
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

  // Загрузка файлов: добавляем к множественному файловому полю (синтаксис "field+").
  const uploadDealFiles = useCallback(async (dealId: string, field: 'images' | 'documents', files: File[]) => {
    if (!files.length) return;
    const fd = new FormData();
    files.forEach(file => fd.append(`${field}+`, file));
    try {
      await pb.collection('deals').update(dealId, fd);
      await loadDeals();
    } catch (e) {
      console.error('Не удалось загрузить файлы', e);
      throw e;
    }
  }, [loadDeals]);

  // Удаление конкретного файла из множественного поля (синтаксис "field-").
  const removeDealFile = useCallback(async (dealId: string, field: 'images' | 'documents', filename: string) => {
    try {
      await pb.collection('deals').update(dealId, { [`${field}-`]: [filename] });
      await loadDeals();
    } catch (e) {
      console.error('Не удалось удалить файл', e);
      throw e;
    }
  }, [loadDeals]);

  const addPayout = useCallback(async (payout: Omit<Payout, 'id'>) => {
    try {
      await pb.collection('payouts').create({ ...payout, created_by: pb.authStore.record?.id });
      await loadDeals();
    } catch (e) {
      console.error('Не удалось добавить выплату', e);
      throw e;
    }
  }, [loadDeals]);

  const deletePayout = useCallback(async (id: string) => {
    try {
      await pb.collection('payouts').delete(id);
      await loadDeals();
    } catch (e) {
      console.error('Не удалось удалить выплату', e);
      throw e;
    }
  }, [loadDeals]);

  // URL файла сделки с file-токеном и (опц.) превью-размером.
  const fileUrl = useCallback((dealId: string, filename: string, thumb?: string) => {
    const base = pb.baseURL.endsWith('/') ? pb.baseURL.slice(0, -1) : pb.baseURL;
    const params = new URLSearchParams();
    if (fileToken) params.set('token', fileToken);
    if (thumb) params.set('thumb', thumb);
    const qs = params.toString();
    return `${base}/api/files/deals/${dealId}/${filename}${qs ? `?${qs}` : ''}`;
  }, [fileToken]);

  return (
    <DealContext.Provider value={{ deals, loading, error, saveDeal, deleteDeal, reload: loadDeals, uploadDealFiles, removeDealFile, fileUrl, payouts, addPayout, deletePayout }}>
      {children}
    </DealContext.Provider>
  );
}

export function useDeals() {
  const context = useContext(DealContext);
  if (!context) throw new Error('useDeals must be used within DealProvider');
  return context;
}
