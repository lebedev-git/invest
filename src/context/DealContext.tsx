import React, { createContext, useContext, useState, useEffect } from 'react';

export type DealStatus = 'Сбор' | 'Сделка' | 'Регистрация' | 'Стройка' | 'Ремонт' | 'Поиск арендатора' | 'Аренда' | 'Продажа' | 'Закрыта' | 'Рассматривается';

export interface StatusHistoryItem {
  id: string;
  status: string;
  date: string;
  comment?: string;
}

export interface Deal {
  id: string;
  name: string;
  type: string;
  city: string;
  targetIrr: string;
  termDate: string; // Changed from termMonths
  gracePeriod?: string; // New: Каникулы
  utilities?: number | string; // Коммуналка в рублях в месяц
  status: DealStatus | string;
  invested?: number; 
  share?: number;
  paidOut?: number;
  description?: string;
  strategy?: string;
  statusHistory?: StatusHistoryItem[];
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

export function DealProvider({ children }: { children: React.ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>(() => {
    const saved = localStorage.getItem('x7_deals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(ensureStatusHistory);
        return INITIAL_DEALS;
      } catch (e) {
        return INITIAL_DEALS;
      }
    }
    return INITIAL_DEALS.map(ensureStatusHistory);
  });

  useEffect(() => {
    localStorage.setItem('x7_deals', JSON.stringify(deals));
  }, [deals]);

  const saveDeal = (deal: Deal) => {
    setDeals(prev => {
      const exists = prev.find(d => d.id === deal.id);
      if (exists) {
        return prev.map(d => {
          if (d.id !== deal.id) return d;
          const previous = ensureStatusHistory(d);
          const next = ensureStatusHistory(deal);
          if (String(previous.status) === String(next.status)) return { ...next, statusHistory: previous.statusHistory };
          return {
            ...next,
            statusHistory: [
              ...(previous.statusHistory || []),
              {
                id: `${deal.id}-status-${Date.now()}`,
                status: String(next.status),
                date: new Date().toISOString(),
                comment: `Статус изменен с "${previous.status}" на "${next.status}".`,
              },
            ],
          };
        });
      }
      return [ensureStatusHistory(deal), ...prev];
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
