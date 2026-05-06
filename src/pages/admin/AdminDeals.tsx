import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Save, X, Edit2, Trash2 } from 'lucide-react';
import { useDeals, Deal } from '../../context/DealContext';

export default function AdminDeals() {
  const { deals, saveDeal, deleteDeal: deleteDealContext } = useDeals();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State for the row currently being added or edited
  const [editFormData, setEditFormData] = useState<Deal>({
    id: '', name: '', type: 'Стрит-ритейл', city: '', targetIrr: '', termDate: '', gracePeriod: '', utilities: '', status: 'Сбор заявок'
  });

  const handleAddClick = () => {
    const newId = Date.now().toString();
    setEditingId(newId);
    setEditFormData({ id: newId, name: '', type: 'Стрит-ритейл', city: '', targetIrr: '', termDate: '', gracePeriod: '', utilities: '', status: 'Сбор заявок' });
  };

  const handleEditClick = (deal: Deal) => {
    setEditingId(deal.id);
    setEditFormData(deal);
  };

  const handleSave = () => {
    saveDeal(editFormData);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deleteDealContext(id);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData({ 
      ...editFormData, 
      [name]: name === 'invested' ? Number(value) : value 
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Управление сделками</h1>
          <p className="text-slate-500 font-medium text-xs mt-1">Добавление и редактирование объектов в формате таблицы</p>
        </div>
        <button 
          onClick={handleAddClick}
          disabled={editingId !== null}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} /> Создать сделку
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="text-[10px] uppercase text-slate-400 font-black bg-slate-50 border-b border-slate-200 tracking-widest">
              <tr>
                <th className="p-4 w-[250px]">Название объекта</th>
                <th className="p-4 w-[180px]">Тип актива</th>
                <th className="p-4 w-[150px]">Локация</th>
                <th className="p-4 w-[120px]">IRR (%)</th>
                <th className="p-4 w-[150px]">Срок (Дата)</th>
                <th className="p-4 w-[120px]">Каникулы</th>
                <th className="p-4 w-[150px]">Коммуналка</th>
                <th className="p-4 w-[120px]">Вложено (₽)</th>
                <th className="p-4 w-[150px]">Статус</th>
                <th className="p-4 w-[120px] text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              <AnimatePresence>
                {/* Render the "New Deal" row at the top if we are adding a new one */}
                {editingId && !deals.find(d => d.id === editingId) && (
                  <EditableRow 
                    formData={editFormData} 
                    onChange={handleChange} 
                    onSave={handleSave} 
                    onCancel={handleCancel} 
                    isNew={true}
                  />
                )}
                
                {deals.map(deal => (
                  editingId === deal.id ? (
                    <EditableRow 
                      key={deal.id}
                      formData={editFormData} 
                      onChange={handleChange} 
                      onSave={handleSave} 
                      onCancel={handleCancel} 
                      isNew={false}
                    />
                  ) : (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={deal.id} 
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-4 font-bold text-slate-900">{deal.name}</td>
                      <td className="p-4 text-slate-600">{deal.type}</td>
                      <td className="p-4 text-slate-600">{deal.city}</td>
                      <td className="p-4 text-emerald-600 font-bold">{deal.targetIrr}</td>
                      <td className="p-4 text-slate-600">{deal.termDate}</td>
                      <td className="p-4 text-slate-600">{deal.gracePeriod || '-'}</td>
                      <td className="p-4 text-slate-600">{deal.utilities || '-'}</td>
                      <td className="p-4 text-slate-900 font-mono font-bold">{deal.invested ? deal.invested.toLocaleString() : '0'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700`}>
                          {deal.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditClick(deal)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(deal.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                ))}
              </AnimatePresence>
              
              {deals.length === 0 && !editingId && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-medium italic">
                    Сделок пока нет. Нажмите «Создать сделку».
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Subcomponent for the editable row
function EditableRow({ formData, onChange, onSave, onCancel, isNew }: any) {
  return (
    <motion.tr 
      initial={{ opacity: 0, backgroundColor: '#f8fafc' }}
      animate={{ opacity: 1, backgroundColor: '#ffffff' }}
      className="border-b-2 border-emerald-500 shadow-[0_4px_20px_-10px_rgba(16,185,129,0.3)] relative z-10"
    >
      <td className="p-2">
        <input 
          name="name" value={formData.name} onChange={onChange} autoFocus
          placeholder="Название..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </td>
      <td className="p-2">
        <select 
          name="type" value={formData.type} onChange={onChange}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        >
          <option value="Стрит-ритейл">Стрит-ритейл</option>
          <option value="ГАБ">ГАБ</option>
          <option value="Склад">Склад</option>
          <option value="Редевелопмент">Редевелопмент</option>
          <option value="Земля">Земля</option>
          <option value="Займ">Займ</option>
        </select>
      </td>
      <td className="p-2">
        <input 
          name="city" value={formData.city} onChange={onChange}
          placeholder="Город..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </td>
      <td className="p-2">
        <input 
          name="targetIrr" value={formData.targetIrr} onChange={onChange}
          placeholder="%"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </td>
      <td className="p-2">
        <input 
          name="termDate" value={formData.termDate || ''} onChange={onChange} type="date"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </td>
      <td className="p-2">
        <input 
          name="gracePeriod" value={formData.gracePeriod || ''} onChange={onChange} type="date"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </td>
      <td className="p-2">
        <input 
          name="utilities" value={formData.utilities || ''} onChange={onChange}
          placeholder="Текст..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </td>
      <td className="p-2">
        <input 
          name="invested" value={formData.invested || ''} onChange={onChange}
          placeholder="Вложено" type="number"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </td>
      <td className="p-2">
        <select 
          name="status" value={formData.status} onChange={onChange}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] uppercase font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        >
          <option value="Сбор заявок">Сбор заявок</option>
          <option value="Сделка">Сделка</option>
          <option value="Регистрация">Регистрация</option>
          <option value="Стройка">Стройка</option>
          <option value="Ремонт">Ремонт</option>
          <option value="Поиск арендатора">Поиск арендатора</option>
          <option value="Аренда">Аренда</option>
          <option value="Продажа">Продажа</option>
          <option value="Закрыта">Закрыта</option>
          <option value="Рассматривается">Рассматривается</option>
        </select>
      </td>
      <td className="p-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={onSave} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all" title="Сохранить">
            <Save size={16} />
          </button>
          <button onClick={onCancel} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-all" title="Отменить">
            <X size={16} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
