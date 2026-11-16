import React, { useState } from 'react';
import { FileSpreadsheet, FileJson } from 'lucide-react';
import { QuizQuestion } from '../../../../types';
import { exportToCSV } from '../../services/csvExportService';
import { exportToJSON } from '../../../../lib/jsonExport';
import { AnimatePresence } from 'motion/react';
import CsvExportModal from './CsvExportModal';

interface QuizExportSectionProps {
  questions: QuizQuestion[];
}

export default function QuizExportSection({ questions }: QuizExportSectionProps) {
  const [showCsvPrompt, setShowCsvPrompt] = useState(false);
  const [csvSuffix, setCsvSuffix] = useState('1');
  const [filename, setFilename] = useState('');

  if (questions.length === 0) return null;

  const handleCsvExport = () => {
    exportToCSV(questions, csvSuffix, filename);
    setShowCsvPrompt(false);
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-slate-800">Export Data</h3>
          <span className="text-xs font-bold text-slate-400">{questions.length} items</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
          <button
            onClick={() => setShowCsvPrompt(true)}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            CSV Export
          </button>
          <button
            onClick={() => exportToJSON(questions)}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-blue-600" />
            JSON Export
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showCsvPrompt && (
          <CsvExportModal
            csvSuffix={csvSuffix}
            setCsvSuffix={setCsvSuffix}
            filename={filename}
            setFilename={setFilename}
            onClose={() => setShowCsvPrompt(false)}
            onExport={handleCsvExport}
          />
        )}
      </AnimatePresence>
    </>
  );
}
