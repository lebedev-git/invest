import { NavLink, Link, Outlet } from 'react-router-dom';
import {
  Home,
  BarChart2,
  Calendar,
  Layers,
  Plus,
  LogOut,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDeals } from '../context/DealContext';
import { useSidebarCollapse } from '../hooks/useSidebarCollapse';
import { ThemeToggle } from '../pages/Portal';
import { X7Logo } from './X7Logo';
import { LoadingState, ErrorState } from './AsyncState';

// Единое сквозное меню на всё приложение: разделы портала и работа со сделками
// живут в одном дереве маршрутов под общим сайдбаром, поэтому меню не пропадает
// и не меняется при переходе в создание сделки.
const NAV = [
  { to: '/', label: 'Главная', icon: Home, end: true },
  { to: '/analytics', label: 'Аналитика', icon: BarChart2, end: false },
  { to: '/payments', label: 'Выплаты', icon: Calendar, end: false },
  { to: '/deals', label: 'Сделки', icon: Layers, end: false },
];

const roleLabel = (role?: string | null) =>
  role === 'committee' ? 'Управляющий счет' : 'Партнёр-инвестор';

const navClass = (collapsed: boolean) => ({ isActive }: { isActive: boolean }) =>
  `relative flex items-center gap-3 rounded-xl font-bold transition-all px-4 py-3.5 text-[13px] ${
    collapsed ? 'justify-center' : ''
  } ${isActive ? 'bg-[#10b981]/15 text-[#10b981]' : 'text-slate-400 hover:text-slate-100 hover:bg-surface-2'}`;

const createClass = (collapsed: boolean) =>
  `flex items-center gap-3 mt-2 rounded-xl text-[13px] font-bold text-emerald-600 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all ${
    collapsed ? 'justify-center px-0 py-3.5' : 'px-4 py-3.5'
  }`;

export default function AppLayout() {
  const { user, role, signOut } = useAuth();
  const { collapsed, toggle } = useSidebarCollapse();
  const { deals, loading, error, reload } = useDeals();

  return (
    <div className="h-screen w-full bg-base text-slate-100 font-sans flex overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Десктопный сайдбар */}
      <aside className={`hidden lg:flex flex-col shrink-0 bg-surface border-r border-line p-3 transition-[width] duration-200 ${collapsed ? 'w-[76px]' : 'w-64'}`}>
        <div className={`flex items-center mb-6 mt-1 ${collapsed ? 'flex-col gap-3' : 'justify-between gap-3 px-2'}`}>
          {collapsed ? (
            <X7Logo />
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <X7Logo />
              <span className="text-xl font-bold tracking-tight text-slate-100 uppercase truncate">Портфель</span>
            </div>
          )}
          <button
            onClick={toggle}
            title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-line bg-surface-2 text-slate-400 hover:text-slate-100 hover:border-emerald-500/30 transition-all cursor-pointer shrink-0"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex flex-col gap-1.5">
          {NAV.map(item => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} title={collapsed ? item.label : undefined} className={navClass(collapsed)}>
                <Icon size={18} /> {!collapsed && item.label}
              </NavLink>
            );
          })}
          <Link to="/deals/create" title={collapsed ? 'Создать сделку' : undefined} className={createClass(collapsed)}>
            <Plus size={18} /> {!collapsed && 'Создать сделку'}
          </Link>
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-6">
          <div className={`flex gap-2 ${collapsed ? 'flex-col items-center' : 'items-center'}`}>
            <ThemeToggle compact />
            <button
              onClick={signOut}
              title="Выйти"
              className={`flex items-center justify-center gap-2 rounded-xl bg-surface-2 border border-line text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-400 hover:border-rose-500/40 transition-all ${
                collapsed ? 'w-8 h-8' : 'flex-1 px-4 py-3'
              }`}
            >
              <LogOut size={14} /> {!collapsed && 'Выйти'}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Мобильная панель */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-surface/90 backdrop-blur border-b border-line px-4 py-3 overflow-x-auto">
          <X7Logo />
          <nav className="flex items-center gap-1">
            {NAV.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isActive ? 'bg-[#10b981]/15 text-[#10b981]' : 'text-slate-400 hover:text-slate-100 hover:bg-surface-2'
                    }`
                  }
                >
                  <Icon size={16} /> {item.label}
                </NavLink>
              );
            })}
            <Link to="/deals/create" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 border border-emerald-500/30 bg-emerald-500/5 whitespace-nowrap">
              <Plus size={16} /> Создать
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle compact />
            <button onClick={signOut} title="Выйти" className="text-slate-500 hover:text-rose-400 transition-colors shrink-0 cursor-pointer">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          <div className="max-w-[1600px] mx-auto w-full">
            {error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : loading && deals.length === 0 ? (
              <LoadingState label="Загрузка…" />
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
