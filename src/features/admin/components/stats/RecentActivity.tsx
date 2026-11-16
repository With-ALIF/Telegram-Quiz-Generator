import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

export interface ActivityEvent {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  time: string;
}

interface RecentActivityProps {
  events: ActivityEvent[];
}

export default function RecentActivity({ events }: RecentActivityProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-[#e8edf4] rounded-[19px] p-5 sm:p-6 lg:p-7 shadow-[0_3px_14px_rgba(15,23,42,0.06)] flex flex-col">
      <h2 className="text-[17px] font-extrabold text-[#0f172a]">Recent Activity</h2>
      <p className="text-[12px] text-[#64748b] mt-1">Latest platform events</p>

      <div className="mt-4 flex-1">
        {events.length === 0 ? (
          <p className="text-[12px] text-[#64748b] py-4">No recent events yet.</p>
        ) : (
          events.map((event, index) => {
            const Icon = event.icon;
            return (
              <div
                key={`${event.title}-${index}`}
                className={`flex items-start gap-3 py-3 ${index < events.length - 1 ? 'border-b border-[#edf1f6]' : ''}`}
              >
                <div
                  className="w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: event.iconBg }}
                >
                  <Icon className="w-4 h-4" style={{ color: event.iconColor }} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] font-bold text-[#0f172a] truncate">{event.title}</p>
                    <span className="text-[10px] text-[#64748b] whitespace-nowrap">{event.time}</span>
                  </div>
                  <p className="text-[10px] text-[#64748b] truncate mt-0.5">{event.subtitle}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button
        onClick={() => navigate('/admin')}
        className="mt-4 w-full h-8 rounded-lg bg-[#f8fafc] border border-[#eef2f7] text-[#475569] text-[11px] font-bold hover:bg-[#eef2f7] transition-colors cursor-pointer"
      >
        View all activity
      </button>
    </div>
  );
}
