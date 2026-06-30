import { motion } from 'motion/react';
import { Wallet, TrendingUp, Target, Download } from 'lucide-react';
import { Deal, useDeals } from '../../context/DealContext';
import { cleanLabel } from '../../utils/dealDisplay';
import { getDealCapital, getNetAnnualFlow, getPaybackYears } from '../../utils/dealMetrics';
import { formatRub, formatMln, formatSignedRub } from '../../utils/format';
import { getInvestedDeals } from './helpers';

// Палитра для диаграмм (hex — нужен для SVG-обводки и легенды).
const CHART_COLORS = ['#10b981', '#2563eb', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

// Разбивка капитала портфеля по произвольному ключу (тип/город).
const buildBreakdown = (deals: Deal[], keyFn: (deal: Deal) => string, total: number) =>
  Object.values(
    deals.reduce<Record<string, { label: string; amount: number }>>((acc, deal) => {
      const label = keyFn(deal) || 'Другое';
      acc[label] = acc[label] || { label, amount: 0 };
      acc[label].amount += getDealCapital(deal);
      return acc;
    }, {}),
  )
    .map(item => ({ ...item, percent: total > 0 ? (item.amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);

export const AnalyticsPage = () => {
  const { deals } = useDeals();
  const portfolioDeals = getInvestedDeals(deals);

  // Базовые агрегаты портфеля.
  const totalInvested = portfolioDeals.reduce((sum, deal) => sum + getDealCapital(deal), 0);
  const totalPaid = portfolioDeals.reduce((sum, deal) => sum + (deal.paidOut || 0), 0);
  const totalAnnualFlow = portfolioDeals.reduce((sum, deal) => sum + getNetAnnualFlow(deal), 0);
  const portfolioRoe = totalInvested > 0 ? (totalAnnualFlow / totalInvested) * 100 : 0;
  const returnPct = totalInvested > 0 ? (totalPaid / totalInvested) * 100 : 0;

  // Показатели по каждому объекту.
  const objectRows = portfolioDeals.map(deal => {
    const capital = getDealCapital(deal);
    const netAnnual = getNetAnnualFlow(deal);
    return {
      id: deal.id,
      name: deal.name,
      city: cleanLabel(deal.city),
      capital,
      netAnnual,
      roe: capital > 0 ? (netAnnual / capital) * 100 : 0,
      payback: getPaybackYears(deal),
    };
  });

  const profitableCount = objectRows.filter(row => row.netAnnual > 0).length;
  const flowsSorted = [...objectRows].sort((a, b) => b.netAnnual - a.netAnnual);
  const maxAbsFlow = objectRows.reduce((max, row) => Math.max(max, Math.abs(row.netAnnual)), 0);

  // Окупаемость (только объекты, которые окупаются), плюс счётчик дотационных.
  const paybackRows = objectRows
    .filter(row => row.payback !== null)
    .sort((a, b) => (a.payback as number) - (b.payback as number));
  const maxPayback = paybackRows.reduce((max, row) => Math.max(max, row.payback as number), 0);
  const subsidizedCount = objectRows.filter(row => row.payback === null).length;

  // Структура портфеля по типам и по городам.
  const byType = buildBreakdown(portfolioDeals, deal => cleanLabel(deal.type), totalInvested);
  const byCity = buildBreakdown(portfolioDeals, deal => cleanLabel(deal.city) || 'Не указан', totalInvested);

  const kpis = [
    { icon: Wallet, label: 'Капитал в работе', value: totalInvested ? formatMln(totalInvested) : '—', accent: 'text-slate-100', sub: `${portfolioDeals.length} объект(ов) в портфеле` },
    { icon: TrendingUp, label: 'Чистый поток / год', value: totalAnnualFlow ? formatSignedRub(totalAnnualFlow) : '—', accent: totalAnnualFlow < 0 ? 'text-rose-400' : 'text-[#10b981]', sub: `${profitableCount} из ${portfolioDeals.length} прибыльны` },
    { icon: Target, label: 'Доходность (ROE)', value: `${portfolioRoe.toFixed(1)}%`, accent: portfolioRoe < 0 ? 'text-rose-400' : 'text-[#10b981]', sub: 'на вложенный капитал' },
    { icon: Download, label: 'Возврат капитала', value: `${returnPct.toFixed(0)}%`, accent: 'text-slate-100', sub: `выплачено ${formatRub(totalPaid)}` },
  ];

  // Геометрия пончиковой диаграммы.
  const DONUT_R = 54;
  const DONUT_CIRC = 2 * Math.PI * DONUT_R;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Аналитика портфеля</h2>
        <p className="text-slate-500 font-medium">Глубокий разрез по вашим реальным сделкам: доходность, окупаемость и структура капитала.</p>
      </div>

      {portfolioDeals.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 font-medium text-sm">
          Пока нет данных для аналитики. Добавьте сделки с вложениями — графики появятся автоматически.
        </div>
      ) : (
        <>
          {/* KPI-полоса */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(kpi => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="card p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center shrink-0">
                      <Icon size={16} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-tight">{kpi.label}</span>
                  </div>
                  <p className={`text-2xl font-black tabular-nums ${kpi.accent}`}>{kpi.value}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{kpi.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Доходность по объектам + структура по типам */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 card p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight">Доходность по объектам</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-3">
                  <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-[#10b981]"></i> прибыль</span>
                  <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-rose-500"></i> убыток</span>
                </span>
              </div>
              {maxAbsFlow > 0 ? (
                <div className="flex flex-col gap-3">
                  {flowsSorted.map(row => {
                    const positive = row.netAnnual >= 0;
                    const width = Math.max(2, (Math.abs(row.netAnnual) / maxAbsFlow) * 100);
                    return (
                      <div key={row.id} className="flex items-center gap-3">
                        <div className="w-28 sm:w-36 shrink-0 text-right">
                          <p className="text-xs font-bold text-slate-200 truncate" title={row.name}>{row.name}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">{row.city || '—'}</p>
                        </div>
                        <div className="flex-1 h-7 bg-surface-2 rounded-lg overflow-hidden">
                          <div
                            className={`h-full rounded-lg transition-all ${positive ? 'bg-[#10b981]' : 'bg-rose-500'}`}
                            style={{ width: `${width}%` }}
                          ></div>
                        </div>
                        <div className="w-28 shrink-0 text-right">
                          <p className={`text-xs font-bold font-mono ${positive ? 'text-[#10b981]' : 'text-rose-400'}`}>{formatSignedRub(row.netAnnual)}</p>
                          <p className="text-[9px] text-slate-500 font-mono">{row.roe.toFixed(1)}% ROE</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 font-medium">Нет рассчитанного денежного потока по объектам.</div>
              )}
            </div>

            <div className="col-span-12 lg:col-span-4 card p-6 flex flex-col">
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight mb-4">Структура по типам</h3>
              {byType.length ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-44 h-44">
                    <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                      <circle cx="70" cy="70" r={DONUT_R} fill="none" stroke="currentColor" strokeWidth="18" className="text-surface-2" />
                      {(() => {
                        let acc = 0;
                        return byType.map((item, idx) => {
                          const frac = item.percent / 100;
                          const seg = (
                            <circle
                              key={item.label}
                              cx="70" cy="70" r={DONUT_R}
                              fill="none"
                              stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                              strokeWidth="18"
                              strokeDasharray={`${frac * DONUT_CIRC} ${DONUT_CIRC}`}
                              strokeDashoffset={-acc * DONUT_CIRC}
                            />
                          );
                          acc += frac;
                          return seg;
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-black">Капитал</span>
                      <span className="text-lg font-black text-slate-100 tabular-nums leading-none mt-0.5">{formatMln(totalInvested)}</span>
                    </div>
                  </div>
                  <div className="w-full space-y-2.5">
                    {byType.map((item, idx) => (
                      <div key={item.label} className="flex items-center gap-2.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                        <span className="text-slate-300 font-medium flex-1 truncate" title={item.label}>{item.label}</span>
                        <span className="text-slate-500 font-mono">{formatMln(item.amount)}</span>
                        <span className="font-bold text-slate-200 w-9 text-right">{item.percent.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500 font-medium py-10">Нет активов в портфеле.</div>
              )}
            </div>
          </div>

          {/* Окупаемость объектов + возврат капитала и география */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-7 card p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight">Окупаемость объектов</h3>
                {subsidizedCount > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">{subsidizedCount} требуют дотаций</span>
                )}
              </div>
              {paybackRows.length ? (
                <div className="flex flex-col gap-3">
                  {paybackRows.map(row => {
                    const years = row.payback as number;
                    const width = maxPayback > 0 ? Math.max(4, (years / maxPayback) * 100) : 0;
                    const color = years <= 7 ? 'bg-[#10b981]' : years <= 12 ? 'bg-[#f59e0b]' : 'bg-rose-500';
                    return (
                      <div key={row.id} className="flex items-center gap-3">
                        <div className="w-28 sm:w-36 shrink-0 text-right">
                          <p className="text-xs font-bold text-slate-200 truncate" title={row.name}>{row.name}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">{row.city || '—'}</p>
                        </div>
                        <div className="flex-1 h-6 bg-surface-2 rounded-lg overflow-hidden">
                          <div className={`h-full rounded-lg transition-all ${color}`} style={{ width: `${width}%` }}></div>
                        </div>
                        <span className="w-20 shrink-0 text-right text-xs font-bold font-mono text-slate-200">{years.toFixed(1)} лет</span>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-slate-500 font-medium pt-1">Короче полоса — быстрее окупаемость. Зелёный ≤ 7 лет, жёлтый ≤ 12, красный — дольше.</p>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 font-medium">
                  Ни один объект пока не выходит на положительный денежный поток.
                </div>
              )}
            </div>

            <div className="col-span-12 lg:col-span-5 card p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight">Возврат капитала</h3>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Вложено</p>
                    <p className="text-xl font-black text-slate-100 tabular-nums mt-1">{formatMln(totalInvested)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Выплачено</p>
                    <p className="text-xl font-black text-[#10b981] tabular-nums mt-1">{formatRub(totalPaid)}</p>
                  </div>
                </div>
                <div className="w-full bg-surface-2 h-3 rounded-full overflow-hidden">
                  <div className="bg-[#10b981] h-full rounded-full transition-all" style={{ width: `${Math.min(100, returnPct)}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Возвращено {returnPct.toFixed(1)}% вложенного капитала фактическими выплатами.</p>
              </div>

              <div className="flex flex-col gap-3 border-t border-line pt-5">
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight">География</h3>
                {byCity.map((item, idx) => (
                  <div key={item.label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium truncate" title={item.label}>{item.label}</span>
                      <span className="font-bold text-slate-200">{item.percent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};
