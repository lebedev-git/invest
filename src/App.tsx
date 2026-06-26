import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Portal from './pages/Portal';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import AdminLayout from './pages/admin/AdminLayout';
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

            {/* Требуется авторизация (одна сущность — все права у любого вошедшего) */}
            <Route element={<RoleGuard />}>
              <Route path="/" element={<Portal />} />

              {/* Создание сделок — доступно любому авторизованному */}
              <Route path="/deals" element={<AdminLayout />}>
                <Route index element={<AdminDeals />} />
                <Route path="create" element={<CreateDeal />} />
                <Route path=":id" element={<ProjectView />} />
                <Route path=":id/edit" element={<CreateDeal />} />
              </Route>

              {/* Legacy admin route kept for existing links */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/deals" replace />} />
                <Route path="deals" element={<AdminDeals />} />
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
