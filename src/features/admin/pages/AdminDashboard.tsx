import React, { useMemo, useState } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useAdminActions } from '../hooks/useAdminActions';
import { useUserFilters } from '../hooks/useUserFilters';
import { AdminHeader } from '../components/layout/AdminHeader';
import { UserToolbar } from '../components/users/UserToolbar';
import { UserCard } from '../components/users/UserCard';
import { UserSkeleton } from '../components/users/UserSkeleton';
import { BulkActionBar } from '../components/users/BulkActionBar';
import { CreateUserModal } from '../components/management/CreateUserModal';
import { PermissionModal } from '../components/management/PermissionModal';
import { DeleteConfirmModal } from '../components/management/DeleteConfirmModal';
import { ResetPasswordModal } from '../components/management/ResetPasswordModal';
import { AdminUser, ManagedUser } from '../types';
import { AVAILABLE_PAGES } from '../constants';
import { exportUsersCsv, toManagedUser } from '../utils/adminUtils';
import { updateUserPermissions } from '../services/adminService';
import { toast, ToastHost } from '../../../components/ui/Toast';

export default function AdminDashboard() {
  const { loading, users: rawUsers, loadUsers } = useAdminUsers();
  const { loading: actionLoading, handleDelete, handleCreateUser, handleSavePermissions, handleResetPassword } =
    useAdminActions(loadUsers);

  /* Optimistic permission overrides: userId -> permissions.
     Kept until the next refetch confirms server state; rolled back on failure. */
  const [overrides, setOverrides] = useState<Record<string, string[]>>({});

  const displayRaw = useMemo(
    () => rawUsers.map(u => (overrides[u.id] ? { ...u, permissions: overrides[u.id] } : u)),
    [rawUsers, overrides]
  );

  const filters = useUserFilters(displayRaw);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openFeatureUserId, setOpenFeatureUserId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<AdminUser | null>(null);

  const findRaw = (id: string) => displayRaw.find(u => u.id === id);

  const selectedRaw = useMemo(
    () => displayRaw.filter(u => selectedIds.includes(u.id)),
    [displayRaw, selectedIds]
  );

  const commonFeatures = useMemo(() => {
    if (selectedRaw.length === 0) return [];
    const sets = selectedRaw.map(u => new Set(u.permissions ?? []));
    return AVAILABLE_PAGES.filter(page => sets.every(s => s.has(page.id))).map(page => page.id);
  }, [selectedRaw]);

  /* ---------------- selection ---------------- */

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  /* ---------------- inline feature editing (optimistic) ---------------- */

  const handleToggleFeature = async (userId: string, featureId: string, enabled: boolean) => {
    const raw = findRaw(userId);
    if (!raw) return;
    const current = raw.permissions ?? [];
    const next = enabled
      ? Array.from(new Set([...current, featureId]))
      : current.filter(p => p !== featureId);

    setOverrides(prev => ({ ...prev, [userId]: next })); // optimistic update
    try {
      await updateUserPermissions(userId, next);
    } catch {
      setOverrides(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      }); // rollback
      toast.error('Could not save features — changes were reverted.');
    }
  };

  const handleBulkToggleFeature = async (featureId: string, enabled: boolean) => {
    if (selectedRaw.length === 0) return;
    const updates: Record<string, string[]> = {};
    selectedRaw.forEach(u => {
      const current = u.permissions ?? [];
      updates[u.id] = enabled
        ? Array.from(new Set([...current, featureId]))
        : current.filter(p => p !== featureId);
    });

    setOverrides(prev => ({ ...prev, ...updates })); // optimistic update
    try {
      await Promise.all(selectedRaw.map(u => updateUserPermissions(u.id, updates[u.id])));
      toast.success(
        `${enabled ? 'Assigned' : 'Removed'} feature for ${selectedRaw.length} user${selectedRaw.length === 1 ? '' : 's'}.`
      );
    } catch {
      setOverrides(prev => {
        const copy = { ...prev };
        selectedRaw.forEach(u => delete copy[u.id]);
        return copy;
      }); // rollback
      toast.error('Bulk update failed — changes were reverted.');
    }
  };

  /* ---------------- bulk actions ---------------- */

  const handleGenerateReport = async () => {
    if (selectedRaw.length === 0) return;
    setIsExporting(true);
    try {
      // Load the PDF module (and jspdf inside it) only on demand.
      const { generateGlobalUserReportPDF } = await import('../utils/pdfExport');
      await generateGlobalUserReportPDF(selectedRaw);
    } catch (error) {
      console.error('Error generating user report PDF:', error);
      toast.error('Failed to generate user report PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    try {
      exportUsersCsv(selectedRaw.map(toManagedUser));
      toast.success(`Exported ${selectedRaw.length} user${selectedRaw.length === 1 ? '' : 's'} to CSV.`);
    } catch (error) {
      console.error('CSV export failed:', error);
      toast.error('Failed to export users.');
    }
  };

  /* ---------------- kebab menu / modals ---------------- */

  const handleOpenFeatures = (id: string) => {
    setActiveMenuId(null);
    setOpenFeatureUserId(prev => (prev === id ? null : id));
  };

  const handleOpenPermissions = (user: ManagedUser) => {
    const raw = findRaw(user.id);
    if (!raw) return;
    setSelectedUser(raw);
    setUserPermissions(raw.permissions || []);
    setShowPermissionModal(true);
  };

  const handleSaveFromModal = async () => {
    if (!selectedUser) return;
    const success = await handleSavePermissions(selectedUser.id, userPermissions);
    if (success) {
      setOverrides(prev => {
        const copy = { ...prev };
        delete copy[selectedUser.id];
        return copy;
      });
      setShowPermissionModal(false);
    }
  };

  const handleInitiateDelete = (user: ManagedUser) => {
    const raw = findRaw(user.id);
    if (raw) setUserToDelete(raw);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const success = await handleDelete(userToDelete.id);
    if (success) {
      const id = userToDelete.id;
      setUserToDelete(null);
      setSelectedIds(prev => prev.filter(x => x !== id));
      setOverrides(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const handleInitiateResetPassword = (user: ManagedUser) => {
    const raw = findRaw(user.id);
    if (raw) setUserToResetPassword(raw);
  };

  /* ---------------- render ---------------- */

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-2">
      <ToastHost />
      <AdminHeader onCreateClick={() => setShowCreateModal(true)} />

      <UserToolbar
        search={filters.search}
        onSearchChange={filters.setSearch}
        status={filters.status}
        onStatusChange={filters.setStatus}
        feature={filters.feature}
        onFeatureChange={filters.setFeature}
        sortKey={filters.sortKey}
        sortDir={filters.sortDir}
        onSortChange={filters.setSort}
        onToggleSortDir={filters.toggleSortDir}
        resultCount={filters.users.length}
        hasActiveFilters={filters.hasActiveFilters}
        onClearFilters={filters.clearFilters}
      />

      <BulkActionBar
        count={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onGenerateReport={handleGenerateReport}
        onExport={handleExport}
        assignOpen={assignOpen}
        onToggleAssign={() => setAssignOpen(prev => !prev)}
        onCloseAssign={() => setAssignOpen(false)}
        commonFeatures={commonFeatures}
        onToggleFeature={handleBulkToggleFeature}
        busy={isExporting || actionLoading}
      />

      {loading ? (
        <UserSkeleton />
      ) : filters.users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <UsersIcon
            className="mx-auto mb-3 h-10 w-10 text-slate-300"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-slate-700">
            No users match your filters
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Try a different search, or clear the active filters.
          </p>
          {filters.hasActiveFilters && (
            <button
              type="button"
              onClick={filters.clearFilters}
              className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filters.users.map(user => (
            <UserCard
              key={user.id}
              user={user}
              selected={selectedIds.includes(user.id)}
              onToggleSelect={() => handleToggleSelect(user.id)}
              featurePopoverOpen={openFeatureUserId === user.id}
              onOpenFeatures={() => handleOpenFeatures(user.id)}
              onCloseFeatures={() => setOpenFeatureUserId(null)}
              onToggleFeature={(featureId, enabled) => handleToggleFeature(user.id, featureId, enabled)}
              activeMenuId={activeMenuId}
              setActiveMenuId={setActiveMenuId}
              onManageAccess={() => handleOpenPermissions(user)}
              onDelete={() => handleInitiateDelete(user)}
              onResetPassword={() => handleInitiateResetPassword(user)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          loading={actionLoading}
        />
      )}
      {showPermissionModal && selectedUser && (
        <PermissionModal
          user={selectedUser}
          permissions={userPermissions}
          onToggle={id =>
            setUserPermissions(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]))
          }
          onSave={handleSaveFromModal}
          onClose={() => setShowPermissionModal(false)}
          loading={actionLoading}
        />
      )}
      {userToDelete && (
        <DeleteConfirmModal
          user={userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleConfirmDelete}
          loading={actionLoading}
        />
      )}
      {userToResetPassword && (
        <ResetPasswordModal
          user={userToResetPassword}
          onClose={() => setUserToResetPassword(null)}
          onConfirm={async password => {
            const success = await handleResetPassword(userToResetPassword.id, password);
            if (success) setUserToResetPassword(null);
            return success;
          }}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
