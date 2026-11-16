import React from 'react';
import { Plus, Mail, Calendar } from 'lucide-react';
import { ManagedUser } from '../../types';
import { UserMenu } from './UserMenu';
import { FeaturePopover } from './FeaturePopover';
import {
  featureName,
  formatJoined,
  isActiveUser,
  usagePercent,
} from '../../utils/adminUtils';

interface UserCardProps {
  user: ManagedUser;
  selected: boolean;
  onToggleSelect: () => void;
  featurePopoverOpen: boolean;
  onOpenFeatures: () => void;
  onCloseFeatures: () => void;
  onToggleFeature: (featureId: string, enabled: boolean) => void;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  onManageAccess: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
  onDownloadReport?: () => void;
}

const getInitials = (name: string, email: string) => {
  const cleanName = (name || '').trim();
  if (cleanName) {
    const parts = cleanName.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '?';
};

export const UserCard: React.FC<UserCardProps> = ({
  user,
  selected,
  onToggleSelect,
  featurePopoverOpen,
  onOpenFeatures,
  onCloseFeatures,
  onToggleFeature,
  activeMenuId,
  setActiveMenuId,
  onManageAccess,
  onDelete,
  onResetPassword,
  onDownloadReport,
}) => {
  const percent = usagePercent(user);
  const active = isActiveUser(user);
  const initials = getInitials(user.name, user.email);
  const [imgError, setImgError] = React.useState(false);

  return (
    <article
      className={[
        'relative rounded-2xl bg-white p-5 transition-all shadow-[0_4px_16px_rgba(15,23,42,0.04)]',
        selected
          ? 'border-2 border-blue-600 ring-2 ring-blue-500/20'
          : 'border border-[#E8ECF3] hover:border-slate-300',
      ].join(' ')}
    >
      {/* Top: Checkbox + Avatar + Name + Email + Three-dot menu */}
      <div className="flex items-start gap-3.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Select ${user.name}`}
          className="mt-2.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
        />

        <div className="relative shrink-0">
          {user.avatarUrl && !imgError ? (
            <img
              src={user.avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF2FF] text-[#2563EB] font-bold text-sm">
              {initials}
            </div>
          )}
          <span
            role="img"
            aria-label={active ? 'Active' : 'Inactive'}
            title={active ? 'Active' : 'Inactive'}
            className={[
              'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
              active ? 'bg-[#10B981]' : 'bg-slate-400',
            ].join(' ')}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-slate-900 leading-tight">{user.name}</h3>
            {user.role === 'admin' && (
              <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white">
                Admin
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>

        <UserMenu
          userId={user.id}
          activeMenuId={activeMenuId}
          setActiveMenuId={setActiveMenuId}
          onManageAccess={onManageAccess}
          onDelete={onDelete}
          onResetPassword={onResetPassword}
          onDownloadReport={onDownloadReport}
        />
      </div>

      {/* Middle: Usage percentage + Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-800">Usage</span>
          <span className="text-slate-900">
            {user.sent.toLocaleString()} / {user.generated.toLocaleString()}{' '}
            <span className="font-normal text-slate-400">·</span>{' '}
            <span className="font-bold text-blue-600">{percent}%</span>
          </span>
        </div>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
          role="img"
          aria-label={`${percent}% of generated quizzes sent`}
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Bottom: Feature access badges */}
      <div className="relative mt-4 flex flex-wrap items-center gap-1.5">
        {user.features.length === 0 && (
          <span className="rounded-full border border-dashed border-slate-300 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
            Home access only
          </span>
        )}
        {user.features.map(featureId => (
          <button
            key={featureId}
            type="button"
            onClick={onOpenFeatures}
            aria-label={`Edit features for ${user.name}`}
            className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          >
            {featureName(featureId)}
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenFeatures}
          aria-label={`Add features for ${user.name}`}
          aria-haspopup="dialog"
          aria-expanded={featurePopoverOpen}
          className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-600"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          Add
        </button>

        <FeaturePopover
          open={featurePopoverOpen}
          onClose={onCloseFeatures}
          title={`Edit features — ${user.name}`}
          activeFeatures={user.features}
          onToggle={onToggleFeature}
          align="left"
        />
      </div>

      {/* Bottom: Joined date */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span>Joined {formatJoined(user.joinedAt)}</span>
        </div>
      </div>
    </article>
  );
};
