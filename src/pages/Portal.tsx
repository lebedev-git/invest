/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Calendar, 
  MapPin, 
  Layers, 
  ArrowUpRight, 
  Info,
  ChevronRight,
  Download,
  PieChart,
  Activity,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDeals, Deal } from '../context/DealContext';

// Types are imported from DealContext

// --- Mock Data ---
// Mock data removed, now using DealContext

const STATUS_COLORS: Record<string, string> = {
  'Сбор заявок': 'bg-purple-100 text-purple-700',
  'Сделка': 'bg-sky-100 text-sky-700',
  'Регистрация': 'bg-blue-100 text-blue-700',
  'Стройка': 'bg-amber-100 text-amber-700',
  'Ремонт': 'bg-orange-100 text-orange-700',
  'Поиск арендатора': 'bg-indigo-100 text-indigo-700',
  'Аренда': 'bg-emerald-100 text-emerald-700',
  'Продажа': 'bg-rose-100 text-rose-700',
  'Завершен': 'bg-slate-100 text-slate-700',
  'Закрыта': 'bg-slate-100 text-slate-700',
  'Рассматривается': 'bg-slate-100 text-slate-500',
};

// --- Components ---

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Header = ({ activeTab, setActiveTab }: HeaderProps) => (
  <header className="flex flex-col md:flex-row justify-between items-center bg-white px-8 py-4 rounded-2xl shadow-sm border border-slate-200 gap-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-xl">X7</span>
      </div>
      <div className="flex flex-col">
        <h1 className="text-lg font-bold tracking-tight leading-none uppercase text-slate-900">Invest Syndicate</h1>
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Partner Portal v1.0</span>
      </div>
    </div>
    <nav className="flex gap-4 sm:gap-8 items-center">
      <button 
        onClick={() => setActiveTab('portfolio')}
        className={`text-sm font-semibold py-1 transition-all ${activeTab === 'portfolio' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
      >
        Портфель
      </button>
      <button 
        onClick={() => setActiveTab('new-projects')}
        className={`text-sm font-semibold py-1 transition-all ${activeTab === 'new-projects' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
      >
        Новые проекты
      </button>
      <div className="hidden sm:block h-8 w-px bg-slate-200 mx-2"></div>
      <button 
        onClick={() => setActiveTab('profile')}
        className={`flex items-center gap-3 p-1 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-slate-50 ring-1 ring-slate-200' : 'hover:bg-slate-50'}`}
      >
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-slate-900">Александр В.</p>
          <p className="text-[10px] text-slate-400">Premium Partner</p>
        </div>
        <div className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center ${activeTab === 'profile' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
           <User size={20} />
        </div>
      </button>
    </nav>
  </header>
);

const ProfilePage = () => {
  const [formData, setFormData] = useState({
    fullName: 'Александр Варшавский',
    email: 'a.varshavsky@example.com',
    phone: '+7 (995) 123-45-67',
    tg: '@alex_invest',
    inn: '770123456789',
    status: 'IE', // Individual Entrepreneur
    bank: 'AO "TINKOFF BANK"',
    account: '40817810000001234567',
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Личный кабинет</h2>
          <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest">Профиль партнера X7-S-2405</p>
        </div>
        <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
          Верифицирован
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-2">
              <User size={20} className="text-slate-400" /> Основная информация
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ФИО полностью</label>
                <input 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email для отчетов</label>
                <input 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Телефон</label>
                <input 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telegram ID</label>
                <input 
                  name="tg"
                  value={formData.tg}
                  onChange={handleChange}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-2">
              <Wallet size={20} className="text-slate-400" /> Юридические и банковские данные
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Статус плательщика</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none appearance-none"
                >
                  <option value="FL">Физ. лицо</option>
                  <option value="IE">ИП</option>
                  <option value="LE">Юр. лицо</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ИНН</label>
                <input 
                  name="inn"
                  value={formData.inn}
                  onChange={handleChange}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Реквизиты для выплат (Банк/Счет)</label>
                <div className="flex gap-4">
                  <input 
                    name="bank"
                    value={formData.bank}
                    placeholder="Название банка"
                    onChange={handleChange}
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                  />
                  <input 
                    name="account"
                    value={formData.account}
                    placeholder="Расчетный счет"
                    onChange={handleChange}
                    className="flex-[1.5] bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full"></div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 italic opacity-80">Инвест-анкета</h3>
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
                <button className="w-full py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all">
                  Сохранить профиль
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm italic text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              Все изменения профиля проходят модерацию юридическим отделом. Обновленные реквизиты вступят в силу после 
              завершения текущего расчетного периода.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PortfolioPage = () => (
  <AnimatePresence mode="wait">
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-12 auto-rows-min gap-6"
    >
      <SummaryCard />
      <AssetAllocation />
      <PaymentsCalendar />
      <ProjectsTable />
      <NewsFeed />
    </motion.div>
  </AnimatePresence>
);

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
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Новые инвестиционные возможности</h2>
        <p className="text-slate-500 font-medium">Эксклюзивные предложения, отобранные аналитическим отделом X7 Invest</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeDeals.length > 0 ? activeDeals.map((lot: any, idx: number) => (
          <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col gap-6 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${idx % 3 === 0 ? 'bg-purple-500' : idx % 3 === 1 ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
            
            <div className="flex justify-between items-start z-10">
              <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-500 tracking-widest">{lot.type}</span>
              <span className="text-emerald-600 font-black text-lg">{lot.targetIrr}% <span className="text-xs opacity-60">IRR</span></span>
            </div>
            
            <div className="z-10">
              <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{lot.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic">{lot.city}</p>
            </div>
            
            <p className="text-sm text-slate-500 leading-relaxed z-10 line-clamp-3">{lot.description || lot.strategy || 'Подробности по запросу'}</p>
            
            <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-4 z-10">
              <div>
                <p className="text-[9px] uppercase text-slate-400 font-black mb-1">Срок реализации</p>
                <p className="text-sm font-bold text-slate-900 font-mono">{lot.termDate ? new Date(lot.termDate).toLocaleDateString('ru-RU') : 'По запросу'}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase text-slate-400 font-black mb-1">Статус</p>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter">{lot.status}</p>
              </div>
            </div>
            
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg group-hover:bg-emerald-600 group-hover:shadow-emerald-200 transition-all z-10">
              Ознакомиться с материалами
            </button>
          </div>
        )) : (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium italic text-sm">
            Нет доступных объектов для инвестирования.
          </div>
        )}
      </div>
    </motion.div>
  );
};

const formatRub = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₽`;

const parsePercent = (value?: string) => {
  const parsed = Number(String(value || '0').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseMoney = (value?: number | string) => {
  const parsed = Number(String(value || '0').replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatSignedRub = (value: number) => `${value >= 0 ? '+' : '-'}${formatRub(Math.abs(value))}`;

const getInvestedDeals = (deals: Deal[]) => deals.filter(deal => (deal.invested || 0) > 0);

const SummaryCard = () => {
  const { deals } = useDeals();
  const portfolioDeals = getInvestedDeals(deals);
  const totalInvested = portfolioDeals.reduce((sum, deal) => sum + (deal.invested || 0), 0);
  const projectedIncome = portfolioDeals.reduce(
    (sum, deal) => sum + (deal.invested || 0) * (parsePercent(deal.targetIrr) / 100) - parseMoney(deal.utilities) * 12,
    0,
  );
  const paidOut = portfolioDeals.reduce((sum, deal) => sum + (deal.paidOut || 0), 0);
  const projectedReturn = totalInvested > 0 ? (projectedIncome / totalInvested) * 100 : 0;

  return (
  <section className="col-span-12 lg:col-span-4 row-span-2 bg-slate-900 text-white rounded-3xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group">
    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
    <div className="z-10">
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-xs uppercase tracking-widest opacity-60 font-semibold italic">Общий портфель</h2>
        <TrendingUp size={16} className="text-emerald-400" />
      </div>
      <p className="text-4xl lg:text-5xl font-light tabular-nums leading-tight">{formatRub(totalInvested)}</p>
      <p className="text-emerald-400 text-xs mt-2 font-medium flex items-center gap-1">
        <ArrowUpRight size={14} /> {formatSignedRub(projectedIncome)} ({projectedReturn.toFixed(1)}%) <span className="opacity-60 font-normal">прогнозный доход</span>
      </p>
    </div>
    <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/10 pt-4 z-10">
      <div>
        <p className="text-[10px] uppercase opacity-50 mb-1">Фактически выплачено</p>
        <p className="text-lg font-semibold tabular-nums">{formatRub(paidOut)}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase opacity-50 mb-1">Ожидается (план)</p>
        <p className="text-lg font-semibold tabular-nums">{formatRub(projectedIncome)}</p>
      </div>
    </div>
  </section>
  );
};

const ProjectsTable = () => {
  const { deals } = useDeals();
  const portfolioDeals = getInvestedDeals(deals);

  return (
  <section className="col-span-12 lg:col-span-8 row-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
      <div className="flex items-center gap-2">
        <Layers size={18} className="text-slate-400" />
        <h3 className="font-bold text-lg text-slate-900">Мои инвестиции в проекты</h3>
      </div>
      <button className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-all">
        <Download size={14} /> Выгрузить отчёт
      </button>
    </div>
    <div className="flex-1 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead className="text-[10px] uppercase text-slate-400 font-bold bg-white sticky top-0 z-10">
          <tr className="border-b border-slate-50">
            <th className="p-6">Название / Локация</th>
            <th className="p-4 text-center">Статус</th>
            <th className="p-4 text-right">Вложено</th>
            <th className="p-4 text-right text-slate-900">Доходность</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {portfolioDeals.length > 0 ? portfolioDeals.map((project: any) => (
            <motion.tr 
              key={project.id} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-b border-slate-50 hover:bg-slate-50 transition-colors group cursor-pointer"
            >
              <td className="p-6">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-base">{project.name}</span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-tight font-medium mt-1">
                    <MapPin size={10} /> {project.type} • {project.city}
                  </div>
                </div>
              </td>
              <td className="p-4 text-center">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${STATUS_COLORS[project.status] || 'bg-slate-100 text-slate-700'}`}>
                  {project.status}
                </span>
              </td>
              <td className="p-4 text-right font-medium text-slate-700 whitespace-nowrap">
                {project.invested ? project.invested.toLocaleString() : '0'} ₽
              </td>
              <td className="p-4 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-6 group-hover:translate-x-1 transition-transform">
                  <div className="flex flex-col text-right">
                    <span className={`text-sm font-bold tabular-nums ${project.targetIrr && parseFloat(project.targetIrr) > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {project.targetIrr && parseFloat(project.targetIrr) > 0 ? `${project.targetIrr}% IRR` : '—'}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </td>
            </motion.tr>
          )) : (
            <tr>
              <td colSpan={4} className="p-8 text-center text-slate-400 font-medium italic text-sm border-b border-slate-50">
                У вас пока нет активных инвестиций.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
  );
};

const AssetAllocation = () => {
  const { deals } = useDeals();
  const portfolioDeals = getInvestedDeals(deals);
  const totalInvested = portfolioDeals.reduce((sum, deal) => sum + (deal.invested || 0), 0);
  const colors = ['text-slate-900', 'text-emerald-500', 'text-blue-400', 'text-amber-400', 'text-rose-400'];
  const dotColors = ['bg-slate-900', 'bg-emerald-500', 'bg-blue-400', 'bg-amber-400', 'bg-rose-400'];
  const allocation = Object.values(
    portfolioDeals.reduce<Record<string, { label: string; amount: number }>>((acc, deal) => {
      const label = deal.type || 'Другое';
      acc[label] = acc[label] || { label, amount: 0 };
      acc[label].amount += deal.invested || 0;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.amount - a.amount)
    .map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
      dotColor: dotColors[index % dotColors.length],
      percent: totalInvested > 0 ? (item.amount / totalInvested) * 100 : 0,
    }));
  let offset = 0;

  return (
  <section className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
        <PieChart size={16} className="text-slate-400" /> Распределение активов
      </h3>
      <Info size={14} className="text-slate-300 cursor-help" />
    </div>
    <div className="flex-1 flex items-center justify-around">
      <div className="relative w-32 h-32">
        {/* Simplified SVG Ring */}
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          <path className="text-slate-100" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
          {allocation.map(item => {
            const currentOffset = offset;
            offset += item.percent;
            return (
              <path
                key={item.label}
                className={item.color}
                strokeDasharray={`${item.percent}, 100`}
                strokeDashoffset={`-${currentOffset}`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-sm font-bold text-slate-900 leading-none">{portfolioDeals.length}</span>
          <span className="text-[8px] text-slate-400 uppercase font-black">Лотов</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {allocation.map(item => (
          <div key={item.label} className="flex items-center justify-between gap-6 min-w-[80px]">
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 ${item.dotColor} rounded-full`}></div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.label}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-900">{item.percent.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  </section>
  );
};

const PaymentsCalendar = () => (
  <section className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden">
    <div className="flex justify-between items-center">
      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
        <Calendar size={16} className="text-slate-400" /> Календарь выплат
      </h3>
      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded uppercase">Ноябрь</span>
    </div>
    <div className="space-y-3 flex-1 overflow-auto">
      <div className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 group hover:border-emerald-200 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex flex-col items-center justify-center border border-emerald-100 shadow-sm">
            <span className="text-[8px] font-bold text-slate-400 uppercase">Нов</span>
            <span className="text-sm font-black text-slate-900">15</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 italic">Получено</p>
            <p className="text-[10px] text-slate-400 font-medium">Street Retail «Октябрь»</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-emerald-600">+42 500 ₽</span>
        </div>
      </div>
      <div className="flex justify-between items-center p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 group hover:border-slate-300 transition-all">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-lg bg-white flex flex-col items-center justify-center border border-slate-100">
            <span className="text-[8px] font-bold text-slate-400 uppercase">Дек</span>
            <span className="text-sm font-black text-slate-300">01</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">Прогноз выплат</p>
            <p className="text-[10px] text-slate-300 font-medium tracking-tight">Индексация арендной платы</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">План</span>
        </div>
      </div>
    </div>
  </section>
);

const NewsFeed = () => (
  <section className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col group">
    <div className="flex justify-between items-center mb-5">
      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
        <Activity size={16} className="text-slate-400" /> События синдиката
      </h3>
      <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Live Update</span>
    </div>
    <div className="space-y-5 flex-1 overflow-auto">
      <div className="relative pl-5 before:absolute before:left-0 before:top-1 before:bottom-[-20px] before:w-0.5 before:bg-slate-900 group-hover:before:bg-emerald-400 before:transition-colors">
        <div className="flex justify-between items-start mb-0.5">
          <p className="text-xs font-black text-slate-900 leading-tight">Новый лот: Девелопмент САО</p>
          <span className="text-[8px] text-slate-400 font-bold uppercase shrink-0">12:45</span>
        </div>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">Сбор заявок открыт. Ожидаемая доходность (IRR) от 28% годовых.</p>
        <button className="text-[9px] font-bold text-slate-900 uppercase mt-2 flex items-center gap-1 hover:gap-2 transition-all">
          Запросить буклет <ArrowUpRight size={10} />
        </button>
      </div>
      <div className="relative pl-5 before:absolute before:left-0 before:top-1 before:bottom-0 before:w-0.5 before:bg-slate-100">
        <div className="flex justify-between items-start mb-0.5">
          <p className="text-xs font-black text-slate-300 leading-tight">Объект «Восток»: Регистрация</p>
          <span className="text-[8px] text-slate-300 font-bold uppercase shrink-0">Вчера</span>
        </div>
        <p className="text-[10px] text-slate-300 font-medium line-through">Право собственности зафиксировано в Росреестре.</p>
      </div>
    </div>
  </section>
);

// --- Main App ---

export default function Portal() {
  const [activeTab, setActiveTab] = useState('portfolio');

  return (
    <div className="min-h-screen w-full bg-[#f1f3f6] text-slate-900 font-sans p-4 lg:p-8 flex flex-col gap-6 selection:bg-slate-900 selection:text-white">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-[1600px] mx-auto w-full flex-1">
        {activeTab === 'portfolio' && <PortfolioPage />}
        {activeTab === 'new-projects' && <NewProjectsPage />}
        {activeTab === 'profile' && <ProfilePage />}
      </main>

    </div>
  );
}
