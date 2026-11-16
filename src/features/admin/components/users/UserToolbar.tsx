import React from 'react';
import { ArrowDownUp, Search, Users, X } from 'lucide-react';
import { AVAILABLE_PAGES } from '../../constants';
import { SortDir, SortKey, StatusFilter } from '../../hooks/useUserFilters';

interface UserToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  feature: string;
  onFeatureChange: (value: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSortChange: (key: SortKey) => void;
  onToggleSortDir: () => void;
  resultCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All users' },
  { key: 'active', label: 'Active' },
  { key: 'inactive30', label: 'Inactive 30d' },
];

const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: 'generated', label: 'Generated' },
  { key: 'sent', label: 'Sent' },
  { key: 'joined', label: 'Joined' },
  { key: 'lastActive', label: 'Last active' },
];

export const UserToolbar: React.FC<UserToolbarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  feature,
  onFeatureChange,
  sortKey,
  sortDir,
  onSortChange,
  onToggleSortDir,
  resultCount,
  hasActiveFilters,
  onClearFilters,
}) => {
  const selectClass =
    'rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none hover:border-slate-300 shadow-sm cursor-pointer';

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          placeholder="Search name or email"
          aria-label="Search users by name or email"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none hover:border-slate-300 shadow-sm"
        />
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Status filter">
        {STATUS_OPTIONS.map(option => (
          <button
            key={option.key}
            type="button"
            onClick={() => onStatusChange(option.key)}
            aria-pressed={status === option.key}
            className={[
              'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              status === option.key
                ? 'border-blue-600 bg-blue-600 font-semibold text-white shadow-sm'
                : 'border-slate-200 bg-white font-medium text-slate-700 hover:border-slate-300 shadow-sm',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Feature filter */}
      <select
        value={feature}
        onChange={event => onFeatureChange(event.target.value)}
        aria-label="Filter by feature"
        className={selectClass}
      >
        <option value="all">All features</option>
        {AVAILABLE_PAGES.map(page => (
          <option key={page.id} value={page.id}>
            {page.name}
          </option>
        ))}
      </select>

      {/* Sort */}
      <div className="flex items-center gap-1">
        <select
          value={sortKey}
          onChange={event => onSortChange(event.target.value as SortKey)}
          aria-label="Sort users by"
          className={selectClass}
        >
          {SORT_LABELS.map(option => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onToggleSortDir}
          aria-label={sortDir === 'desc' ? 'Sort ascending' : 'Sort descending'}
          title={sortDir === 'desc' ? 'Ascending' : 'Descending'}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-sm transition-colors"
        >
          <ArrowDownUp
            className={[
              'h-4 w-4 transition-transform',
              sortDir === 'asc' ? 'rotate-180' : '',
            ].join(' ')}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Count + clear */}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Users className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span>
            {resultCount} user{resultCount === 1 ? '' : 's'}
          </span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 shadow-sm"
          >
            Clear filters
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
