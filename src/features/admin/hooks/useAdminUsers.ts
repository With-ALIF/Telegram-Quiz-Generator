import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAllUsers } from '../services/adminService';
import { useAuth } from '../../auth/hooks/useAuth';
import { AdminUser } from '../types';
import { filterUsers, getRegularUsersCount } from '../utils/adminUtils';
import { supabase } from '../../../lib/supabase';

export function useAdminUsers() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const isFetchingRef = useRef(false);

  const loadUsers = useCallback(async (isSilent = false) => {
    if (!isAdmin) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isSilent) setLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load admin users:", err);
    } finally {
      if (!isSilent) setLoading(false);
      isFetchingRef.current = false;
    }
  }, [isAdmin]);

  // Initial load
  useEffect(() => { 
    loadUsers(); 
  }, [loadUsers]);

  // Realtime subscription + Polling fallback
  useEffect(() => {
    if (!isAdmin) return;

    // 1. Supabase Realtime Channel for instant push updates
    const channel = supabase
      .channel('admin_dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadUsers(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_permissions' }, () => {
        loadUsers(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_photos' }, () => {
        loadUsers(true);
      })
      .subscribe();

    // 2. Periodic background polling (every 10 seconds) as robust fallback
    const interval = setInterval(() => {
      loadUsers(true);
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [isAdmin, loadUsers]);

  const filteredUsers = filterUsers(users, searchTerm);
  const regularUsersCount = getRegularUsersCount(users);

  return {
    users,
    loading: authLoading || loading,
    searchTerm,
    setSearchTerm,
    filteredUsers,
    regularUsersCount,
    loadUsers
  };
}
