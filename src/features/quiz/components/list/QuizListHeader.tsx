import React from 'react';
import { Link } from 'react-router-dom';
import { Wand2, Send } from 'lucide-react';

interface QuizListHeaderProps {
  totalQuestions: number;
  stats: { generated: number; sent: number };
  title?: string;
  sentLabel?: string;
  sentValue?: number;
  showGeneratedStat?: boolean;
  countLabel?: string;
  countLink?: string;
}

export default function QuizListHeader({
  totalQuestions,
  stats,
  title = "Generated Quizzes",
  sentLabel = "Sent",
  sentValue,
  showGeneratedStat = true,
  countLabel,
  countLink = "/polls"
}: QuizListHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base lg:text-lg font-black text-slate-900 tracking-tight">{title}</h2>
        <Link
          to={countLink}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 transition-colors shrink-0"
        >
          {countLabel ?? `${totalQuestions} Quizzes`}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {showGeneratedStat && (
          <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-violet-100">
                <Wand2 className="w-3.5 h-3.5 text-violet-600" />
              </span>
              <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-slate-400">Generated</span>
            </div>
            <p className="mt-1.5 text-lg lg:text-xl font-black text-slate-900 tabular-nums leading-none">
              {stats.generated.toLocaleString()}
            </p>
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-100">
              <Send className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-slate-400">{sentLabel}</span>
          </div>
          <p className="mt-1.5 text-lg lg:text-xl font-black text-slate-900 tabular-nums leading-none">
            {(sentValue ?? stats.sent).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
