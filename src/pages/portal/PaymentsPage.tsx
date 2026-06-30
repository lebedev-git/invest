import { motion } from 'motion/react';
import { useDeals } from '../../context/DealContext';
import { formatRub } from '../../utils/format';
import { PAYOUT_KIND_LABEL } from './helpers';

export const PaymentsPage = () => {
  const { deals, payouts } = useDeals();
  const dealName = (id: string) => deals.find(d => d.id === id)?.name || '—';
  // Реальные выплаты из коллекции payouts, новые сверху.
  const rows = [...payouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const total = rows.reduce((sum, p) => sum + p.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-100 tracking-tight">История выплат</h2>
        <p className="text-slate-500 font-medium">Реестр фактических выплат по вашим объектам</p>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-line flex justify-between items-center bg-surface-2/30">
          <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight">Реестр транзакций</h3>
          <span className="text-xs font-bold text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded-lg border border-[#10b981]/20">Всего выплачено: {formatRub(total)}</span>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line text-[10px] font-black uppercase text-slate-500 tracking-wider bg-surface-2/10">
                  <th className="p-4 pl-6">Дата</th>
                  <th className="p-4">Объект</th>
                  <th className="p-4">Тип</th>
                  <th className="p-4 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-sm">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-surface-2 transition-colors">
                    <td className="p-4 pl-6 font-mono text-slate-400">{new Date(row.date).toLocaleDateString('ru-RU')}</td>
                    <td className="p-4 font-bold text-slate-200">{dealName(row.deal)}</td>
                    <td className="p-4 text-slate-400">{PAYOUT_KIND_LABEL[row.kind] || 'Прочее'}{row.comment ? ` · ${row.comment}` : ''}</td>
                    <td className="p-4 text-right font-bold text-[#10b981] font-mono">+{Math.round(row.amount).toLocaleString('ru-RU')} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 font-medium text-sm">
            Выплат пока нет. Добавьте выплаты в карточке сделки — они появятся здесь.
          </div>
        )}
      </div>
    </motion.div>
  );
};
