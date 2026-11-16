import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Trash2, MoreVertical, KeyRound, FileDown } from 'lucide-react';

interface UserMenuProps {
  userId: string;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  onManageAccess: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
  onDownloadReport?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  userId,
  activeMenuId,
  setActiveMenuId,
  onManageAccess,
  onDelete,
  onResetPassword,
  onDownloadReport,
}) => {
  const isOpen = activeMenuId === userId;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setActiveMenuId(isOpen ? null : userId)}
        aria-label="User actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <MoreVertical className="h-5 w-5" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} aria-hidden="true" />
            <motion.div
              role="menu"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onManageAccess();
                  setActiveMenuId(null);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <Lock className="h-4 w-4 text-amber-500" aria-hidden="true" />
                Manage Access
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onResetPassword();
                  setActiveMenuId(null);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <KeyRound className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                Reset Password
              </button>
              {onDownloadReport && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onDownloadReport();
                    setActiveMenuId(null);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  <FileDown className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  Download PDF Report
                </button>
              )}
              <div className="my-1 h-px bg-slate-100" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onDelete();
                  setActiveMenuId(null);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete User
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
