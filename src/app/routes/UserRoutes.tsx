import React, { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useAppInit } from '../useAppInit';

const AuthPage = lazy(() => import('../../features/auth/pages/AuthPage'));
const ProfilePage = lazy(() => import('../../features/profile/pages/ProfilePage'));
const SettingsPage = lazy(() => import('../../features/settings/pages/SettingsPage'));

interface UserRoutesProps {
  appState: ReturnType<typeof useAppInit>;
}

export const useUserRoutes = ({ appState }: UserRoutesProps) => {
  const { settings, botToken } = appState;
  const { isAdmin } = useAuth();

  return (
    <>
      <Route path="/auth" element={<AuthPage />} />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            {isAdmin ? (
              <Navigate to="/system-stats" replace />
            ) : (
              <ProfilePage />
            )}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            {isAdmin ? (
              <Navigate to="/system-stats" replace />
            ) : (
              <SettingsPage
                settings={settings.settings}
                setSettings={settings.setSettings}
                saveSettings={settings.saveSettings}
                canEditSuffix={settings.canEditSuffix}
                globalDefaultSuffix={settings.globalDefaultSuffix}
                isLoading={settings.isLoading}
              />
            )}
          </ProtectedRoute>
        } 
      />
    </>
  );
};
