import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X7Logo } from './X7Logo';

const FullScreenLoader = () => (
  <div className="min-h-screen w-full bg-base flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <X7Logo className="w-10 h-10 animate-pulse" />
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Загрузка…</span>
    </div>
  </div>
);

// Гвард маршрутов: требует авторизацию. Приложение работает в режиме «одна сущность»
// (личный портфель владельца), поэтому ролевого разграничения доступа нет.
export default function RoleGuard() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}
