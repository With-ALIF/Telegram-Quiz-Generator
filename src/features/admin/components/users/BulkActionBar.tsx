import React from 'react';
import { FileText, X } from 'lucide-react';

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  onGenerateReport: () => void;
  busy?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  count,
  onClear,
  onGenerateReport,
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
