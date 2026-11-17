import React, { useState } from 'react';
import { Send, Trash2, Tag, Bookmark } from 'lucide-react';
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
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 backdrop-blur-xs">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors select-none py-1 px-1.5 rounded-lg hover:bg-white/80">
          <input
            type="checkbox"
            checked={isAllSelected && totalQuestions > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span>Select All</span>
        </label>
        {selectedCount > 0 && (
          <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full">
            {selectedCount} selected
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {selectedCount === 0 ? (
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Bulk Actions</span>
        ) : (
          <>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1 shadow-2xs transition-all">
              <Tag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <select
                value={bulkTopic}
                onChange={(e) => setBulkTopic(e.target.value)}
                className="bg-transparent text-xs font-semibold outline-none w-24 sm:w-28 cursor-pointer text-slate-700 pr-1"
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
                className="text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                Set
              </button>
            </div>

            <button
              onClick={onDraftSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 hover:border-amber-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
              title="নির্বাচিত কুইজগুলো ড্রাফটে সংরক্ষণ করুন"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
              <span>Draft ({selectedCount})</span>
            </button>

            <button
              onClick={onSendSelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs hover:shadow-xs shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
              title="নির্বাচিত কুইজগুলো টেলিগ্রামে পাঠান"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send ({selectedCount})</span>
            </button>

            {!hideDelete && (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-xl border border-rose-200 shadow-2xs animate-fade-in">
                  <span className="text-xs font-bold text-rose-800 px-2">Delete {selectedCount}?</span>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="text-xs font-bold text-slate-600 hover:bg-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    No
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteSelected();
                      setIsConfirmingDelete(false);
                    }}
                    className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    Yes
                  </button>
                </div>
              ) : (
                <button
                  onClick={onDeleteClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200/80 hover:border-rose-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                  title="নির্বাচিত কুইজগুলো মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete ({selectedCount})</span>
                </button>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
