import React from 'react';
import { Shield, UserPlus } from 'lucide-react';

interface AdminHeaderProps {
  onCreateClick: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onCreateClick }) => {
  return (
    <div className="mb-6 flex flex-col items-start gap-4">
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
      <button
        type="button"
        onClick={onCreateClick}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Create User
      </button>
    </div>
  );
};
