import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';

const AdminDashboard = lazy(() => import('../../features/admin/pages/AdminDashboard'));
const AdminStats = lazy(() => import('../../features/admin/pages/AdminStats'));
const AdminSuffixSettings = lazy(() => import('../../features/admin/pages/AdminSuffixSettings'));

interface AdminRoutesProps {
  isAdmin: boolean;
}

export const useAdminRoutes = ({ isAdmin }: AdminRoutesProps) => {
  return (
    <>
      <Route 
        path="/system-stats" 
        element={
          <ProtectedRoute>
            {isAdmin ? <AdminStats /> : <div className="p-8 text-center">Access Denied</div>}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/suffix" 
        element={
          <ProtectedRoute>
            {isAdmin ? <AdminSuffixSettings /> : <div className="p-8 text-center">Access Denied</div>}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            {isAdmin ? <AdminDashboard /> : <div className="p-8 text-center">Access Denied</div>}
          </ProtectedRoute>
        } 
      />
    </>
  );
};
