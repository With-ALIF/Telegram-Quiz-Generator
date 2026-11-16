import React from 'react';
import { Shield, UserPlus, FileDown } from 'lucide-react';

interface AdminHeaderProps {
  onCreateClick: () => void;
  onDownloadReport: () => void;
  isDownloadingReport?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  onCreateClick, 
  onDownloadReport,
  isDownloadingReport = false
}) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 p-2.5 shadow-sm">
          <Shield className="h-6 w-6 text-blue-500" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users Panel</h1>
          <p className="text-sm font-medium text-slate-500">
            Manage all registered users on your platform
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          type="button"
          onClick={onCreateClick}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Create User
        </button>
        <button
          type="button"
          onClick={onDownloadReport}
          disabled={isDownloadingReport}
          title="Download PDF report of users with polls sent and generated"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 cursor-pointer"
        >
          <FileDown className="h-4 w-4 text-blue-600" aria-hidden="true" />
          {isDownloadingReport ? 'Generating PDF...' : 'Download PDF Report'}
        </button>
      </div>
    </div>
  );
};
