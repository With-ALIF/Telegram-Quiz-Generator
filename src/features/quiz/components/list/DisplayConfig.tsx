import React from 'react';

interface DisplayConfigProps {
  displayPrefix: string;
  displaySuffix: string;
}

function FormatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 rounded-xl px-3 py-2 bg-white shadow-sm min-w-0">
      <span className="block text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
        {label}
      </span>
      <span className="block text-xs lg:text-sm font-semibold text-slate-700 leading-snug whitespace-pre-wrap break-words">
        {value || '—'}
      </span>
    </div>
  );
}

export default function DisplayConfig({ displayPrefix, displaySuffix }: DisplayConfigProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <FormatBox label="Prefix" value={displayPrefix} />
      <FormatBox label="Suffix" value={displaySuffix} />
    </div>
  );
}
