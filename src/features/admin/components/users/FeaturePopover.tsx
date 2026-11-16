import React, { useEffect, useRef } from 'react';
import { AVAILABLE_PAGES } from '../../constants';

interface FeaturePopoverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  activeFeatures: string[];
  onToggle: (featureId: string, enabled: boolean) => void;
  align?: 'left' | 'right';
}

export const FeaturePopover: React.FC<FeaturePopoverProps> = ({
  open,
  onClose,
  title,
  activeFeatures,
  onToggle,
  align = 'left',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const firstCheckbox = panelRef.current?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    firstCheckbox?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-label={title}
        className={[
          'absolute z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1 shadow-xl',
          align === 'right' ? 'right-0' : 'left-0',
        ].join(' ')}
      >
        <div className="px-3 py-2">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-[11px] text-slate-400">Changes save instantly</p>
        </div>
        <div className="h-px bg-slate-100" />

        {AVAILABLE_PAGES.map(page => (
          <label
            key={page.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={activeFeatures.includes(page.id)}
              onChange={event => onToggle(page.id, event.target.checked)}
              className="h-4 w-4 rounded accent-blue-600"
            />
            <span className="font-medium text-slate-700">{page.name}</span>
          </label>
        ))}

        <div className="h-px bg-slate-100" />
        <p className="px-3 py-2 text-[11px] text-slate-400">
          Home access is always enabled.
        </p>
      </div>
    </>
  );
};
