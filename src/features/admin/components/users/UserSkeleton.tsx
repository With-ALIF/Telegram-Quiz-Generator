import React from 'react';

const bar = 'animate-pulse rounded bg-slate-100';

export const UserSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <span className="sr-only">Loading users…</span>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[16px] border border-[#E8ECF3] bg-[#FFFFFF] p-4 sm:p-5 shadow-[0_4px_16px_rgba(15,23,42,0.04)]"
        >
          <div className="flex items-start gap-3">
            <div className={`${bar} mt-3 h-4 w-4`} />
            <div className={`${bar} h-10 w-10 rounded-full`} />
            <div className="flex-1 space-y-2">
              <div className={`${bar} h-3 w-32`} />
              <div className={`${bar} h-3 w-48`} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className={`${bar} h-3 w-full`} />
            <div className={`${bar} h-1.5 w-full rounded-full`} />
          </div>
          <div className="mt-4 flex gap-1.5">
            <div className={`${bar} h-6 w-24 rounded-full`} />
            <div className={`${bar} h-6 w-16 rounded-full`} />
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className={`${bar} h-3 w-56`} />
          </div>
        </div>
      ))}
    </div>
  );
};
