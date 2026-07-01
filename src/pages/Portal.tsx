/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
  ArrowUpRight,
  Activity,
  ArrowLeft,
  Plus,
  Download,
  Wallet,
  Clock,
  Target,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDeals, Deal, Payout } from '../context/DealContext';
import { useTheme } from '../context/ThemeContext';
import { statusColor, cleanLabel } from '../utils/dealDisplay';

// Переключатель тем оформления (Солнце / Луна)
export const ThemeToggle = ({ compact }: { compact?: boolean }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={theme === 'light' ? 'Включить темную тему' : 'Включить светлую тему'}
      className={`flex items-center justify-center rounded-xl border border-line bg-surface-2 text-slate-400 hover:text-slate-100 hover:border-emerald-500/30 transition-all cursor-pointer ${
        compact ? 'w-8 h-8 p-0' : 'px-3 py-2'
      }`}
    >
      {theme === 'light' ? <Moon size={compact ? 14 : 16} /> : <Sun size={compact ? 14 : 16} />}
      {!compact && <span className="text-[10px] font-black uppercase tracking-widest ml-2 hidden sm:inline">Стиль</span>}
    </button>
  );
};
import {
  parseMoney,
  parsePercent,
  getDealCapital,
  getPaybackYears,
} from '../utils/dealMetrics';
import { formatRub, formatMln, formatSignedRub, formatMoic } from '../utils/format';
import { computeDealReturns } from '../utils/returns';

import {
  PROJECT_IMAGE_PLACEHOLDER,
  getStatusBadgeStyle,
  ALLOCATION_STYLES,
  formatCurrency,
  useCurrencyRates,
  getInvestedDeals,
  getProjectedIncome,
  getAnnualProjectedIncome,
  getForecastLabel,
  ForecastControls,
  getDefaultForecastDate,
  getToday,
  PAYOUT_KIND_LABEL,
  type CurrencyCode,
  type ForecastConfig,
} from './portal/helpers';

export const PortfolioPage = () => {
  const [forecastConfig, setForecastConfig] = useState<ForecastConfig>({
    mode: 'year-end',
    customDate: getDefaultForecastDate(),
  });
  const currencyState = useCurrencyRates();
  const { deals } = useDeals();
  // Выбранная сделка живёт в URL (?project=id), а не в локальном стейте — иначе клик
  // по «Главная» (ссылка на «/», уже активную) не сбрасывал бы детальный вид.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProjectId = searchParams.get('project');
  const selectedProject = selectedProjectId ? deals.find(deal => deal.id === selectedProjectId) : undefined;
  const openProject = (id: string) => setSearchParams({ project: id });
  const closeProject = () => setSearchParams({});

  if (selectedProject) {
    return (
      <ProjectDetailPage
        deal={selectedProject}
        forecastConfig={forecastConfig}
        setForecastConfig={setForecastConfig}
        onBack={closeProject}
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
        <ProjectsCards forecastConfig={forecastConfig} onSelectProject={openProject} currencyState={currencyState} setActiveTab={undefined} />
        <PortfolioActivity onSelectProject={openProject} />
        <StatStrip forecastConfig={forecastConfig} />
      </motion.div>
    </AnimatePresence>
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
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${currency === item ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-slate-100'}`}
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
    </section>
  );
};

const AssetAllocation = () => {
  const { deals } = useDeals();
  const navigate = useNavigate();
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
      <button onClick={() => navigate('/analytics')} className="w-full mt-4 py-2.5 rounded-xl bg-surface-2 border border-line text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-surface-2/80 hover:text-slate-100 transition-all flex items-center justify-center cursor-pointer">
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

const paymentStyles: Record<PaymentStatus, { dot: string; card: string; text: string }> = {
  expected: { dot: 'bg-amber-400', card: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-300' },
  paid: { dot: 'bg-emerald-500', card: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-300' },
  overdue: { dot: 'bg-rose-500', card: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-300' },
  closing: { dot: 'bg-slate-400', card: 'bg-surface-2 border-line', text: 'text-slate-300' },
};

// Плитка даты и подпись в списке «ближайшие» — по статусу события.
const PAYMENT_TILE: Record<PaymentStatus, { bg: string; label: string }> = {
  expected: { bg: 'bg-amber-500', label: 'Ожидается' },
  paid: { bg: 'bg-[#00a651]', label: 'Выплачено' },
  overdue: { bg: 'bg-rose-500', label: 'Просрочено' },
  closing: { bg: 'bg-slate-500', label: 'Окончание' },
};

// События календаря: фактические выплаты (зелёные «Выплачено»), плановые выплаты
// графика (жёлтые «Ожидается» / красные «Просрочено» по дате) и реальные даты
// окончания сделок (серые). Без синтетики — всё из реальных данных.
const getPaymentEvents = (deals: Deal[], payouts: Payout[]) => {
  const events: PaymentEvent[] = [];
  const today = getToday();
  const dealName = (id: string) => deals.find(d => d.id === id)?.name || 'Сделка';

  payouts.forEach(payout => {
    const date = new Date(payout.date);
    if (Number.isNaN(date.getTime())) return;
    const kindLabel = PAYOUT_KIND_LABEL[payout.kind] || 'Выплата';
    let status: PaymentStatus;
    let title: string;
    if (payout.status === 'planned') {
      status = date >= today ? 'expected' : 'overdue';
      title = date >= today ? `${kindLabel} (план)` : `${kindLabel} — просрочено`;
    } else {
      status = 'paid';
      title = kindLabel;
    }
    events.push({
      id: `payout-${payout.id}`,
      date,
      dealName: dealName(payout.deal),
      amount: payout.amount,
      status,
      title,
    });
  });

  deals.forEach(deal => {
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
  const { deals, payouts } = useDeals();
  const [expanded, setExpanded] = useState(false);
  const today = getToday();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const events = getPaymentEvents(deals, payouts);
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
            {new Date(viewYear, viewMonth, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="space-y-3">
          {upcoming.length ? upcoming.map(event => {
            const tile = PAYMENT_TILE[event.status];
            return (
              <div key={event.id} title={`${event.dealName}: ${event.title}`} className="flex justify-between items-center gap-2 p-3 bg-surface-2 border border-line rounded-2xl transition-all">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-11 h-11 rounded-xl text-white flex flex-col items-center justify-center shrink-0 leading-tight ${tile.bg}`}>
                    <span className="text-[8px] font-bold uppercase">{event.date.toLocaleDateString('ru-RU', { month: 'short' }).substring(0, 4).toUpperCase().replace('.', '')}</span>
                    <span className="text-sm font-black">{event.date.getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-100 truncate">{event.title}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{event.dealName}</p>
                  </div>
                </div>
                <span className="shrink-0 text-[9px] font-black uppercase tracking-wider text-slate-400 bg-surface px-2.5 py-1.5 rounded-lg border border-line whitespace-nowrap">
                  {tile.label}
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

      <button onClick={() => setExpanded(prev => !prev)} className="w-full mt-4 py-2.5 rounded-xl bg-surface-2 border border-line text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-surface-2/80 hover:text-slate-100 transition-all flex items-center justify-center cursor-pointer">
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
            <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-slate-400"></i> Окончание</span>
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
  const { deals, payouts, fileUrl } = useDeals();
  const portfolioDeals = getInvestedDeals(deals);
  const { currency, rates } = currencyState;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Пересчёт доступности стрелок по позиции скролла (с запасом в 1px на округления).
  const updateArrows = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  React.useEffect(() => {
    updateArrows();
    const onResize = () => updateArrows();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateArrows, portfolioDeals.length]);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="col-span-12 lg:col-span-8 bg-surface border border-line rounded-3xl shadow-lg shadow-black/30 flex flex-col overflow-visible relative">
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
            onScroll={updateArrows}
            className="flex gap-4 overflow-x-auto p-5 scrollbar-none w-full scroll-smooth"
          >
            {portfolioDeals.map(project => {
              const projectedIncome = getProjectedIncome(project, forecastConfig);
              const capital = getDealCapital(project);
              const projectedPercent = capital ? (projectedIncome / capital) * 100 : 0;
              const dealReturns = computeDealReturns(project, payouts.filter(p => p.deal === project.id));
              const paybackYears = getPaybackYears(project);
              const image = project.images?.length
                ? fileUrl(project.id, project.images[0], '400x300')
                : PROJECT_IMAGE_PLACEHOLDER;
              const badgeStyle = getStatusBadgeStyle(project.status);

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
                      <span className={`text-right font-bold font-mono ${projectedIncome < 0 ? 'text-rose-400' : 'text-[#10b981]'}`}>
                        {projectedIncome >= 0 ? '+' : '-'}{formatCurrency(Math.abs(projectedIncome), currency, rates)}
                      </span>

                      <span className="text-slate-400">Доходность (IRR)</span>
                      {dealReturns.xirr !== null ? (
                        <span className={`text-right font-bold ${dealReturns.xirr < 0 ? 'text-rose-400' : 'text-[#10b981]'}`}>
                          {(dealReturns.xirr * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className={`text-right font-bold ${projectedPercent < 0 ? 'text-rose-400' : 'text-slate-400'}`} title="Прогноз: нет даты входа для расчёта реального IRR">
                          {projectedPercent !== 0 ? `${projectedPercent.toFixed(1)}%` : parsePercent(project.targetIrr) > 0 ? `${project.targetIrr}%` : '0.0%'}
                          <span className="text-[8px] text-slate-500 font-normal"> прогноз</span>
                        </span>
                      )}

                      <span className="text-slate-400">MOIC</span>
                      <span className="text-right font-bold text-slate-200 font-mono">
                        {dealReturns.moic !== null ? formatMoic(dealReturns.moic) : '—'}
                      </span>
                    </div>

                    <div className="mt-auto pt-2">
                      <button onClick={(e) => { e.stopPropagation(); onSelectProject(project.id); }} className="w-full py-2 rounded-xl bg-surface-2 border border-line text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:bg-[#10b981] group-hover:text-white group-hover:border-[#10b981] transition-all cursor-pointer">
                        Подробнее
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Стрелки слайдера — вынесены за границы карточки; крайние скрываются. */}
          {canLeft && (
            <button
              onClick={(e) => { e.stopPropagation(); scrollBy(-300); }}
              title="Прокрутить влево"
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-surface border border-line text-slate-500 flex items-center justify-center hover:text-emerald-500 hover:border-[#10b981]/50 shadow-xl transition-all"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {canRight && (
            <button
              onClick={(e) => { e.stopPropagation(); scrollBy(300); }}
              title="Прокрутить вправо"
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-surface border border-line text-slate-500 flex items-center justify-center hover:text-emerald-500 hover:border-[#10b981]/50 shadow-xl transition-all"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Layers size={26} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-slate-200 font-bold text-sm">Сделок пока нет</p>
            <p className="text-slate-500 font-medium text-xs max-w-xs">Создайте первую сделку — она появится в вашем портфеле.</p>
          </div>
          <Link
            to="/deals"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={14} /> Создать сделку
          </Link>
        </div>
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

// Единая лента активности портфеля: смены статусов + фактические выплаты +
// приближающиеся/прошедшие окончания сделок. Собрана из реальных данных.
type ActivityKind = 'status' | 'payout' | 'closing';

interface ActivityItem {
  id: string;
  dealId: string;
  dealName: string;
  date: string;
  kind: ActivityKind;
  title: string;
  comment?: string;
  amount?: number;
  upcoming?: boolean;
}

const ACTIVITY_TONE: Record<ActivityKind, string> = {
  status: 'text-[#10b981] bg-[#10b981]',
  payout: 'text-[#10b981] bg-[#10b981]',
  closing: 'text-slate-400 bg-slate-400',
};

const buildPortfolioActivity = (deals: Deal[], payouts: Payout[]): ActivityItem[] => {
  const now = getToday();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 90); // окончания в пределах 90 дней считаем «приближающимися»
  const dealName = (id: string) => deals.find(d => d.id === id)?.name || 'Сделка';
  const items: ActivityItem[] = [];

  deals.forEach(deal => {
    (deal.statusHistory || []).forEach(item => {
      items.push({
        id: item.id || `${deal.id}-${item.date}`,
        dealId: deal.id,
        dealName: deal.name,
        date: item.date,
        kind: 'status',
        title: cleanLabel(item.status),
        comment: item.comment,
      });
    });

    if (deal.termDate) {
      const end = new Date(deal.termDate);
      if (!Number.isNaN(end.getTime()) && end <= horizon) {
        const upcoming = end >= now;
        items.push({
          id: `${deal.id}-end`,
          dealId: deal.id,
          dealName: deal.name,
          date: deal.termDate,
          kind: 'closing',
          title: upcoming ? 'Скоро окончание сделки' : 'Сделка завершена',
          upcoming,
        });
      }
    }
  });

  // Только фактические выплаты (плановые в ленту активности не попадают).
  payouts.filter(p => p.status !== 'planned').forEach(p => {
    items.push({
      id: `payout-${p.id}`,
      dealId: p.deal,
      dealName: dealName(p.deal),
      date: p.date,
      kind: 'payout',
      title: PAYOUT_KIND_LABEL[p.kind] || 'Выплата',
      amount: p.amount,
    });
  });

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const PortfolioActivity = ({ onSelectProject }: { onSelectProject: (id: string) => void }) => {
  const { deals, payouts } = useDeals();
  const [showAll, setShowAll] = useState(false);
  const allEvents = buildPortfolioActivity(deals, payouts);
  const visible = showAll ? allEvents : allEvents.slice(0, 8);

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
            <Activity size={16} className="text-slate-500" /> События по сделкам
          </h3>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{allEvents.length}</span>
        </div>

        <div className={`space-y-4 ${showAll ? 'max-h-[420px] overflow-y-auto pr-1 scrollbar-none' : ''}`}>
          {visible.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium py-6 text-center">
              Событий пока нет. Они появляются при смене статусов, выплатах и приближении сроков сделок.
            </p>
          ) : (
            visible.map(event => {
              const tone = event.kind === 'closing' && event.upcoming
                ? 'text-amber-400 bg-amber-400'
                : ACTIVITY_TONE[event.kind];
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onSelectProject(event.dealId)}
                  className="w-full text-left relative pl-5 pb-1 border-l border-line last:border-0 last:pb-0 group cursor-pointer"
                >
                  <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor] ${tone}`}></span>

                  <div className="flex justify-between items-start mb-0.5 gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{event.title}</span>
                    <span className="text-[10px] text-slate-500 font-medium shrink-0">{formatEventDate(event.date)}</span>
                  </div>

                  <p className="text-xs font-bold text-slate-100 mt-1 leading-tight group-hover:text-[#10b981] transition-colors">{event.dealName}</p>

                  {event.kind === 'payout' && event.amount !== undefined ? (
                    <p className="text-xs font-bold text-[#10b981] font-mono mt-1">+{formatRub(event.amount)}</p>
                  ) : event.comment ? (
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{event.comment}</p>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {allEvents.length > 8 && (
        <button onClick={() => setShowAll(prev => !prev)} className="w-full mt-5 py-2.5 rounded-xl bg-surface-2 border border-line text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-surface-2/80 hover:text-slate-100 transition-all flex items-center justify-center cursor-pointer">
        {showAll ? 'Свернуть' : 'Все события'}
      </button>
      )}
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
  const totalPaid = portfolioDeals.reduce((sum, deal) => sum + (deal.paidOut || 0), 0);

  const cells = [
    { icon: Wallet, label: 'Общая вложенность', value: totalInvested ? formatMln(totalInvested) : '—', accent: 'text-slate-100' },
    { icon: Download, label: 'Фактически выплачено', value: totalPaid ? formatRub(totalPaid) : '—', accent: 'text-slate-100' },
    { icon: TrendingUp, label: 'Прогноз дохода', value: projectedIncome ? formatSignedRub(projectedIncome) : '—', accent: projectedIncome >= 0 ? 'text-[#10b981]' : 'text-rose-400' },
    { icon: Clock, label: 'Средняя окупаемость', value: avgPayback ? `${avgPayback.toFixed(2)} лет` : '—', accent: 'text-slate-100' },
    { icon: Target, label: 'Средняя доходность (IRR)', value: annualYield ? `${annualYield.toFixed(1)}%` : '—', accent: annualYield < 0 ? 'text-rose-400' : 'text-[#10b981]' },
    { icon: LayoutGrid, label: 'Активные проекты', value: String(portfolioDeals.length), accent: 'text-slate-100' },
  ];

  return (
    <section className="col-span-12 bg-surface border border-line rounded-3xl shadow-lg shadow-black/30 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-line">
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
            <div className="border border-line rounded-2xl p-4 bg-surface-2">
              <p className="text-[9px] uppercase text-slate-500 font-black mb-1">Вложено</p>
              <p className="text-xl font-semibold tabular-nums text-slate-100">{formatRub(capital)}</p>
            </div>
            <div className="border border-line rounded-2xl p-4 bg-surface-2">
              <p className="text-[9px] uppercase text-slate-500 font-black mb-1">Фактически выплачено</p>
              <p className="text-xl font-semibold tabular-nums text-slate-100">{formatRub(deal.paidOut || 0)}</p>
            </div>
            <div className="border border-line rounded-2xl p-4 bg-surface-2">
              <p className="text-[9px] uppercase text-slate-500 font-black mb-1">Прогноз ₽</p>
              <p className={`text-xl font-semibold tabular-nums ${projectedIncome >= 0 ? 'text-emerald-400' : 'text-rose-300'}`}>{formatSignedRub(projectedIncome)}</p>
            </div>
            <div className="border border-line rounded-2xl p-4 bg-surface-2">
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

// Страницы аналитики и выплат вынесены в отдельные модули;
// реэкспорт сохраняет существующие пути импорта (App.tsx и др.).
export { AnalyticsPage } from './portal/AnalyticsPage';
export { PaymentsPage } from './portal/PaymentsPage';
