import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAppInit } from '../useAppInit';

const About = lazy(() => import('../../features/about/pages/About'));
const AuthPage = lazy(() => import('../../features/auth/pages/AuthPage'));
const ProfilePage = lazy(() => import('../../features/profile/pages/ProfilePage'));
const SettingsPage = lazy(() => import('../../features/settings/pages/SettingsPage'));

interface UserRoutesProps {
  appState: ReturnType<typeof useAppInit>;
}

export const useUserRoutes = ({ appState }: UserRoutesProps) => {
  const { settings, botToken } = appState;

  return (
    <>
      <Route path="/about" element={<About />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <SettingsPage
              settings={settings.settings}
              setSettings={settings.setSettings}
              saveSettings={settings.saveSettings}
              canEditSuffix={settings.canEditSuffix}
              globalDefaultSuffix={settings.globalDefaultSuffix}
              isLoading={settings.isLoading}
            />
          </ProtectedRoute>
        } 
      />
    </>
  );
};
