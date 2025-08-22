import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { RoleGuard } from './components/layout/RoleGuard';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Budgets } from './pages/Budgets';
import { BudgetDetail } from './pages/BudgetDetail';
import { Expenses } from './pages/Expenses';
import { Approvals } from './pages/Approvals';
import { Analytics } from './pages/Analytics';
import { Departments } from './pages/Departments';
import { Categories } from './pages/Categories';
import { Users } from './pages/Users';
import { Profile } from './pages/Profile';
import { Notifications } from './pages/Notifications';
import { useAuth } from './context/AuthContext';
import { Spinner } from './components/ui/Spinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/budgets/:id" element={<BudgetDetail />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route 
          path="/approvals" 
          element={
            <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
              <Approvals />
            </RoleGuard>
          } 
        />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route 
          path="/departments" 
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <Departments />
            </RoleGuard>
          } 
        />
        <Route 
          path="/categories" 
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <Categories />
            </RoleGuard>
          } 
        />
        <Route 
          path="/users" 
          element={
            <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
              <Users />
            </RoleGuard>
          } 
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;