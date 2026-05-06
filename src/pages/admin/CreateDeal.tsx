import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Save, Image as ImageIcon, MapPin, DollarSign, Calendar, Target, Plus } from 'lucide-react';
import { useDeals } from '../../context/DealContext';
import { useNavigate } from 'react-router-dom';

export default function CreateDeal() {
  const { saveDeal } = useDeals();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    type: 'Стрит-ритейл',
    city: '',
    status: 'Сбор',
    targetIrr: '',
    termDate: '',
    gracePeriod: '',
    utilities: '',
    description: '',
    strategy: '',
    invested: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const newDeal = {
      id: Date.now().toString(),
      name: formData.name || 'Новая сделка',
      type: formData.type,
      city: formData.city || 'Не указан',
      status: formData.status,
      targetIrr: formData.targetIrr || '0',
      termDate: formData.termDate,
      gracePeriod: formData.gracePeriod,
      utilities: formData.utilities,
      description: formData.description,
      strategy: formData.strategy,
      invested: Number(formData.invested) || 0,
      share: 0
    };
    
    saveDeal(newDeal);
    navigate('/admin/deals');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto flex flex-col gap-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Новая сделка</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Добавление объекта для синдицирования на платформу</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/admin/deals')}
            className="px-5 py-2.5 bg-white text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            Отмена
          </button>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Save size={16} /> Создать сделку
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-12">
        {/* Left Column: Main info */}
        <div className="xl:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
            <h2 className="text-sm font-black uppercase text-slate-900 tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 relative z-10">
              <Target size={18} className="text-emerald-500" /> Основные параметры
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Название объекта</label>
                <input 
                  name="name" value={formData.name} onChange={handleChange}
                  placeholder="Например: Street Retail «Октябрь»"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Тип актива</label>
                <select 
                  name="type" value={formData.type} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="Стрит-ритейл">Стрит-ритейл</option>
                  <option value="ГАБ">ГАБ (Готовый арендный бизнес)</option>
                  <option value="Склад">Склад / Self Storage</option>
                  <option value="Редевелопмент">Редевелопмент</option>
                  <option value="Земля">Земля</option>
                  <option value="Займ">Займ под залог</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Локация (Город, Район)</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    name="city" value={formData.city} onChange={handleChange}
                    placeholder="Москва, ЦАО"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
            <h2 className="text-sm font-black uppercase text-slate-900 tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 relative z-10">
              <DollarSign size={18} className="text-blue-500" /> Финансовая модель
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Доходность (IRR %)</label>
                <input 
                  name="targetIrr" value={formData.targetIrr} onChange={handleChange}
                  placeholder="24.5"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono placeholder:text-slate-300 placeholder:font-sans"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Срок (Дата)</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    name="termDate" value={formData.termDate} onChange={handleChange} type="date"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Каникулы</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    name="gracePeriod" value={formData.gracePeriod} onChange={handleChange} type="date"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Коммуналка</label>
                <input 
                  name="utilities" value={formData.utilities} onChange={handleChange}
                  placeholder="По счетчикам"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <h2 className="text-sm font-black uppercase text-slate-900 tracking-widest mb-6 mt-8 flex items-center gap-2 border-b border-slate-100 pb-4 relative z-10">
              <DollarSign size={18} className="text-emerald-500" /> Текущие инвестиции
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Вложено (₽)</label>
                <input 
                  name="invested" value={formData.invested} onChange={handleChange} type="number"
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono placeholder:text-slate-300 placeholder:font-sans"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-black uppercase text-slate-900 tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              Описание и стратегия
            </h2>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Короткое описание (для витрины)</label>
                <textarea 
                  name="description" value={formData.description} onChange={handleChange}
                  rows={2}
                  placeholder="Действующий складской комплекс с якорным арендатором..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none placeholder:text-slate-300 placeholder:font-medium"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Стратегия проекта</label>
                <textarea 
                  name="strategy" value={formData.strategy} onChange={handleChange}
                  rows={4}
                  placeholder="Покупка объекта, проведение косметического ремонта, разделение на лоты..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none placeholder:text-slate-300 placeholder:font-medium leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Meta & Media */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full"></div>
            <h2 className="text-sm font-black uppercase text-white tracking-widest mb-6 border-b border-slate-800 pb-4 relative z-10">
              Публикация
            </h2>
            <div className="flex flex-col gap-5 relative z-10">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Статус сделки</label>
                <select 
                  name="status" value={formData.status} onChange={handleChange}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="Сбор заявок" className="text-slate-900">Сбор заявок</option>
                  <option value="Сделка" className="text-slate-900">Сделка</option>
                  <option value="Регистрация" className="text-slate-900">Регистрация</option>
                  <option value="Стройка" className="text-slate-900">Стройка</option>
                  <option value="Ремонт" className="text-slate-900">Ремонт</option>
                  <option value="Поиск арендатора" className="text-slate-900">Поиск арендатора</option>
                  <option value="Аренда" className="text-slate-900">Аренда</option>
                  <option value="Продажа" className="text-slate-900">Продажа</option>
                  <option value="Закрыта" className="text-slate-900">Закрыта</option>
                  <option value="Рассматривается" className="text-slate-900">Рассматривается</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                В статусе "Сбор заявок" проект автоматически появится на витрине "Новые проекты" у всех партнеров.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-black uppercase text-slate-900 tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <ImageIcon size={18} className="text-slate-400" /> Медиа
            </h2>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:text-emerald-500 transition-all">
                 <Plus size={24} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">Загрузить обложку</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">PNG, JPG до 5 MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
