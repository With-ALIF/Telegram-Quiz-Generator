import { AdminUser, ManagedUser } from '../types';
import { AVAILABLE_PAGES } from '../constants';
import { ADMIN_EMAILS } from '../../auth/constants';

const isUserAdmin = (user: { role?: string; email?: string }) => {
  if (user.role === 'admin') return true;
  if (user.email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase())) return true;
  return false;
};

export const filterUsers = (users: AdminUser[], searchTerm: string) => {
  return users.filter(user => {
    if (isUserAdmin(user)) return false;

    return user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });
};

export const getRegularUsersCount = (users: AdminUser[]) => {
  return users.filter(user => !isUserAdmin(user)).length;
};

export const isRegularUser = (user: AdminUser) => {
  return !isUserAdmin(user);
};

// seconds epoch -> "Just now" / "12 min ago" / "3 days ago"
export const timeAgo = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '—';
  const diff = Math.max(0, Date.now() / 1000 - seconds);
  if (diff < 60) return 'Just now';
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(months / 12)} yr ago`;
};

/* ------------------------------------------------------------------ */
/* View-model helpers for the user management screen                   */
/* ------------------------------------------------------------------ */

export const ACTIVE_WINDOW_SECONDS = 7 * 24 * 3600;
export const INACTIVE_WINDOW_SECONDS = 30 * 24 * 3600;

export const toManagedUser = (u: AdminUser): ManagedUser => ({
  id: u.id,
  name: u.displayName || (u.email ? u.email.split('@')[0] : 'Anonymous'),
  email: u.email || '',
  avatarUrl: u.photoURL || '',
  role: u.role === 'admin' ? 'admin' : 'user',
  generated: u.stats?.generated ?? 0,
  sent: u.stats?.sent ?? 0,
  features: u.permissions ?? [],
  joinedAt: u.createdAt?.seconds || null,
  lastActive: u.lastActive ?? null,
});

/** Best available "last seen" timestamp: real sign-in, else join date. */
export const activityTimestamp = (u: ManagedUser): number | null =>
  u.lastActive ?? u.joinedAt;

/** green dot = active within the last 7 days */
export const isActiveUser = (u: ManagedUser): boolean => {
  const ts = activityTimestamp(u);
  return ts != null && Date.now() / 1000 - ts <= ACTIVE_WINDOW_SECONDS;
};

/** no known activity in the last 30 days */
export const isInactive30d = (u: ManagedUser): boolean => {
  const ts = activityTimestamp(u);
  return ts == null || Date.now() / 1000 - ts > INACTIVE_WINDOW_SECONDS;
};

export const formatJoined = (ts: number | null): string => {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatActivity = (u: ManagedUser): string => {
  const ts = u.lastActive || u.joinedAt;
  if (ts != null) return `Active ${timeAgo(ts)}`;
  return 'Active recently';
};

export const featureName = (id: string): string =>
  AVAILABLE_PAGES.find(p => p.id === id)?.name ?? id;

/** sent / generated, e.g. 329 of 3311 -> 10 */
export const usagePercent = (u: ManagedUser): number => {
  if (u.generated <= 0) return 0;
  return Math.min(100, Math.round((u.sent / u.generated) * 100));
};

/**
 * 14-point usage trend.
 * Daily activity history is not stored, so this is a linear estimate
 * from the join date up to the real all-time totals (surfaced as
 * "estimated" in the UI title/aria-label).
 */
export const buildSparkline = (u: ManagedUser, points = 14): number[] => {
  const total = u.generated + u.sent;
  if (total <= 0) return new Array(points).fill(0);
  const now = Date.now() / 1000;
  const start = u.joinedAt && u.joinedAt < now ? u.joinedAt : now - 14 * 86400;
  const span = Math.max(now - start, 1);
  return Array.from({ length: points }, (_, i) => {
    const t = (i + 1) / points;
    const elapsed = Math.min(now - start, span * t);
    return Math.max(1, Math.round((total * elapsed) / span));
  });
};

export const exportUsersCsv = (users: ManagedUser[]): void => {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const header = ['Name', 'Email', 'Role', 'Features', 'Generated', 'Sent', 'Usage %', 'Joined', 'Last active'];
  const rows = users.map(u =>
    [
      u.name,
      u.email,
      u.role,
      u.features.map(featureName).join(' | '),
      u.generated,
      u.sent,
      usagePercent(u),
      u.joinedAt ? new Date(u.joinedAt * 1000).toISOString().slice(0, 10) : '',
      u.lastActive ? new Date(u.lastActive * 1000).toISOString() : '',
    ]
      .map(esc)
      .join(',')
  );
  const csv = [header.map(esc).join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `telequiz_users_${Math.floor(Date.now() / 1000)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
