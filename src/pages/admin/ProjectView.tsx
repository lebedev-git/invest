import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Edit2,
  MapPin,
  Building2,
  Users,
  Receipt,
  FileText,
  UserCircle,
  History,
  Coins,
  ImageIcon,
  Upload,
  Trash2,
  Download,
  Loader2,
  Wallet,
  Plus,
} from 'lucide-react';
import { Deal, Payout, PayoutKind, useDeals } from '../../context/DealContext';
import { statusColor } from '../../utils/dealDisplay';
import { money } from '../../utils/format';
import { DealImageGallery } from '../../components/DealImageGallery';

const FORMAT_LABELS: Record<string, string> = {
  full_ownership: 'Полная собственность',
  fractional_ownership: 'Долевая собственность в объекте',
  legal_entity_share: 'Доля в юридическом лице',
  zpif_units: 'Паи ЗПИФ',
  collateral_loan: 'Займ под залог недвижимости',
  non_collateral_loan: 'Займ без залога',
  investment_participation: 'Инвестиционное участие в проекте',
  partner_syndicate: 'Партнёрская сделка / синдикат',
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU');
};

// Mirrors buildProjectHistory in Portal.tsx — renders the real status timeline
// tracked by DealContext.saveDeal plus a creation event, newest first.
const buildHistory = (deal: Deal) => {
  const statusHistory = deal.statusHistory || [];
  const createdAt = statusHistory[0]?.date || new Date().toISOString();
  const events = [
    { id: 'deal-created', date: createdAt, title: 'Сделка создана', description: deal.name },
    ...statusHistory.map((item, index) => ({
      id: item.id || `${deal.id}-status-${index}`,
      date: item.date,
      title: `Статус: ${item.status}`,
      description: item.comment || `Сделка переведена в статус «${item.status}».`,
    })),
  ];
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

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deals, uploadDealFiles, removeDealFile, fileUrl, payouts, addPayout, deletePayout } = useDeals();
  const deal = deals.find(d => d.id === id);

  if (!deal) {
    return (
      <div className="max-w-[1100px] mx-auto flex flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="text-xl font-black text-slate-100 uppercase tracking-tight">Сделка не найдена</h1>
        <p className="text-sm text-slate-500 font-medium">Возможно, она была удалена или ссылка устарела.</p>
        <button
          onClick={() => navigate('/deals')}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all"
        >
          <ArrowLeft size={16} /> К списку сделок
        </button>
      </div>
    );
  }

  const metrics = deal.metrics;
  const tenants = deal.rent?.tenants || [];
  const history = buildHistory(deal);
  const statusLabel = String(deal.status || '—');

  const opexItems: Array<[string, number | undefined]> = [
    ['Коммунальные платежи', deal.expenses?.utilities],
    ['Эксплуатационные расходы', deal.expenses?.operating],
    ['Налог на имущество', deal.expenses?.propertyTax],
    ['Страхование', deal.expenses?.insurance],
    ['Ремонт и обслуживание', deal.expenses?.maintenance],
    ['Управляющая компания', deal.expenses?.managementCompany],
    ['Бухгалтерия', deal.expenses?.accounting],
    ['Резерв на простой', deal.expenses?.vacancyReserve],
    ['Резерв на ремонт', deal.expenses?.repairReserve],
  ];
  const activeOpex = opexItems.filter(([, value]) => Number(value) > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1100px] mx-auto flex flex-col gap-6"
    >
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/deals')}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-100 transition-all w-fit"
        >
          <ArrowLeft size={16} /> Назад к списку
        </button>
        <button
          onClick={() => navigate(`/deals/${deal.id}/edit`)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-sm w-fit"
        >
          <Edit2 size={14} /> Редактировать
        </button>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-lg bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70">{deal.type}</span>
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusColor(statusLabel)}`}>{statusLabel}</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">{deal.name}</h1>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-white/40 font-bold mt-2">
            <MapPin size={12} /> {deal.city}{deal.address ? ` • ${deal.address}` : ''}
          </p>
          {deal.description && (
            <p className="text-sm text-white/50 mt-4 max-w-2xl leading-relaxed">{deal.description}</p>
          )}

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <HeroMetric label="Сумма инвестиций" value={money(metrics?.investmentSum)} />
            <HeroMetric label="Цена объекта" value={money(metrics?.objectPrice ?? deal.purchasePrice)} />
            <HeroMetric label="Чистый поток (NOI)" value={money(metrics?.noi)} accent />
            <HeroMetric label="Денежный поток / мес" value={money(metrics?.cashFlow)} accent />
            <HeroMetric label="ROE" value={metrics?.roe ? `${metrics.roe.toFixed(1)}%` : '—'} accent />
            <HeroMetric
              label="Окупаемость"
              value={metrics && typeof metrics.paybackYears === 'number' ? `${metrics.paybackYears.toFixed(1)} лет` : '—'}
            />
            <HeroMetric label="Площадь" value={deal.areaSqm ? `${Number(deal.areaSqm).toLocaleString('ru-RU')} м²` : '—'} />
            <HeroMetric label="Cap Rate" value={metrics?.capRate ? `${metrics.capRate.toFixed(1)}%` : '—'} />
            <HeroMetric label="DSCR" value={metrics?.dscr ? metrics.dscr.toFixed(2) : '—'} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Images gallery */}
          <ImagesCard
            deal={deal}
            fileUrl={fileUrl}
            onUpload={files => uploadDealFiles(deal.id, 'images', files)}
            onRemove={name => removeDealFile(deal.id, 'images', name)}
          />

          {/* Object params */}
          <Card icon={Building2} title="Параметры объекта">
            <Row label="Тип объекта" value={deal.type} />
            <Row label="Город" value={deal.city} />
            {deal.address && <Row label="Адрес" value={deal.address} />}
            <Row label="Площадь" value={deal.areaSqm ? `${Number(deal.areaSqm).toLocaleString('ru-RU')} м²` : '—'} />
            <Row label="Цена за м²" value={deal.areaSqm && metrics?.objectPrice ? money(Math.round(metrics.objectPrice / Number(deal.areaSqm))) : '—'} />
            {deal.additional?.floor && <Row label="Этаж" value={deal.additional.floor} />}
            {Number(deal.additional?.electricalPower) > 0 && <Row label="Электромощность" value={`${deal.additional?.electricalPower} кВт`} />}
            {Number(deal.additional?.wetPoints) > 0 && <Row label="Мокрые точки" value={String(deal.additional?.wetPoints)} />}
            {deal.additional?.separateEntrance && <Row label="Отдельный вход" value="Да" />}
            {deal.additional?.parking && <Row label="Парковка" value="Есть" />}
          </Card>

          {/* Tenants */}
          {tenants.length > 0 && (
            <Card icon={Users} title="Арендаторы">
              <div className="flex flex-col gap-3">
                {tenants.map((t, idx) => (
                  <div key={t.id || idx} className="bg-surface-2 border border-line rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-sm font-black text-slate-100">{t.name || `Арендатор #${idx + 1}`}</span>
                      <span className="text-sm font-bold text-emerald-600 font-mono">{money(t.monthlyRent)}/мес</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Number(t.areaSqm) > 0 && <Pill>{Number(t.areaSqm).toLocaleString('ru-RU')} м²</Pill>}
                      {Number(t.ratePerSqm) > 0 && <Pill>{money(t.ratePerSqm)}/м²</Pill>}
                      {t.endDate && <Pill>до {formatDate(t.endDate)}</Pill>}
                      {t.paysUtilities && <Pill>КУ: {t.paysUtilities}</Pill>}
                      {t.vacateRisk && <Pill>риск: {t.vacateRisk}</Pill>}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t border-line">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Общий арендный поток / мес</span>
                  <span className="text-sm font-black text-slate-100 font-mono">{money(metrics?.totalRentalFlow)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* OPEX */}
          {activeOpex.length > 0 && (
            <Card icon={Receipt} title="Ежемесячные расходы (OPEX)">
              {activeOpex.map(([label, value]) => (
                <React.Fragment key={label}>
                  <Row label={label} value={money(value)} />
                </React.Fragment>
              ))}
              {deal.expenses?.taxModel && (
                <Row label="Налоговая модель" value={`${deal.expenses.taxModel === 'usn_income' ? 'УСН «Доходы»' : deal.expenses.taxModel === 'usn_income_expenses' ? 'УСН «Д−Р»' : 'НДФЛ'} · ${deal.expenses.taxRate}%`} />
              )}
            </Card>
          )}

          {/* Documents */}
          <DocumentsCard
            deal={deal}
            fileUrl={fileUrl}
            onUpload={files => uploadDealFiles(deal.id, 'documents', files)}
            onRemove={name => removeDealFile(deal.id, 'documents', name)}
          />

          {/* Payouts */}
          <PayoutsCard
            dealId={deal.id}
            payouts={payouts.filter(p => p.deal === deal.id)}
            onAdd={addPayout}
            onDelete={deletePayout}
          />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Participation format */}
          <Card icon={Coins} title="Формат участия">
            <Row label="Формат" value={FORMAT_LABELS[deal.participationFormat || ''] || deal.participationFormat || '—'} />
            {deal.participationDetails?.sharePercent && <Row label="Доля" value={`${deal.participationDetails.sharePercent}%`} />}
            {deal.participationDetails?.companyName && <Row label="Юрлицо" value={deal.participationDetails.companyName} />}
            {deal.participationDetails?.companySharePercent && <Row label="Доля в компании" value={`${deal.participationDetails.companySharePercent}%`} />}
            {deal.participationDetails?.fundName && <Row label="Фонд" value={deal.participationDetails.fundName} />}
            {deal.participationDetails?.loanAmount && <Row label="Сумма" value={money(deal.participationDetails.loanAmount)} />}
            {deal.participationDetails?.annualRate && <Row label="Ставка" value={`${deal.participationDetails.annualRate}%`} />}
            {deal.participationDetails?.ltvPercent && <Row label="LTV" value={`${deal.participationDetails.ltvPercent}%`} />}
            <Row label="Дата входа" value={formatDate(deal.financials?.purchaseDate)} />
            <Row label="Срок сделки" value={formatDate(deal.termDate)} />
          </Card>

          {/* Manager — placeholder until Supabase */}
          <Card icon={UserCircle} title="Ответственный менеджер">
            <EmptyState text="Привязка инвест-менеджера появится после внедрения ролей и авторизации." />
          </Card>

          {/* History */}
          <Card icon={History} title="История проекта">
            <div className="space-y-4">
              {history.map(event => (
                <div key={event.id} className="grid grid-cols-[76px_1fr] gap-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase pt-0.5">{formatDate(event.date)}</div>
                  <div className="relative pl-4 pb-4 border-l border-line last:pb-0">
                    <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-900"></div>
                    <p className="text-xs font-black text-slate-100 leading-tight">{event.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function HeroMetric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border border-white/10 rounded-2xl p-3 bg-white/5">
      <p className="text-[9px] uppercase text-white/40 font-black mb-1 leading-tight">{label}</p>
      <p className={`text-base font-bold tabular-nums ${accent ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface rounded-3xl border border-line shadow-sm p-6">
      <h3 className="font-black text-slate-100 uppercase tracking-tight text-sm mb-5 flex items-center gap-2">
        <Icon size={16} className="text-slate-400" /> {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-line last:border-0">
      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">{label}</span>
      <span className="text-sm font-bold text-slate-100 text-right">{value}</span>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="px-2.5 py-1 rounded-lg bg-surface border border-line text-[10px] font-bold text-slate-500">{children}</span>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-line rounded-2xl bg-surface-2/50 p-5 text-center">
      <p className="text-xs text-slate-400 font-medium leading-relaxed">{text}</p>
    </div>
  );
}

interface FileCardProps {
  deal: Deal;
  fileUrl: (dealId: string, filename: string, thumb?: string) => string;
  onUpload: (files: File[]) => Promise<void>;
  onRemove: (filename: string) => Promise<void>;
}

// Галерея изображений объекта на странице сделки (только серверные файлы).
function ImagesCard({ deal, fileUrl, onUpload, onRemove }: FileCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (files: File[]) => {
    setError('');
    setBusy(true);
    try {
      await onUpload(files);
    } catch {
      setError('Не удалось загрузить изображения.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (name: string) => {
    setBusy(true);
    try {
      await onRemove(name);
    } catch {
      setError('Не удалось удалить изображение.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card icon={ImageIcon} title="Фотографии объекта">
      <DealImageGallery
        serverImages={deal.images || []}
        resolveUrl={name => fileUrl(deal.id, name, '400x300')}
        onRemoveServer={handleRemove}
        onAddFiles={handleAdd}
        busy={busy}
        error={error}
        emptyText="Фотографий пока нет. Загрузите изображения объекта — они появятся в портфеле инвестора."
      />
    </Card>
  );
}

const formatBytesName = (name: string) => name.replace(/_\w{10}(\.\w+)$/, '$1'); // PB добавляет суффикс к имени

// Список документов сделки с загрузкой/скачиванием/удалением.
function DocumentsCard({ deal, fileUrl, onUpload, onRemove }: FileCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const docs = deal.documents || [];

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError('');
    setBusy(true);
    try {
      await onUpload(Array.from(files));
    } catch {
      setError('Не удалось загрузить документы.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (name: string) => {
    setBusy(true);
    try {
      await onRemove(name);
    } catch {
      setError('Не удалось удалить документ.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card icon={FileText} title="Документы">
      {docs.length > 0 ? (
        <div className="divide-y divide-line mb-4">
          {docs.map(name => (
            <div key={name} className="flex items-center justify-between gap-3 py-3 first:pt-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-surface-2 border border-line text-slate-400 flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <span className="text-sm font-bold text-slate-200 truncate" title={formatBytesName(name)}>{formatBytesName(name)}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={fileUrl(deal.id, name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Скачать"
                  className="w-8 h-8 rounded-lg bg-surface-2 border border-line text-slate-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all flex items-center justify-center"
                >
                  <Download size={14} />
                </a>
                <button
                  onClick={() => handleRemove(name)}
                  disabled={busy}
                  title="Удалить"
                  className="w-8 h-8 rounded-lg bg-surface-2 border border-line text-slate-400 hover:text-rose-400 hover:border-rose-500/50 transition-all flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="Документов пока нет. Загрузите договор, инвест-заявку, отчёт по проверке, выписки." />
      )}

      <input ref={inputRef} type="file" multiple hidden onChange={e => handleFiles(e.target.files)} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full mt-1 py-3 rounded-xl bg-surface-2 border border-line text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:border-emerald-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Загрузить документ
      </button>
      {error && <p className="text-[11px] text-rose-400 font-bold mt-2 text-center">{error}</p>}
    </Card>
  );
}

const PAYOUT_KIND_LABELS: Record<PayoutKind, string> = {
  dividend: 'Дивиденды',
  return: 'Возврат тела',
  other: 'Прочее',
};

// Учёт фактических выплат по сделке: добавление/список/удаление.
function PayoutsCard({ dealId, payouts, onAdd, onDelete }: {
  dealId: string;
  payouts: Payout[];
  onAdd: (payout: Omit<Payout, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<PayoutKind>('dividend');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const total = payouts.reduce((sum, p) => sum + p.amount, 0);

  const handleAdd = async () => {
    setError('');
    const value = Number(String(amount).replace(',', '.').replace(/\s/g, ''));
    if (!date || !value) {
      setError('Укажите дату и сумму выплаты.');
      return;
    }
    setBusy(true);
    try {
      await onAdd({ deal: dealId, date, amount: value, kind, comment: comment.trim() });
      setDate(''); setAmount(''); setComment(''); setKind('dividend');
    } catch {
      setError('Не удалось сохранить выплату.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card icon={Wallet} title="Выплаты">
      {payouts.length > 0 ? (
        <div className="divide-y divide-line mb-4">
          {payouts.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-emerald-600 font-mono">{money(p.amount)}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-surface-2 border border-line rounded px-1.5 py-0.5">{PAYOUT_KIND_LABELS[p.kind]}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(p.date)}{p.comment ? ` · ${p.comment}` : ''}</p>
              </div>
              <button
                onClick={() => onDelete(p.id)}
                title="Удалить"
                className="w-8 h-8 rounded-lg bg-surface-2 border border-line text-slate-400 hover:text-rose-400 hover:border-rose-500/50 transition-all flex items-center justify-center shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Всего выплачено</span>
            <span className="text-sm font-black text-slate-100 font-mono">{money(total)}</span>
          </div>
        </div>
      ) : (
        <EmptyState text="Выплат пока нет. Добавьте фактические выплаты — они появятся в портфеле и реестре инвестора." />
      )}

      <div className="flex flex-col gap-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="field" />
          <input type="text" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Сумма, ₽" className="field" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={kind} onChange={e => setKind(e.target.value as PayoutKind)} className="field">
            <option value="dividend">Дивиденды</option>
            <option value="return">Возврат тела</option>
            <option value="other">Прочее</option>
          </select>
          <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="Комментарий" className="field" />
        </div>
        <button
          onClick={handleAdd}
          disabled={busy}
          className="w-full py-3 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Добавить выплату
        </button>
        {error && <p className="text-[11px] text-rose-400 font-bold text-center">{error}</p>}
      </div>
    </Card>
  );
}
