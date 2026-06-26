import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import { PortfolioPage, AnalyticsPage, PaymentsPage } from './pages/Portal';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import AdminDeals from './pages/admin/AdminDeals';
import CreateDeal from './pages/admin/CreateDeal';
import ProjectView from './pages/admin/ProjectView';
import RoleGuard from './components/RoleGuard';
import { AuthProvider } from './context/AuthContext';
import { DealProvider } from './context/DealContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DealProvider>
          <Router>
          <Routes>
            {/* Публичный вход */}
            <Route path="/login" element={<Login />} />
            {/* Задание нового пароля по ссылке из письма */}
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Требуется авторизация (одна сущность — все права у любого вошедшего).
                Единый layout: разделы портала и работа со сделками — в одном дереве
                под общим сквозным меню. */}
            <Route element={<RoleGuard />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<PortfolioPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/payments" element={<PaymentsPage />} />

                {/* Работа со сделками */}
                <Route path="/deals" element={<AdminDeals />} />
                <Route path="/deals/create" element={<CreateDeal />} />
                <Route path="/deals/:id" element={<ProjectView />} />
                <Route path="/deals/:id/edit" element={<CreateDeal />} />

                {/* Legacy */}
                <Route path="/admin" element={<Navigate to="/deals" replace />} />
                <Route path="/admin/deals" element={<Navigate to="/deals" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </DealProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
