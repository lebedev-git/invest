import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Edit2, Eye, Plus, Trash2 } from 'lucide-react';
import { Deal, useDeals } from '../../context/DealContext';
import { cleanLabel } from '../../utils/dealDisplay';
import { getInvestorsTotal, getAnnualRent, getPaybackYears } from '../../utils/dealMetrics';
import { money } from '../../utils/format';
import { LoadingState, ErrorState } from '../../components/AsyncState';

const label = (value?: string) => cleanLabel(value, '—');

export default function AdminDeals() {
  const { deals, deleteDeal, loading, error, reload } = useDeals();
  const navigate = useNavigate();

  const startCreate = () => {
    navigate('/deals/create');
  };

  const startEdit = (deal: Deal) => {
    navigate(`/deals/${deal.id}/edit`);
  };

  const openView = (deal: Deal) => {
    navigate(`/deals/${deal.id}`);
  };

  const confirmDelete = (deal: Deal) => {
    const confirmation = window.prompt(`Для удаления сделки введите ее название: ${deal.name}`);
    if (confirmation === deal.name) deleteDeal(deal.id);
  };

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-line shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight uppercase">Создание сделок</h1>
          <p className="text-slate-500 font-medium text-xs mt-1">Панель управления инвестиционными сделками. Добавляйте и редактируйте параметры активов.</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={16} /> Создать сделку
        </button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && deals.length === 0 ? (
        <LoadingState label="Загрузка сделок…" />
      ) : deals.length === 0 ? (
        <div className="card p-10 text-center text-slate-500 text-sm font-semibold">Сделок пока нет — создайте первую.</div>
      ) : (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {deals.map(deal => {
          const annualRent = getAnnualRent(deal);
          const payback = getPaybackYears(deal);
          const investorsTotal = getInvestorsTotal(deal);

          return (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-2xl border border-line p-6 shadow-sm flex flex-col gap-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-surface-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{label(deal.type)}</span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest text-emerald-300">{label(String(deal.status))}</span>
                  </div>
                  <h2 onClick={() => openView(deal)} className="text-lg font-black text-slate-100 leading-tight cursor-pointer hover:text-emerald-600 transition-colors">{deal.name}</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1">{deal.city}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openView(deal)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all" title="Открыть">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => startEdit(deal)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Редактировать">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => confirmDelete(deal)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all" title="Удалить">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Metric label="Цена" value={money(deal.metrics ? deal.metrics.objectPrice : (deal.purchasePrice || deal.invested))} />
                <Metric label="Аренда / год" value={money(deal.metrics ? deal.metrics.totalRentalFlow * 12 : annualRent)} />
                <Metric label="Налог / год" value={money(deal.metrics ? deal.metrics.taxes * 12 : deal.propertyTaxAnnual)} />
                <Metric label="Окупаемость" value={
                  deal.metrics 
                    ? (typeof deal.metrics.paybackYears === 'number' ? `${deal.metrics.paybackYears.toFixed(1)} лет` : String(deal.metrics.paybackYears))
                    : (payback ? `${payback.toFixed(1)} лет` : '—')
                } accent={deal.metrics ? (typeof deal.metrics.paybackYears === 'number') : Boolean(payback)} />
              </div>

              <div className="flex flex-wrap gap-2">
                {deal.areaSqm ? <ModulePill label={`${deal.areaSqm} м²`} /> : null}
                {deal.metrics?.roe ? <ModulePill label={`ROE: ${deal.metrics.roe.toFixed(1)}%`} /> : null}
                {deal.metrics?.cashFlow ? <ModulePill label={`CF: ${money(deal.metrics.cashFlow)}/мес`} /> : null}
                {deal.metrics?.investmentSum ? <ModulePill label={`Инвестиции: ${money(deal.metrics.investmentSum)}`} /> : null}
                {investorsTotal ? <ModulePill label={`Участники: ${money(investorsTotal)}`} /> : null}
                {deal.cadastralNumber ? <ModulePill label={deal.cadastralNumber} /> : null}
              </div>
            </motion.div>
          );
        })}
      </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent, dark }: { label: string; value: string; accent?: boolean; dark?: boolean }) {
  return (
    <div className={`${dark ? 'bg-white/5 border-white/10' : 'bg-surface-2 border-line'} border rounded-xl p-3`}>
      <p className={`text-[9px] uppercase font-black tracking-widest mb-1 ${dark ? 'text-white/40' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-sm font-black tabular-nums ${accent ? 'text-emerald-500' : dark ? 'text-white' : 'text-slate-100'}`}>{value}</p>
    </div>
  );
}

function ModulePill({ label }: { label: string }) {
  return <span className="px-2.5 py-1 rounded-lg bg-surface-2 border border-line text-[10px] font-bold text-slate-500">{label}</span>;
}

