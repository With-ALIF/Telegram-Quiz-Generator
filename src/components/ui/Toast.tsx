import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

type ToastKind = 'success' | 'error';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

let pushToast: ((toast: { kind: ToastKind; message: string }) => void) | null = null;
let sequence = 0;

/** Fire a toast from anywhere (module-level, no provider needed). */
export const toast = {
  success: (message: string) => pushToast?.({ kind: 'success', message }),
  error: (message: string) => pushToast?.({ kind: 'error', message }),
};

/** Mount once inside the screen that uses `toast`. */
export const ToastHost: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    pushToast = ({ kind, message }) => {
      const id = ++sequence;
      setItems(prev => [...prev, { id, kind, message }]);
      window.setTimeout(() => {
        setItems(prev => prev.filter(t => t.id !== id));
      }, 4500);
    };
    return () => {
      pushToast = null;
    };
  }, []);

  const dismiss = (id: number) => setItems(prev => prev.filter(t => t.id !== id));

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {items.map(item => (
        <div
          key={item.id}
          role="status"
          className={[
            'pointer-events-auto flex items-start gap-2 rounded-xl border-[0.5px] px-3 py-2.5 text-sm font-normal',
            item.kind === 'error'
              ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
              : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
          ].join(' ')}
        >
          {item.kind === 'error' ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span className="flex-1">{item.message}</span>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            aria-label="Dismiss notification"
            className="rounded p-0.5 opacity-60 hover:opacity-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
};
