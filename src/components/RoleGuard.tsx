import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../lib/pb';

const FullScreenLoader = () => (
  <div className="min-h-screen w-full bg-base flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center animate-pulse">
        <span className="text-white font-black text-sm">X7</span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Загрузка…</span>
    </div>
  </div>
);

// Гвард маршрутов: требует авторизацию; при указании role — ещё и совпадение роли.
export default function RoleGuard({ role }: { role?: UserRole }) {
  const { isAuthenticated, role: userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && userRole !== role) return <Navigate to="/" replace />;

  return <Outlet />;
}
