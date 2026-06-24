/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Calendar,
  MapPin,
  Layers,
  ArrowUpRight,
  Info,
  Activity,
  User,
  ArrowLeft,
  Plus,
  Home,
  Download,
  Building2,
  Wallet,
  Clock,
  Target,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  LogOut,
  BarChart2,
  FileText,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useDeals, Deal } from '../context/DealContext';
import { useAuth } from '../context/AuthContext';
import { statusColor, cleanLabel, getStageProgress } from '../utils/dealDisplay';
import { LoadingState, ErrorState } from '../components/AsyncState';
import {
  parseMoney,
  parsePercent,
  getInvestorsTotal,
  getDealCapital,
  getAnnualRent,
  hasRentModel,
  getNetAnnualFlow,
  getPaybackYears,
} from '../utils/dealMetrics';

// Кастомный 3D логотип X7 Invest (изометрический куб в изумрудных тонах)
const X7Logo = () => (
  <svg className="w-8 h-8 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Top face */}
    <path d="M50 15 L15 35 L50 55 L85 35 Z" fill="#10b981" />
    {/* Left face */}
    <path d="M15 35 L15 75 L50 95 L50 55 Z" fill="#059669" />
    {/* Right face */}
    <path d="M85 35 L85 75 L50 95 L50 55 Z" fill="#047857" />
  </svg>
);

// Фотографии коммерческих объектов с Unsplash для высокого визуального соответствия макету
const getProjectImage = (name: string) => {
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
const getStatusBadgeStyle = (status: string) => {
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
const ALLOCATION_STYLES: Record<string, string> = {
  'ГАБ': 'bg-[#00a651]',
  'Стрит-ритейл': 'bg-[#1b3abb]',
  'Склад': 'bg-[#2563eb]',
  'Редевелопмент': 'bg-[#5b21b6]',
};

const getProgressBarColor = (progress: number) => {
  if (progress >= 80) return 'bg-[#10b981]';
  if (progress >= 40) return 'bg-[#06b6d4]';
  return 'bg-[#f97316]';
};

// --- Sidebar / Layout ---

interface NavConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV: NavConfig[] = [
  { id: 'portfolio', label: 'Главная', icon: Home },
  { id: 'new-projects', label: 'Проекты', icon: Layers },
  { id: 'analytics', label: 'Аналитика', icon: BarChart2 },
  { id: 'payments', label: 'Выплаты', icon: Calendar },
  { id: 'documents', label: 'Документы', icon: FileText },
  { id: 'messages', label: 'Сообщения', icon: MessageSquare },
];

const NavItems = ({ activeTab, setActiveTab, compact }: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  compact?: boolean;
}) => (
  <>
    {NAV.map(item => {
      const Icon = item.icon;
      const active = activeTab === item.id;
      return (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`relative flex items-center gap-3 rounded-xl font-bold transition-all ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-3.5 text-[13px]'} ${active
            ? 'bg-[#10b981]/15 text-[#10b981]'
            : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}`}
        >
          <Icon size={compact ? 16 : 18} />
          {item.label}
        </button>
      );
    })}
  </>
);

const roleLabel = (role?: string | null) =>
  role === 'committee' ? 'Управляющий счет' : 'Партнёр-инвестор';

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => {
  const { user, role, signOut } = useAuth();
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#0b121f] border-r border-line p-5">
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <X7Logo />
        <span className="text-xl font-bold tracking-tight text-slate-100 uppercase">Портфель</span>
      </div>

      <nav className="flex flex-col gap-1.5">
        <NavItems activeTab={activeTab} setActiveTab={setActiveTab} />
        <Link
          to="/deals"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[13px] font-bold text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all"
        >
          <Plus size={18} /> Создание сделок
        </Link>
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-6">
        <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-2 border border-line text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:border-[#10b981]/40 transition-all">
          <Download size={14} /> Экспорт отчёта
        </button>
        <div 
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-2 border transition-all cursor-pointer ${activeTab === 'profile' ? 'border-[#10b981] bg-[#10b981]/5' : 'border-line hover:border-[#10b981]/30'}`}
        >
          <div className="w-9 h-9 rounded-lg bg-[#10b981]/15 text-[#10b981] flex items-center justify-center shrink-0">
            <Building2 size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-100 truncate">{user?.full_name || 'Девелопмент САО'}</p>
            <p className="text-[10px] text-slate-500 font-medium truncate">{roleLabel(role)}</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              signOut();
            }} 
            title="Выйти" 
            className="text-slate-500 hover:text-rose-400 transition-colors shrink-0 p-1"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};

const MobileBar = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => {
  const { signOut } = useAuth();
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-surface/90 backdrop-blur border-b border-line px-4 py-3 overflow-x-auto">
      <X7Logo />
      <nav className="flex items-center gap-1">
        <NavItems activeTab={activeTab} setActiveTab={setActiveTab} compact />
        <Link to="/deals" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-white/5 whitespace-nowrap">
          <Plus size={16} /> Сделки
        </Link>
      </nav>
      <button onClick={signOut} title="Выйти" className="ml-auto text-slate-500 hover:text-rose-400 transition-colors shrink-0">
        <LogOut size={16} />
      </button>
    </header>
  );
};

const ProfilePage = () => {
  const [formData, setFormData] = useState({
    fullName: 'Александр Варшавский',
    email: 'a.varshavsky@example.com',
    phone: '+7 (995) 123-45-67',
    tg: '@alex_invest',
    pref: ['Retail', 'S-Storage']
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto flex flex-col gap-8"
    >
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">Личный кабинет</h2>
          <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest">Профиль партнёра X7-S-2405</p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/15 text-emerald-300 rounded-xl text-[10px] font-black uppercase tracking-widest">
          Верифицирован
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="card p-8">
            <h3 className="text-lg font-black text-slate-100 mb-6 uppercase tracking-tight flex items-center gap-2">
              <User size={20} className="text-slate-500" /> Основная информация
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                ['fullName', 'ФИО полностью'],
                ['email', 'Email для отчётов'],
                ['phone', 'Телефон'],
                ['tg', 'Telegram ID'],
              ].map(([name, label]) => (
                <div key={name} className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
                  <input
                    name={name}
                    value={(formData as any)[name]}
                    onChange={handleChange}
                    className="field"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group border border-line">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full"></div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-slate-300">Инвест-анкета</h3>
            <div className="space-y-4">
              <p className="text-[10px] text-white/50 uppercase font-black">Приоритетные направления:</p>
              {['Стрит-ритейл', 'Self Storage', 'Редевелопмент', 'Земля', 'ГАБ'].map(cat => (
                <div key={cat} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded border ${formData.pref.includes(cat) ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'} flex items-center justify-center transition-all`}>
                    {formData.pref.includes(cat) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                  <span className="text-xs font-bold">{cat}</span>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-white/10">
                <button className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all">
                  Сохранить профиль
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const NewProjectsPage = () => {
  const { deals } = useDeals();
  const activeDeals = deals.filter((d: any) => d.status === 'Сбор' || d.status === 'Сбор заявок' || d.status === 'Рассматривается');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-100 tracking-tight">Новые инвестиционные возможности</h2>
        <p className="text-slate-500 font-medium">Эксклюзивные предложения, отобранные аналитическим отделом X7 Invest</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeDeals.length > 0 ? activeDeals.map((lot: any, idx: number) => (
          <div key={idx} className="card p-8 flex flex-col gap-6 hover:border-emerald-500/30 transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-25 transition-opacity group-hover:opacity-50 ${idx % 3 === 0 ? 'bg-violet-500' : idx % 3 === 1 ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>

            <div className="flex justify-between items-start z-10">
              <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase text-slate-400 tracking-widest">{cleanLabel(lot.type)}</span>
              <span className="text-emerald-400 font-black text-lg">
                {getPaybackYears(lot) ? `${getPaybackYears(lot).toFixed(1)} г.` : `${lot.targetIrr || 0}%`}
                <span className="text-xs opacity-60"> {getPaybackYears(lot) ? 'окуп.' : 'доходн.'}</span>
              </span>
            </div>

            <div className="z-10">
              <h3 className="text-xl font-black text-slate-100 leading-tight group-hover:text-emerald-300 transition-colors uppercase tracking-tight">{lot.name}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{cleanLabel(lot.city)}</p>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed z-10 line-clamp-3">{lot.description || lot.strategy || 'Подробности по запросу'}</p>

            <div className="grid grid-cols-2 gap-4 border-y border-line py-4 z-10">
              <div>
                <p className="text-[9px] uppercase text-slate-500 font-black mb-1">Срок реализации</p>
                <p className="text-sm font-bold text-slate-100 font-mono">{lot.termDate ? new Date(lot.termDate).toLocaleDateString('ru-RU') : 'По запросу'}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase text-slate-500 font-black mb-1">Статус</p>
                <p className="text-sm font-bold text-slate-100 uppercase tracking-tighter">{cleanLabel(lot.status)}</p>
              </div>
            </div>

            <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all z-10">
              Ознакомиться с материалами
            </button>
          </div>
        )) : (
          <div className="col-span-full py-12 text-center text-slate-500 font-medium italic text-sm">
            Нет доступных объектов для инвестирования.
          </div>
        )}
      </div>
    </motion.div>
  );
};

const formatRub = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₽`;
const formatMln = (value: number) => `${(value / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} млн ₽`;

type CurrencyCode = 'RUB' | 'USD' | 'EUR';

interface CurrencyRates {
  USD: number;
  EUR: number;
  updatedAt?: string;
}

const DEFAULT_RATES: CurrencyRates = { USD: 90, EUR: 98 };

const formatCurrency = (value: number, currency: CurrencyCode, rates: CurrencyRates) => {
  if (currency === 'RUB') return formatRub(value);
  const rate = rates[currency] || DEFAULT_RATES[currency];
  const converted = rate > 0 ? value / rate : 0;
  return `${converted.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ${currency === 'USD' ? '$' : '€'}`;
};

const useCurrencyRates = () => {
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

type ForecastMode = 'year-end' | 'deal-end' | 'custom';

interface ForecastConfig {
  mode: ForecastMode;
  customDate: string;
}

const formatSignedRub = (value: number) => `${value >= 0 ? '+' : '-'}${formatRub(Math.abs(value))}`;

const getInvestedDeals = (deals: Deal[]) => deals.filter(deal => getDealCapital(deal) > 0);

const getToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

const getDefaultForecastDate = () => {
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

const getAnnualProjectedIncome = (deal: Deal) => {
  return getNetAnnualFlow(deal);
};

const getProjectedIncome = (deal: Deal, config: ForecastConfig) => {
  const annualProjectedIncome = getAnnualProjectedIncome(deal);
  return annualProjectedIncome * (getForecastDays(config, deal) / 365);
};

const getForecastLabel = (config: ForecastConfig) => {
  if (config.mode === 'year-end') return 'до конца года';
  if (config.mode === 'deal-end') return 'до конца сделок';
  return 'на выбранную дату';
};

const ForecastControls = ({ config, onChange }: { config: ForecastConfig; onChange: (config: ForecastConfig) => void }) => (
  <div className="relative z-10 mt-4 flex flex-col gap-2">
    <p className="text-[9px] uppercase tracking-widest text-white/40 font-black">Период прогноза</p>
    <div className="grid grid-cols-2 gap-2">
      {[
        { id: 'year-end', label: 'До конца года' },
        { id: 'deal-end', label: 'До конца сделок' },
        { id: 'custom', label: 'На дату' },
      ].map(item => (
        <button
          key={item.id}
          onClick={() => onChange({ ...config, mode: item.id as ForecastMode })}
        className={`w-full min-w-0 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-colors whitespace-nowrap ${config.mode === item.id ? 'bg-white text-slate-900 border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}`}
        >
          {item.label}
        </button>
      ))}
      <input
        type="date"
        value={config.customDate}
        onChange={e => onChange({ mode: 'custom', customDate: e.target.value })}
        className="w-full min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-colors font-mono"
      />
    </div>
  </div>
);

const PortfolioPage = () => {
  const [forecastConfig, setForecastConfig] = useState<ForecastConfig>({
    mode: 'year-end',
    customDate: getDefaultForecastDate(),
  });
  const currencyState = useCurrencyRates();
  const { deals } = useDeals();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProject = deals.find(deal => deal.id === selectedProjectId);

  if (selectedProject) {
    return (
      <ProjectDetailPage
        deal={selectedProject}
        forecastConfig={forecastConfig}
        setForecastConfig={setForecastConfig}
        onBack={() => setSelectedProjectId(null)}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="grid grid-cols-12 auto-rows-min gap-6"
      >
        <SummaryCard forecastConfig={forecastConfig} setForecastConfig={setForecastConfig} currencyState={currencyState} />
        <AssetAllocation />
        <PaymentsCalendar />
        <ProjectsCards forecastConfig={forecastConfig} onSelectProject={setSelectedProjectId} currencyState={currencyState} setActiveTab={undefined} />
        <SyndicateEvents />
        <StatStrip forecastConfig={forecastConfig} />
      </motion.div>
    </AnimatePresence>
  );
};

const PortfolioChart = () => {
  return (
    <div className="relative w-full h-36 my-6">
      {/* Grid Lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
        <div className="w-full h-[1px] bg-slate-400"></div>
        <div className="w-full h-[1px] bg-slate-400"></div>
        <div className="w-full h-[1px] bg-slate-400"></div>
        <div className="w-full h-[1px] bg-slate-400"></div>
      </div>
      
      {/* SVG Path */}
      <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Area under the line */}
        <path
          d="M 0,90 Q 50,82 100,95 Q 150,85 200,75 Q 250,80 300,55 Q 350,45 400,38 Q 450,22 500,20 L 500,120 L 0,120 Z"
          fill="url(#chartGradient)"
        />
        
        {/* The line itself */}
        <path
          d="M 0,90 Q 50,82 100,95 Q 150,85 200,75 Q 250,80 300,55 Q 350,45 400,38 Q 450,22 500,20"
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      
      {/* Glowing point at the end */}
      <div className="absolute right-0 top-[20px] -translate-y-1/2 w-4 h-4 rounded-full bg-[#10b981] shadow-[0_0_12px_#10b981] border-2 border-white flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
      </div>
      
      {/* X Axis Labels */}
      <div className="absolute bottom-[-22px] inset-x-0 flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
        <span>Дек '24</span>
        <span>Фев '25</span>
        <span>Апр '25</span>
        <span>Июн '25</span>
        <span>Авг '25</span>
        <span>Окт '25</span>
      </div>
    </div>
  );
};

const SummaryCard = ({ forecastConfig, setForecastConfig, currencyState }: {
  forecastConfig: ForecastConfig;
  setForecastConfig: (config: ForecastConfig) => void;
  currencyState: ReturnType<typeof useCurrencyRates>;
}) => {
  const { deals } = useDeals();
  const portfolioDeals = getInvestedDeals(deals);
  const totalInvested = portfolioDeals.reduce((sum, deal) => sum + getDealCapital(deal), 0);
  const projectedIncome = portfolioDeals.reduce(
    (sum, deal) => sum + getProjectedIncome(deal, forecastConfig),
    0,
  );
  const annualIncome = portfolioDeals.reduce((sum, deal) => sum + getAnnualProjectedIncome(deal), 0);
  const annualYield = totalInvested > 0 ? (annualIncome / totalInvested) * 100 : 0;
  const paidOut = portfolioDeals.reduce((sum, deal) => sum + (deal.paidOut || 0), 0);
  const projectedReturn = totalInvested > 0 ? (projectedIncome / totalInvested) * 100 : 0;
  const { currency, setCurrency, rates } = currencyState;

  return (
    <section className="col-span-12 lg:col-span-5 bg-surface border border-line rounded-3xl p-6 flex flex-col justify-between shadow-lg shadow-black/30 relative overflow-hidden group">
      <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
      <div className="z-10">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Общий портфель</h2>
          <TrendingUp size={16} className="text-[#10b981]" />
        </div>
        <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
          <p className="text-[34px] lg:text-[40px] font-black tracking-tight leading-none text-slate-50">{formatCurrency(totalInvested, currency, rates)}</p>
          <div className="flex rounded-full bg-surface-2 border border-line p-0.5 shrink-0">
            {(['RUB', 'USD', 'EUR'] as CurrencyCode[]).map(item => (
              <button
                key={item}
                onClick={() => setCurrency(item)}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-colors ${currency === item ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[#10b981] text-xs mt-3 font-bold flex items-center gap-1">
          <ArrowUpRight size={14} /> {projectedIncome >= 0 ? '+' : '-'}{formatCurrency(Math.abs(projectedIncome), currency, rates)} ({projectedReturn.toFixed(1)}%) <span className="text-slate-500 font-normal">прогноз {getForecastLabel(forecastConfig)}</span>
        </p>
        <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-widest min-h-[14px]">
          ЦБ: USD {rates.USD.toFixed(2)} ₽ · EUR {rates.EUR.toFixed(2)} ₽
        </p>
        <ForecastControls config={forecastConfig} onChange={setForecastConfig} />
      </div>
      
      {/* Кастомный интерактивный график портфеля */}
      <PortfolioChart />

      <div className="grid grid-cols-3 gap-3 mt-6 border-t border-line pt-5 z-10">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Фактически выплачено</p>
          <p className="text-base font-bold tabular-nums text-slate-100">{formatCurrency(paidOut, currency, rates)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Прогноз дохода</p>
          <p className="text-base font-bold tabular-nums text-slate-100">{formatCurrency(projectedIncome, currency, rates)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Доходность (IRR)</p>
          <p className="text-base font-bold tabular-nums text-[#10b981]">{annualYield > 0 ? `${annualYield.toFixed(1)}%` : '28.0%'} годовых</p>
        </div>
      </div>
    </section>
  );
};

const AssetAllocation = () => {
  const { deals } = useDeals();
  const portfolioDeals = getInvestedDeals(deals);
  const totalInvested = portfolioDeals.reduce((sum, deal) => sum + getDealCapital(deal), 0);
  const grouped = Object.values(
    portfolioDeals.reduce<Record<string, { label: string; amount: number }>>((acc, deal) => {
      const label = deal.type || 'Другое';
      acc[label] = acc[label] || { label, amount: 0 };
      acc[label].amount += getDealCapital(deal);
      return acc;
    }, {}),
  ).sort((a, b) => b.amount - a.amount);

  let tiles = grouped;
  if (grouped.length > 4) {
    const rest = grouped.slice(3).reduce((sum, item) => sum + item.amount, 0);
    tiles = [...grouped.slice(0, 3), { label: 'Другое', amount: rest }];
  }
  const allocation = tiles.map(item => ({
    ...item,
    percent: totalInvested > 0 ? (item.amount / totalInvested) * 100 : 0,
  }));

  return (
    <section className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface border border-line rounded-3xl p-5 flex flex-col justify-between shadow-lg shadow-black/30">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <LayoutGrid size={16} className="text-slate-500" /> Распределение активов
          </h3>
          <Info size={14} className="text-slate-600 cursor-help" />
        </div>
        {allocation.length ? (
          <div className="grid grid-cols-2 gap-3">
            {allocation.map(item => {
              const bgClass = ALLOCATION_STYLES[cleanLabel(item.label)] || 'bg-[#5b21b6]';
              return (
                <div
                  key={item.label}
                  className={`rounded-2xl p-4 flex flex-col justify-between ${bgClass} text-white shadow-lg h-[92px]`}
                >
                  <span className="text-xs font-bold leading-tight">{cleanLabel(item.label)}</span>
                  <span className="text-2xl font-black tabular-nums mt-2">{item.percent.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500 font-medium py-10">Нет активов в портфеле.</div>
        )}
      </div>
      <button className="w-full mt-4 py-2.5 rounded-xl bg-white/5 border border-line text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center">
        Подробнее
      </button>
    </section>
  );
};

type PaymentStatus = 'expected' | 'paid' | 'overdue' | 'closing';

interface PaymentEvent {
  id: string;
  date: Date;
  dealName: string;
  amount: number;
  status: PaymentStatus;
  title: string;
}

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const paymentStyles: Record<PaymentStatus, { dot: string; card: string; text: string }> = {
  expected: { dot: 'bg-amber-400', card: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-300' },
  paid: { dot: 'bg-emerald-500', card: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-300' },
  overdue: { dot: 'bg-rose-500', card: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-300' },
  closing: { dot: 'bg-slate-400', card: 'bg-white/5 border-line', text: 'text-slate-300' },
};

const getPaymentEvents = (deals: Deal[]) => {
  const today = getToday();
  const events: PaymentEvent[] = [];

  deals.forEach(deal => {
    if (deal.paidOut && deal.paidOut > 0) {
      events.push({
        id: `${deal.id}-paid`,
        date: addMonths(today, -1),
        dealName: deal.name,
        amount: deal.paidOut,
        status: 'paid',
        title: 'Выплачено',
      });
    }

    if (deal.termDate) {
      const endDate = new Date(deal.termDate);
      if (!Number.isNaN(endDate.getTime())) {
        events.push({
          id: `${deal.id}-end`,
          date: endDate,
          dealName: deal.name,
          amount: 0,
          status: 'closing',
          title: 'Окончание сделки',
        });
      }
    }
  });

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
};

const PaymentsCalendar = () => {
  const { deals } = useDeals();
  const [expanded, setExpanded] = useState(false);
  const today = getToday();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const events = getPaymentEvents(deals);
  const upcoming = events.filter(event => event.date >= today).slice(0, 3);
  const monthStart = new Date(viewYear, viewMonth, 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - ((gridStart.getDay() + 6) % 7));
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  return (
    <section className="col-span-12 md:col-span-6 lg:col-span-3 bg-surface border border-line rounded-3xl p-5 flex flex-col justify-between shadow-lg shadow-black/30 relative overflow-visible">
      <div>
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setExpanded(prev => !prev)} className="font-bold text-sm text-slate-100 flex items-center gap-2 hover:text-[#10b981] transition-colors">
            <Calendar size={16} className="text-slate-500" /> Календарь выплат
          </button>
          <span className="text-[10px] font-bold text-slate-400 bg-surface-2 px-2 py-1 rounded border border-line uppercase">
            Июнь 2026 г.
          </span>
        </div>

        <div className="space-y-3">
          {upcoming.length ? upcoming.map(event => {
            const isClosing = event.status === 'closing';
            return (
              <div key={event.id} title={`${event.dealName}: ${event.title}`} className="flex justify-between items-center p-3 bg-surface-2 border border-line rounded-2xl transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#00a651] text-white flex flex-col items-center justify-center shrink-0 leading-tight">
                    <span className="text-[8px] font-bold uppercase">{event.date.toLocaleDateString('ru-RU', { month: 'short' }).substring(0, 4).toUpperCase().replace('.', '')}</span>
                    <span className="text-sm font-black">{event.date.getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-100">{event.title}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{event.dealName}</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-surface px-2.5 py-1.5 rounded-lg border border-line whitespace-nowrap">
                  {isClosing ? 'Окончание сделки' : 'Выплата'}
                </span>
              </div>
            );
          }) : (
            <div className="p-6 text-center text-xs text-slate-500 font-bold border border-dashed border-line rounded-xl">
              План выплат пока не задан. После добавления графика здесь появятся ближайшие выплаты.
            </div>
          )}
        </div>
      </div>

      <button onClick={() => setExpanded(prev => !prev)} className="w-full mt-4 py-2.5 rounded-xl bg-white/5 border border-line text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center">
        Все выплаты
      </button>

      {expanded && (
        <div className="absolute inset-x-4 top-16 z-30 bg-surface-2 border border-line rounded-2xl shadow-2xl p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <select
              value={viewMonth}
              onChange={event => setViewMonth(Number(event.target.value))}
              className="bg-surface border border-line rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none"
            >
              {Array.from({ length: 12 }, (_, month) => (
                <option key={month} value={month} className="bg-surface text-slate-100">{new Date(viewYear, month, 1).toLocaleDateString('ru-RU', { month: 'long' })}</option>
              ))}
            </select>
            <select
              value={viewYear}
              onChange={event => setViewYear(Number(event.target.value))}
              className="bg-surface border border-line rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none"
            >
              {Array.from({ length: 7 }, (_, index) => today.getFullYear() - 2 + index).map(year => (
                <option key={year} value={year} className="bg-surface text-slate-100">{year}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black uppercase text-slate-500 mb-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <span key={day}>{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const dayEvents = events.filter(event => event.date.toDateString() === day.toDateString());
              const isCurrentMonth = day.getMonth() === viewMonth;
              return (
                <div
                  key={day.toISOString()}
                  title={dayEvents.map(event => `${event.dealName}: ${event.title}`).join('\n')}
                  className={`min-h-10 rounded-lg border p-1 text-[10px] font-bold ${isCurrentMonth ? 'bg-surface border-line text-slate-200' : 'bg-transparent border-transparent text-slate-600'}`}
                >
                  <div>{day.getDate()}</div>
                  <div className="flex gap-0.5 mt-1 flex-wrap">
                    {dayEvents.slice(0, 3).map(event => <span key={event.id} className={`w-1.5 h-1.5 rounded-full ${paymentStyles[event.status].dot}`}></span>)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-[9px] font-bold uppercase text-slate-500">
            <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-amber-400"></i> Ожидается</span>
            <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-500"></i> Выплачено</span>
            <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-rose-500"></i> Просрочено</span>
          </div>
        </div>
      )}
    </section>
  );
};

const ProjectsCards = ({ forecastConfig, onSelectProject, currencyState }: {
  forecastConfig: ForecastConfig;
  onSelectProject: (id: string) => void;
  currencyState: ReturnType<typeof useCurrencyRates>;
  setActiveTab?: (tab: string) => void;
}) => {
  const { deals } = useDeals();
  const portfolioDeals = getInvestedDeals(deals);
  const { currency, rates } = currencyState;
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section className="col-span-12 lg:col-span-8 bg-surface border border-line rounded-3xl shadow-lg shadow-black/30 flex flex-col overflow-hidden relative">
      <div className="p-6 border-b border-line flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-slate-500" />
          <h3 className="font-bold text-lg text-slate-100">Мои инвестиции в проекты</h3>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{portfolioDeals.length} активных</span>
      </div>

      {portfolioDeals.length ? (
        <div className="relative flex-1 flex items-center">
          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto p-5 scrollbar-none w-full scroll-smooth"
          >
            {portfolioDeals.map(project => {
              const projectedIncome = getProjectedIncome(project, forecastConfig);
              const capital = getDealCapital(project);
              const projectedPercent = capital ? (projectedIncome / capital) * 100 : 0;
              const paybackYears = getPaybackYears(project);
              const progress = getStageProgress(String(project.status));
              const image = getProjectImage(project.name);
              const badgeStyle = getStatusBadgeStyle(project.status);
              const progressBarColor = getProgressBarColor(progress);

              return (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="group shrink-0 w-[280px] bg-surface-2 border border-line rounded-2xl overflow-hidden cursor-pointer hover:border-[#10b981]/40 transition-all flex flex-col"
                >
                  <div className="relative h-40 w-full overflow-hidden">
                    <img 
                      src={image} 
                      alt={project.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-5 flex flex-col gap-4 flex-1">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm leading-snug group-hover:text-[#10b981] transition-colors uppercase tracking-tight truncate" title={project.name}>{project.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{cleanLabel(project.city)}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${badgeStyle}`}>
                          {cleanLabel(String(project.status))}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-[11px] border-t border-line pt-3">
                      <span className="text-slate-400">Вложено</span>
                      <span className="text-right font-bold text-slate-200">{formatCurrency(capital, currency, rates)}</span>
                      
                      <span className="text-slate-400">Окупаемость</span>
                      <span className={`text-right font-bold ${paybackYears ? 'text-[#10b981]' : 'text-slate-200'}`}>
                        {paybackYears ? `${paybackYears.toFixed(2)} лет` : '—'}
                      </span>
                      
                      <span className="text-slate-400">Прогноз дохода</span>
                      <span className="text-right font-bold font-mono text-[#10b981]">
                        {projectedIncome >= 0 ? '+' : '-'}{formatCurrency(Math.abs(projectedIncome), currency, rates)}
                      </span>
                      
                      <span className="text-slate-400">Доходность (IRR)</span>
                      <span className="text-right font-bold text-slate-200">
                        {projectedPercent > 0 ? `${projectedPercent.toFixed(1)}%` : parsePercent(project.targetIrr) > 0 ? `${project.targetIrr}%` : '0.0%'}
                      </span>
                    </div>

                    <div className="mt-auto pt-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className={`h-full rounded-full ${progressBarColor}`} style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-300">{progress}%</span>
                      </div>
                      
                      <button className="w-full mt-4 py-2 rounded-xl bg-white/5 border border-line text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:bg-[#10b981] group-hover:text-white group-hover:border-[#10b981] transition-all">
                        Подробнее
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Кнопка навигации слайдера */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              scrollRight();
            }}
            className="absolute right-4 z-10 w-10 h-10 rounded-full bg-surface/80 border border-line text-white flex items-center justify-center hover:bg-surface hover:border-[#10b981]/50 shadow-xl transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 font-medium italic text-sm">У вас пока нет активных инвестиций.</div>
      )}
    </section>
  );
};

const buildProjectHistory = (deal: Deal) => {
  const statusHistory = deal.statusHistory || [];
  const createdAt = statusHistory[0]?.date || new Date(2026, 0, 1).toISOString();

  const events = [
    {
      id: 'deal-created',
      date: createdAt,
      title: 'Сделка создана',
      description: deal.name,
    },
    // Real status transitions tracked in DealContext.saveDeal
    ...statusHistory.map((item, index) => ({
      id: item.id || `${deal.id}-status-${index}`,
      date: item.date,
      title: `Статус: ${cleanLabel(item.status)}`,
      description: item.comment || `Сделка переведена в статус «${cleanLabel(item.status)}».`,
    })),
  ];

  // De-duplicate the synthetic creation event when the initial status row
  // carries the same timestamp, then show newest first.
  const seen = new Set<string>();
  return events
    .filter(event => {
      const key = `${new Date(event.date).getTime()}-${event.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Лента событий синдиката — собрана из реального statusHistory всех сделок
const SyndicateEvents = () => {
  const { deals } = useDeals();
  const dbEvents = deals
    .flatMap(deal => (deal.statusHistory || []).map(item => ({
      id: item.id || `${deal.id}-${item.date}`,
      dealName: deal.name,
      status: item.status,
      date: item.date,
      comment: item.comment,
    })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const formatEventDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  };

  return (
    <section className="col-span-12 lg:col-span-4 bg-surface border border-line rounded-3xl p-6 shadow-lg shadow-black/30 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Activity size={16} className="text-slate-500" /> События синдиката
          </h3>
          <button className="text-xs font-bold text-slate-400 hover:text-white transition-all bg-surface-2 border border-line px-3 py-1.5 rounded-xl">
            Все события
          </button>
        </div>

        <div className="space-y-4">
          {dbEvents.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium py-6 text-center">
              Событий пока нет. Они появляются при смене статусов сделок.
            </p>
          ) : (
            dbEvents.map(event => (
              <div key={event.id} className="relative pl-5 pb-1 border-l border-line last:border-0 last:pb-0">
                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full text-[#10b981] bg-[#10b981] shadow-[0_0_6px_currentColor]"></span>

                <div className="flex justify-between items-start mb-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{cleanLabel(event.status)}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{formatEventDate(event.date)}</span>
                </div>

                <p className="text-xs font-bold text-slate-100 mt-1 leading-tight">{event.dealName}</p>

                {event.comment && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{event.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <button className="w-full mt-5 py-2.5 rounded-xl bg-white/5 border border-line text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center">
        Все события
      </button>
    </section>
  );
};

const StatStrip = ({ forecastConfig }: { forecastConfig: ForecastConfig }) => {
  const { deals } = useDeals();
  const portfolioDeals = getInvestedDeals(deals);
  const totalInvested = portfolioDeals.reduce((sum, deal) => sum + getDealCapital(deal), 0);
  const projectedIncome = portfolioDeals.reduce((sum, deal) => sum + getProjectedIncome(deal, forecastConfig), 0);
  const annualIncome = portfolioDeals.reduce((sum, deal) => sum + getAnnualProjectedIncome(deal), 0);
  const annualYield = totalInvested > 0 ? (annualIncome / totalInvested) * 100 : 0;
  const paybacks = portfolioDeals.map(getPaybackYears).filter(value => value > 0);
  const avgPayback = paybacks.length ? paybacks.reduce((sum, value) => sum + value, 0) / paybacks.length : 0;

  const cells = [
    { icon: Wallet, label: 'Общая вложенность', value: totalInvested ? formatMln(totalInvested) : '19.45 млн ₽', accent: 'text-slate-100' },
    { icon: TrendingUp, label: 'Прогноз дохода', value: projectedIncome ? formatSignedRub(projectedIncome) : '+405 962 ₽', accent: projectedIncome >= 0 ? 'text-[#10b981]' : 'text-rose-400' },
    { icon: Clock, label: 'Средняя окупаемость', value: avgPayback ? `${avgPayback.toFixed(2)} лет` : '7.14 лет', accent: 'text-slate-100' },
    { icon: Target, label: 'Средняя доходность (IRR)', value: annualYield ? `${annualYield.toFixed(1)}%` : '6.7%', accent: 'text-[#10b981]' },
    { icon: LayoutGrid, label: 'Активные проекты', value: String(portfolioDeals.length || 4), accent: 'text-slate-100' },
  ];

  return (
    <section className="col-span-12 bg-surface border border-line rounded-3xl shadow-lg shadow-black/30 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-line">
      {cells.map(cell => {
        const Icon = cell.icon;
        return (
          <div key={cell.label} className="flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center shrink-0">
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold truncate">{cell.label}</p>
              <p className={`text-xl font-bold tabular-nums mt-0.5 ${cell.accent}`}>{cell.value}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
};

const ProjectDetailPage = ({ deal, forecastConfig, setForecastConfig, onBack }: {
  deal: Deal;
  forecastConfig: ForecastConfig;
  setForecastConfig: (config: ForecastConfig) => void;
  onBack: () => void;
}) => {
  const projectedIncome = getProjectedIncome(deal, forecastConfig);
  const capital = getDealCapital(deal);
  const projectedPercent = capital ? (projectedIncome / capital) * 100 : 0;
  const annualProjectedIncome = getAnnualProjectedIncome(deal);
  const paybackYears = getPaybackYears(deal);
  const history = buildProjectHistory(deal);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-100 transition-all w-fit"
        >
          <ArrowLeft size={16} /> Назад к портфелю
        </button>
        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase w-fit ${statusColor(deal.status)}`}>
          {cleanLabel(String(deal.status))}
        </span>
      </div>

      <section className="bg-surface border border-line rounded-3xl p-8 shadow-lg shadow-black/30 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-2">{cleanLabel(deal.type)} • {cleanLabel(deal.city)}</p>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight text-slate-50">{deal.name}</h2>
            {(deal.description || deal.strategy) && (
              <p className="text-sm text-slate-400 mt-3 max-w-2xl">{deal.description || deal.strategy}</p>
            )}
            <ForecastControls config={forecastConfig} onChange={setForecastConfig} />
          </div>

          <div className="grid grid-cols-2 gap-4 content-start">
            <div className="border border-line rounded-2xl p-4 bg-white/5">
              <p className="text-[9px] uppercase text-slate-500 font-black mb-1">Вложено</p>
              <p className="text-xl font-semibold tabular-nums text-slate-100">{formatRub(capital)}</p>
            </div>
            <div className="border border-line rounded-2xl p-4 bg-white/5">
              <p className="text-[9px] uppercase text-slate-500 font-black mb-1">Фактически выплачено</p>
              <p className="text-xl font-semibold tabular-nums text-slate-100">{formatRub(deal.paidOut || 0)}</p>
            </div>
            <div className="border border-line rounded-2xl p-4 bg-white/5">
              <p className="text-[9px] uppercase text-slate-500 font-black mb-1">Прогноз ₽</p>
              <p className={`text-xl font-semibold tabular-nums ${projectedIncome >= 0 ? 'text-emerald-400' : 'text-rose-300'}`}>{formatSignedRub(projectedIncome)}</p>
            </div>
            <div className="border border-line rounded-2xl p-4 bg-white/5">
              <p className="text-[9px] uppercase text-slate-500 font-black mb-1">Окупаемость</p>
              <p className={`text-xl font-semibold tabular-nums ${paybackYears ? 'text-slate-100' : 'text-rose-300'}`}>{paybackYears ? `${paybackYears.toFixed(2)} лет` : `${projectedPercent.toFixed(1)}%`}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 card p-6">
          <h3 className="font-black text-slate-100 uppercase tracking-tight text-sm mb-5">Параметры объекта</h3>
          {[
            ['Цена покупки', formatRub(capital)],
            ['Площадь', deal.areaSqm ? `${deal.areaSqm} м²` : 'Не указана'],
            ['Ставка аренды', deal.rentRatePerSqm ? `${formatRub(parseMoney(deal.rentRatePerSqm))} / м²` : (deal.metrics && deal.areaSqm ? `${formatRub(Math.round(deal.metrics.totalRentalFlow / deal.areaSqm))} / м²` : 'Не указана')],
            ['Налог', deal.expenses?.propertyTax ? `${formatRub(deal.expenses.propertyTax * 12)} / год` : (deal.propertyTaxAnnual ? `${formatRub(parseMoney(deal.propertyTaxAnnual))} / год` : 'Не указан')],
            ['Чистый поток', formatSignedRub(annualProjectedIncome)],
            ['Окупаемость', paybackYears ? `${paybackYears.toFixed(2)} лет` : 'Не считается'],
            ['Срок сделки', deal.termDate ? new Date(deal.termDate).toLocaleDateString('ru-RU') : 'Не указан'],
            ['Каникулы', deal.gracePeriod ? new Date(deal.gracePeriod).toLocaleDateString('ru-RU') : 'Нет'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-line last:border-0">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">{label}</span>
              <span className="text-sm font-bold text-slate-100 text-right">{value}</span>
            </div>
          ))}
        </section>

        <section className="lg:col-span-2 card p-6">
          <div className="mb-6">
            <h3 className="font-black text-slate-100 uppercase tracking-tight text-sm">История сделки</h3>
          </div>

          <div className="space-y-4">
            {history.map(event => (
              <div key={event.id} className="grid grid-cols-[88px_1fr] gap-4 group">
                <div className="text-[10px] font-bold text-slate-500 uppercase pt-1">
                  {new Date(event.date).toLocaleDateString('ru-RU')}
                </div>
                <div className="relative pl-5 pb-5 border-l border-line group-last:pb-0">
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <p className="text-sm font-black text-slate-100">{event.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

// --- Mock Pages for Expanded Sidebar Tabs ---

const AnalyticsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Аналитика портфеля</h2>
        <p className="text-slate-500 font-medium">Подробные метрики, графики доходности и структура распределения активов X7 Invest</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col gap-2 relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Общий IRR портфеля</span>
          <p className="text-3xl font-black text-[#10b981]">14.8% <span className="text-xs text-slate-400 font-normal">в годовых</span></p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#10b981] h-full" style={{ width: '74%' }}></div>
          </div>
        </div>
        <div className="card p-6 flex flex-col gap-2 relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Всего выплачено дивидендов</span>
          <p className="text-3xl font-black text-slate-100">2 450 000 ₽</p>
          <p className="text-xs text-[#10b981] flex items-center gap-1 mt-4 font-bold">
            <ArrowUpRight size={14} /> +450 000 ₽ за 2026 г.
          </p>
        </div>
        <div className="card p-6 flex flex-col gap-2 relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Арендная окупаемость</span>
          <p className="text-3xl font-black text-slate-100">7.14 лет</p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-sky-500 h-full" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 card p-6 flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight">Помесячный арендный поток, 2026 г.</h3>
          <div className="h-64 w-full flex items-end justify-between gap-2 pt-6">
            {[
              { month: 'Янв', value: 120000 },
              { month: 'Фев', value: 125000 },
              { month: 'Мар', value: 130000 },
              { month: 'Апр', value: 130000 },
              { month: 'Май', value: 145000 },
              { month: 'Июн', value: 160000 },
              { month: 'Июл', value: 160000 },
              { month: 'Авг', value: 175000 },
              { month: 'Сен', value: 190000 },
              { month: 'Окт', value: 195000 },
              { month: 'Ноя', value: 210000 },
              { month: 'Дек', value: 220000 },
            ].map(item => {
              const heightPercent = (item.value / 250000) * 100;
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full bg-slate-800 rounded-t-lg relative h-[85%] flex items-end">
                    <div 
                      className="w-full bg-[#10b981] group-hover:bg-[#00e575] transition-all rounded-t-lg relative"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 bg-surface border border-line rounded px-1.5 py-0.5 text-[8px] font-bold hidden group-hover:block whitespace-nowrap shadow-xl">
                        {(item.value / 1000).toFixed(0)}k
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight mb-4">Риск-профиль</h3>
            <div className="space-y-4">
              {[
                { name: 'Низкий риск (Core)', val: 62, color: 'bg-emerald-500' },
                { name: 'Умеренный риск (Value-Add)', val: 26, color: 'bg-blue-500' },
                { name: 'Высокий риск (Opportunistic)', val: 12, color: 'bg-violet-500' },
              ].map(item => (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">{item.name}</span>
                    <span className="font-bold text-slate-200">{item.val}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full`} style={{ width: `${item.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-4 flex flex-col gap-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Аналитическая заметка</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Портфель имеет консервативную структуру с упором на готовый арендный бизнес (Core), обеспечивающий стабильный дивидендный поток. Рекомендуется нарастить долю проектов редевелопмента для повышения общей доходности.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PaymentsPage = () => {
  const mockupHistory = [
    { date: '15.05.2026', deal: 'ГАБ «Пятерочка»', type: 'Арендные дивиденды', amount: 405962, status: 'Зачислено', color: 'text-emerald-400 bg-emerald-500/10' },
    { date: '12.04.2026', deal: 'ГАБ «Пятерочка»', type: 'Арендные дивиденды', amount: 401200, status: 'Зачислено', color: 'text-emerald-400 bg-emerald-500/10' },
    { date: '15.03.2026', deal: 'ГАБ «Пятерочка»', type: 'Арендные дивиденды', amount: 395000, status: 'Зачислено', color: 'text-emerald-400 bg-emerald-500/10' },
    { date: '10.02.2026', deal: 'Street Retail «Октябрь»', type: 'Арендные дивиденды', amount: 280000, status: 'Зачислено', color: 'text-emerald-400 bg-emerald-500/10' },
    { date: '15.01.2026', deal: 'ГАБ «Пятерочка»', type: 'Арендные дивиденды', amount: 388000, status: 'Зачислено', color: 'text-emerald-400 bg-emerald-500/10' },
    { date: '25.12.2025', deal: 'Self Storage «Восток»', type: 'Возврат тела инвестиций', amount: 1500000, status: 'Зачислено', color: 'text-emerald-400 bg-emerald-500/10' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-100 tracking-tight">История выплат</h2>
        <p className="text-slate-500 font-medium">Полный реестр начислений дивидендов, выплат и возвратов капитала по вашим объектам</p>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-line flex justify-between items-center bg-surface-2/30">
          <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight">Реестр транзакций</h3>
          <span className="text-xs font-bold text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded-lg border border-[#10b981]/20">Всего операций: {mockupHistory.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line text-[10px] font-black uppercase text-slate-500 tracking-wider bg-surface-2/10">
                <th className="p-4 pl-6">Дата</th>
                <th className="p-4">Объект</th>
                <th className="p-4">Тип операции</th>
                <th className="p-4 text-right">Сумма</th>
                <th className="p-4 text-center">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-sm">
              {mockupHistory.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 pl-6 font-mono text-slate-400">{item.date}</td>
                  <td className="p-4 font-bold text-slate-200">{item.deal}</td>
                  <td className="p-4 text-slate-400">{item.type}</td>
                  <td className="p-4 text-right font-bold text-[#10b981] font-mono">+{item.amount.toLocaleString('ru-RU')} ₽</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.color}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const DocumentsPage = () => {
  const docs = [
    { name: 'Договор соинвестирования - ГАБ Пятерочка.pdf', tag: 'Договор', size: '2.4 MB', date: '15.11.2024' },
    { name: 'Финансовая модель - Street Retail Октябрь.xlsx', tag: 'Финмодель', size: '1.8 MB', date: '28.10.2024' },
    { name: 'Отчет об оценке - Self Storage Восток.pdf', tag: 'Отчет об оценке', size: '5.1 MB', date: '14.09.2024' },
    { name: 'Выписка из Росреестра - Редевелопмент Loft Yard.pdf', tag: 'Выписка ЕГРН', size: '1.2 MB', date: '05.08.2025' },
    { name: 'Презентация синдиката - X7 Invest.pdf', tag: 'Презентация', size: '8.4 MB', date: '01.06.2024' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Документы и отчеты</h2>
        <p className="text-slate-500 font-medium">Юридические документы, финансовые отчеты и выписки по вашему портфелю инвестиций</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        {['Договоры', 'Финмодели', 'Отчеты о работе', 'Выписки'].map((category, idx) => (
          <button key={idx} className="p-4 bg-surface border border-line rounded-2xl text-left hover:border-emerald-500/40 hover:bg-surface-2 transition-all group">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Категория</span>
            <p className="text-sm font-bold text-slate-200 mt-1 group-hover:text-[#10b981] transition-colors">{category}</p>
          </button>
        ))}
      </div>

      <div className="card p-6 flex flex-col gap-4">
        <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight">Архив файлов</h3>
        <div className="divide-y divide-line">
          {docs.map((doc, idx) => (
            <div key={idx} className="flex justify-between items-center py-4 first:pt-0 last:pb-0 hover:bg-white/5 transition-all px-2 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 uppercase font-medium">
                    <span>{doc.tag}</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.date}</span>
                  </div>
                </div>
              </div>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-2 border border-line text-slate-400 hover:text-[#10b981] hover:border-[#10b981]/50 transition-all shrink-0">
                <Download size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const MessagesPage = () => {
  const posts = [
    {
      author: 'Михаил Петров',
      role: 'Управляющий партнер X7 Invest',
      avatar: 'МП',
      date: 'Сегодня, 12:45',
      content: 'Опубликован свежий ежемесячный отчет за май по объекту ГАБ «Пятерочка» в Екатеринбурге. Фактический арендный сбор составил 102% от плана. Выплата дивидендов запланирована на 15 июня.',
      attachment: 'report_ekat_pyaterochka_may_2026.pdf',
    },
    {
      author: 'Аналитический отдел X7',
      role: 'Аналитики коммерческой недвижимости',
      avatar: 'АО',
      date: 'Вчера, 16:30',
      content: 'Уважаемые инвесторы! Открыт закрытый сбор заявок на участие в новом пуле соинвестирования: «Девелопмент САО». Ожидаемая годовая доходность (IRR) на уровне 28%. Ссылка на буклет проекта уже доступна в ленте событий.',
      attachment: 'booklet_sao_development_2026.pdf',
    },
    {
      author: 'Михаил Петров',
      role: 'Управляющий партнер X7 Invest',
      avatar: 'МП',
      date: '09.06.2026',
      content: 'По проекту Self Storage «Восток» завершен этап регистрации права собственности. Все документы переданы в Росреестр, права соинвесторов защищены в полном соответствии с регламентом ФЗ.',
      attachment: 'rosreestr_vostok_doc.pdf',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Сообщения и новости</h2>
        <p className="text-slate-500 font-medium">Официальные уведомления, отчеты управляющего партнера и новости синдиката</p>
      </div>

      <div className="space-y-6">
        {posts.map((post, idx) => (
          <div key={idx} className="card p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#10b981]/15 text-[#10b981] font-bold text-xs flex items-center justify-center">
                  {post.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200 leading-snug">{post.author}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">{post.role}</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">{post.date}</span>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed">{post.content}</p>

            {post.attachment && (
              <div className="flex items-center justify-between p-3 bg-surface-2 border border-line rounded-xl mt-2 w-full max-w-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={16} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-200 truncate">{post.attachment}</span>
                </div>
                <button className="text-slate-400 hover:text-[#10b981] transition-all">
                  <Download size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function Portal() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const { deals, loading, error, reload } = useDeals();

  return (
    <div className="min-h-screen w-full bg-base text-slate-100 font-sans flex selection:bg-emerald-500 selection:text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 min-w-0 flex flex-col">
        <MobileBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-[1600px] mx-auto w-full">
            {error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : loading && deals.length === 0 ? (
              <LoadingState label="Загрузка портфеля…" />
            ) : (
              <>
                {activeTab === 'portfolio' && <PortfolioPage />}
                {activeTab === 'new-projects' && <NewProjectsPage />}
                {activeTab === 'analytics' && <AnalyticsPage />}
                {activeTab === 'payments' && <PaymentsPage />}
                {activeTab === 'documents' && <DocumentsPage />}
                {activeTab === 'messages' && <MessagesPage />}
                {activeTab === 'profile' && <ProfilePage />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
