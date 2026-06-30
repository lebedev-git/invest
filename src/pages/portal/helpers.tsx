import React, { useEffect, useState } from 'react';
import { Deal } from '../../context/DealContext';
import { cleanLabel } from '../../utils/dealDisplay';
import { getDealCapital, getNetAnnualFlow } from '../../utils/dealMetrics';
import { formatRub } from '../../utils/format';

// Фотографии коммерческих объектов с Unsplash — fallback, если у сделки нет своих фото.
export const getProjectImage = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('пятерочка') || lower.includes('pyaterochka')) {
    return 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80'; // супермаркет
  }
  if (lower.includes('октябрь') || lower.includes('retail')) {
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80'; // стрит-ритейл
  }
  if (lower.includes('восток') || lower.includes('storage') || lower.includes('склад')) {
    return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80'; // склад
  }
  if (lower.includes('loft') || lower.includes('yard') || lower.includes('редевелопмент')) {
    return 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=400&q=80'; // лофт
  }
  return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'; // дефолт
};

// Цвета бейджей статусов в соответствии с макетом
export const getStatusBadgeStyle = (status: string) => {
  const clean = cleanLabel(status);
  if (clean === 'Аренда' || clean === 'В управлении') {
    return 'text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20';
  }
  if (clean === 'Стройка') {
    return 'text-[#eab308] bg-[#eab308]/10 border border-[#eab308]/20';
  }
  if (clean === 'Ремонт') {
    return 'text-[#f97316] bg-[#f97316]/10 border border-[#f97316]/20';
  }
  return 'text-slate-400 bg-slate-500/10 border border-slate-500/20';
};

// Сплошные цвета распределения активов
export const ALLOCATION_STYLES: Record<string, string> = {
  'ГАБ': 'bg-[#00a651]',
  'Стрит-ритейл': 'bg-[#1b3abb]',
  'Склад': 'bg-[#2563eb]',
  'Редевелопмент': 'bg-[#5b21b6]',
};

export const getProgressBarColor = (progress: number) => {
  if (progress >= 80) return 'bg-[#10b981]';
  if (progress >= 40) return 'bg-[#06b6d4]';
  return 'bg-[#f97316]';
};

// Подписи типов выплат — используются и в календаре (Portal), и в реестре (PaymentsPage).
export const PAYOUT_KIND_LABEL: Record<string, string> = {
  dividend: 'Дивиденды',
  return: 'Возврат тела',
  other: 'Прочее',
};

export type CurrencyCode = 'RUB' | 'USD' | 'EUR';

export interface CurrencyRates {
  USD: number;
  EUR: number;
  updatedAt?: string;
}

const DEFAULT_RATES: CurrencyRates = { USD: 90, EUR: 98 };

export const formatCurrency = (value: number, currency: CurrencyCode, rates: CurrencyRates) => {
  if (currency === 'RUB') return formatRub(value);
  const rate = rates[currency] || DEFAULT_RATES[currency];
  const converted = rate > 0 ? value / rate : 0;
  return `${converted.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ${currency === 'USD' ? '$' : '€'}`;
};

export const useCurrencyRates = () => {
  const [currency, setCurrency] = useState<CurrencyCode>(() => (localStorage.getItem('x7_currency') as CurrencyCode) || 'RUB');
  const [rates, setRates] = useState<CurrencyRates>(() => {
    const saved = localStorage.getItem('x7_currency_rates');
    if (!saved) return DEFAULT_RATES;
    try {
      return { ...DEFAULT_RATES, ...JSON.parse(saved) };
    } catch (e) {
      return DEFAULT_RATES;
    }
  });

  useEffect(() => {
    localStorage.setItem('x7_currency', currency);
  }, [currency]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (rates.updatedAt === today) return;

    fetch('https://www.cbr-xml-daily.ru/daily_json.js')
      .then(response => response.json())
      .then(data => {
        const nextRates = {
          USD: Number(data?.Valute?.USD?.Value) || DEFAULT_RATES.USD,
          EUR: Number(data?.Valute?.EUR?.Value) || DEFAULT_RATES.EUR,
          updatedAt: today,
        };
        setRates(nextRates);
        localStorage.setItem('x7_currency_rates', JSON.stringify(nextRates));
      })
      .catch(() => {
        localStorage.setItem('x7_currency_rates', JSON.stringify(rates));
      });
  }, [rates]);

  return { currency, setCurrency, rates };
};

export type ForecastMode = 'year-end' | 'deal-end' | 'custom';

export interface ForecastConfig {
  mode: ForecastMode;
  customDate: string;
}

export const getInvestedDeals = (deals: Deal[]) => deals.filter(deal => getDealCapital(deal) > 0);

export const getToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

export const getDefaultForecastDate = () => {
  const today = getToday();
  const defaultDate = new Date(today);
  defaultDate.setMonth(defaultDate.getMonth() + 3);
  return defaultDate.toISOString().slice(0, 10);
};

const getForecastTargetDate = (config: ForecastConfig, deal?: Deal) => {
  const today = getToday();
  if (config.mode === 'deal-end' && deal?.termDate) {
    const dealEndDate = new Date(deal.termDate);
    if (!Number.isNaN(dealEndDate.getTime())) return dealEndDate;
  }

  let targetDate: Date;
  if (config.mode === 'custom' && config.customDate) {
    const customDate = new Date(config.customDate);
    targetDate = Number.isNaN(customDate.getTime()) ? new Date(today.getFullYear(), 11, 31) : customDate;
  } else {
    targetDate = new Date(today.getFullYear(), 11, 31);
  }

  if (deal?.termDate) {
    const dealEndDate = new Date(deal.termDate);
    if (!Number.isNaN(dealEndDate.getTime()) && dealEndDate < targetDate) return dealEndDate;
  }

  return targetDate;
};

const getForecastDays = (config: ForecastConfig, deal?: Deal) => {
  const today = getToday();
  const targetDate = getForecastTargetDate(config, deal);
  targetDate.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / 86400000));
};

export const getAnnualProjectedIncome = (deal: Deal) => {
  return getNetAnnualFlow(deal);
};

export const getProjectedIncome = (deal: Deal, config: ForecastConfig) => {
  const annualProjectedIncome = getAnnualProjectedIncome(deal);
  return annualProjectedIncome * (getForecastDays(config, deal) / 365);
};

export const getForecastLabel = (config: ForecastConfig) => {
  if (config.mode === 'year-end') return 'до конца года';
  if (config.mode === 'deal-end') return 'до конца сделок';
  return 'на выбранную дату';
};

export const ForecastControls = ({ config, onChange }: { config: ForecastConfig; onChange: (config: ForecastConfig) => void }) => (
  <div className="relative z-10 mt-4 flex flex-col gap-2">
    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black">Период прогноза</p>
    <div className="grid grid-cols-2 gap-2">
      {[
        { id: 'year-end', label: 'До конца года' },
        { id: 'deal-end', label: 'До конца сделок' },
        { id: 'custom', label: 'На дату' },
      ].map(item => (
        <button
          key={item.id}
          onClick={() => onChange({ ...config, mode: item.id as ForecastMode })}
        className={`w-full min-w-0 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-colors whitespace-nowrap cursor-pointer ${config.mode === item.id ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-surface-2 text-slate-400 border-line hover:bg-surface-2/80 hover:text-slate-100'}`}
        >
          {item.label}
        </button>
      ))}
      <input
        type="date"
        value={config.customDate}
        onChange={e => onChange({ mode: 'custom', customDate: e.target.value })}
        className="w-full min-w-0 bg-surface-2 border border-line rounded-xl px-3 py-2 text-[10px] font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors font-mono"
      />
    </div>
  </div>
);
