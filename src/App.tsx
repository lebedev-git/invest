import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Portal from './pages/Portal';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDeals from './pages/admin/AdminDeals';
import { DealProvider } from './context/DealContext';

export default function App() {
  return (
    <DealProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Portal />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/deals" replace />} />
            <Route path="deals" element={<AdminDeals />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </DealProvider>
  );
}
