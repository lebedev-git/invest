import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, Home, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../Portal';
import { X7Logo } from '../../components/X7Logo';
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse';

const navItemClass = (collapsed: boolean) => ({ isActive }: { isActive: boolean }) =>
  `relative flex items-center gap-3 rounded-xl font-bold transition-all px-4 py-3.5 text-[13px] ${
    collapsed ? 'justify-center' : ''
  } ${isActive ? 'bg-[#10b981]/15 text-[#10b981]' : 'text-slate-400 hover:text-slate-100 hover:bg-surface-2'}`;

export default function AdminLayout() {
  const { signOut } = useAuth();
  const { collapsed, toggle } = useSidebarCollapse();

  return (
    <div className="h-screen w-full bg-base text-slate-100 font-sans flex overflow-hidden selection:bg-emerald-500 selection:text-white">
      <aside className={`flex flex-col shrink-0 bg-surface border-r border-line p-3 transition-[width] duration-200 ${collapsed ? 'w-[76px]' : 'w-64'}`}>
        <div className={`flex items-center mb-6 mt-1 ${collapsed ? 'flex-col gap-3' : 'justify-between gap-3 px-2'}`}>
          {collapsed ? (
            <X7Logo />
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <X7Logo />
              <span className="text-xl font-bold tracking-tight text-slate-100 uppercase truncate">Сделки</span>
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
          <NavLink to="/deals" title={collapsed ? 'Сделки' : undefined} className={navItemClass(collapsed)}>
            <Layers size={18} /> {!collapsed && 'Сделки'}
          </NavLink>
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-6">
          <NavLink
            to="/"
            title={collapsed ? 'На портал' : undefined}
            className={`flex items-center gap-3 rounded-xl text-[13px] font-bold text-emerald-600 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all ${
              collapsed ? 'justify-center px-0 py-3.5' : 'px-4 py-3.5'
            }`}
          >
            <Home size={18} /> {!collapsed && 'На портал'}
          </NavLink>
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
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
