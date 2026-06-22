import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Portal from './pages/Portal';
import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDeals from './pages/admin/AdminDeals';
import CreateDeal from './pages/admin/CreateDeal';
import ProjectView from './pages/admin/ProjectView';
import RoleGuard from './components/RoleGuard';
import { AuthProvider } from './context/AuthContext';
import { DealProvider } from './context/DealContext';

export default function App() {
  return (
    <AuthProvider>
      <DealProvider>
        <Router>
          <Routes>
            {/* Публичный вход */}
            <Route path="/login" element={<Login />} />

            {/* Требуется авторизация (любая роль) */}
            <Route element={<RoleGuard />}>
              <Route path="/" element={<Portal />} />

              {/* Создание сделок — только инвест-комитет */}
              <Route element={<RoleGuard role="committee" />}>
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
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </DealProvider>
    </AuthProvider>
  );
}
