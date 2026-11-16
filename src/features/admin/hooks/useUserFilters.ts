import { useMemo, useState } from 'react';
import { AdminUser, ManagedUser } from '../types';
import {
  isInactive30d,
  isActiveUser,
  isRegularUser,
  toManagedUser,
} from '../utils/adminUtils';

export type StatusFilter = 'all' | 'active' | 'inactive30';
export type SortKey = 'generated' | 'sent' | 'joined' | 'lastActive';
export type SortDir = 'asc' | 'desc';

export interface UseUserFiltersResult {
  search: string;
  setSearch: (v: string) => void;
  status: StatusFilter;
  setStatus: (v: StatusFilter) => void;
  feature: string;
  onFeatureChange?: (v: string) => void;
  setFeature: (v: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  setSort: (key: SortKey) => void;
  toggleSortDir: () => void;
  /** filtered + sorted users, ready to render */
  users: ManagedUser[];
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Search / filter / sort state for the user management screen.
 * Admin accounts are excluded (parity with the previous screen).
 */
export function useUserFilters(rawUsers: AdminUser[]): UseUserFiltersResult {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [feature, setFeature] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('generated');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const users = useMemo(
    () =>
      rawUsers
        .filter(isRegularUser)
        .map(toManagedUser),
    [rawUsers]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = users.filter(u => {
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (status === 'active' && !isActiveUser(u)) return false;
      if (status === 'inactive30' && !isInactive30d(u)) return false;
      if (feature !== 'all' && !u.features.includes(feature)) return false;
      return true;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case 'generated':
          return (a.generated - b.generated) * dir;
        case 'sent':
          return (a.sent - b.sent) * dir;
        case 'joined':
          return ((a.joinedAt ?? 0) - (b.joinedAt ?? 0)) * dir;
        case 'lastActive':
          return ((a.lastActive ?? 0) - (b.lastActive ?? 0)) * dir;
        default:
          return 0;
      }
    });
  }, [users, search, status, feature, sortKey, sortDir]);

  const setSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const toggleSortDir = () => setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setFeature('all');
    setSortKey('generated');
    setSortDir('desc');
  };

  const hasActiveFilters = search.trim() !== '' || status !== 'all' || feature !== 'all';

  return {
    search,
    setSearch,
    status,
    setStatus,
    feature,
    setFeature,
    sortKey,
    sortDir,
    setSort,
    toggleSortDir,
    users: filtered,
    clearFilters,
    hasActiveFilters,
  };
}
