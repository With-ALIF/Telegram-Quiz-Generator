import React, { useState } from 'react';
import { Send, Trash2, Tag } from 'lucide-react';
import { QUIZ_TOPICS } from '../../constants';

interface QuizBulkActionsProps {
  totalQuestions: number;
  selectedCount: number;
  isAllSelected: boolean;
  handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendSelected: () => void;
  onDraftSelected: () => void;
  handleDeleteSelected: () => void;
  onSetTopic: (topic: string) => void;
  hideDelete?: boolean;
}

export default function QuizBulkActions({
  totalQuestions,
  selectedCount,
  isAllSelected,
  handleSelectAll,
  onSendSelected,
  onDraftSelected,
  handleDeleteSelected,
  onSetTopic,
  hideDelete
}: QuizBulkActionsProps) {
  const [bulkTopic, setBulkTopic] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const onDeleteClick = () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 3000);
      return;
    }
    handleDeleteSelected();
    setIsConfirmingDelete(false);
  };

  if (totalQuestions === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
      <label className="flex items-center gap-2.5 cursor-pointer text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors">
        <input
          type="checkbox"
          checked={isAllSelected && totalQuestions > 0}
          onChange={handleSelectAll}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        Select All
      </label>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {selectedCount === 0 ? (
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Bulk Actions</span>
        ) : (
          <>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={bulkTopic}
                onChange={(e) => setBulkTopic(e.target.value)}
                className="bg-transparent text-xs font-semibold outline-none w-24 flex-1 cursor-pointer text-slate-600"
              >
                <option value="">Topic...</option>
                {QUIZ_TOPICS.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (bulkTopic) {
                    onSetTopic(bulkTopic);
                    setBulkTopic('');
                  }
                }}
                disabled={!bulkTopic}
                className="text-[11px] font-bold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1 rounded disabled:opacity-50 cursor-pointer"
              >
                Set
              </button>
            </div>
            <button
              onClick={onDraftSelected}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Draft ({selectedCount})
            </button>
            <button
              onClick={onSendSelected}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Send ({selectedCount})
            </button>
            {!hideDelete && (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-100 shadow-sm">
                  <span className="text-xs font-bold text-red-700 px-2">Delete {selectedCount}?</span>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="text-xs font-bold text-slate-600 hover:bg-white px-2 py-1 rounded transition-colors cursor-pointer"
                  >
                    No
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteSelected();
                      setIsConfirmingDelete(false);
                    }}
                    className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded transition-colors shadow-sm cursor-pointer"
                  >
                    Yes
                  </button>
                </div>
              ) : (
                <button
                  onClick={onDeleteClick}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedCount})
                </button>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
