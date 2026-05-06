import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function AdminLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white font-black text-sm">X7</span>
          </div>
          <h1 className="text-sm font-black tracking-tight uppercase leading-none">Syndicate Control</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <p className="text-xs font-bold text-slate-900">Инвест-комитет</p>
               <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Администратор</p>
             </div>
             <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center font-black text-xs uppercase shadow-sm">
                IC
             </div>
          </div>
          <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
          <NavLink to="/" className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-all">
            <LogOut size={14} /> На портал
          </NavLink>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8 relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        <Outlet />
      </main>
    </div>
  );
}
