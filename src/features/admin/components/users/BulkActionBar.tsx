import React from 'react';
import { Download, FileText, Sparkles, X } from 'lucide-react';
import { FeaturePopover } from './FeaturePopover';

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  onGenerateReport: () => void;
  onExport: () => void;
  assignOpen: boolean;
  onToggleAssign: () => void;
  onCloseAssign: () => void;
  /** features every selected user already has (popover checkbox state) */
  commonFeatures: string[];
  onToggleFeature: (featureId: string, enabled: boolean) => void;
  busy?: boolean;
}

const buttonClass =
  'flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-colors';

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  count,
  onClear,
  onGenerateReport,
  onExport,
  assignOpen,
  onToggleAssign,
  onCloseAssign,
  commonFeatures,
  onToggleFeature,
  busy = false,
}) => {
  if (count <= 0) return null;

  return (
    <div className="sticky top-0 z-30 mb-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-white px-3.5 py-2 shadow-sm">
        <span className="flex items-center gap-2 text-sm text-slate-700">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white">
            {count}
          </span>
          <span className="font-semibold">selected</span>
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onGenerateReport}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Generate report
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={onToggleAssign}
              aria-haspopup="dialog"
              aria-expanded={assignOpen}
              disabled={busy}
              className={buttonClass}
            >
              <Sparkles className="h-4 w-4 text-blue-600" aria-hidden="true" />
              Assign feature
            </button>
            <FeaturePopover
              open={assignOpen}
              onClose={onCloseAssign}
              title="Assign feature to selection"
              activeFeatures={commonFeatures}
              onToggle={onToggleFeature}
              align="right"
            />
          </div>

          <button type="button" onClick={onExport} disabled={busy} className={buttonClass}>
            <Download className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Export
          </button>

          <button
            type="button"
            onClick={onClear}
            aria-label="Clear selection"
            title="Clear selection"
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:text-slate-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
