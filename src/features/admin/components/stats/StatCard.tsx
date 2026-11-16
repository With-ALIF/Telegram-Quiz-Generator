import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  note?: string;
  badge?: string;
  delay?: number;
}

export default function StatCard({ icon: Icon, iconBg, iconColor, value, label, note, badge, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-white border border-[#e8edf4] rounded-[19px] p-6 min-h-[190px] flex flex-col shadow-[0_3px_14px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.09)] transition-shadow"
    >
      <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <Icon className="w-6 h-6" style={{ color: iconColor }} strokeWidth={2.3} />
      </div>

      <div className="mt-auto pt-6">
        <div className="text-[34px] leading-none font-extrabold text-[#0f172a] tracking-tight">{value}</div>
        <div className="mt-3 text-[13px] font-bold uppercase tracking-[0.55px] text-[#64748b]">{label}</div>
        <div className="mt-3 min-h-[19px]">
          {badge ? (
            <span className="inline-flex items-center gap-1.5 bg-[#effaf4] text-[#16804f] text-[10px] font-bold px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a36a]" />
              {badge}
            </span>
          ) : note ? (
            <span className="text-[12px] text-[#64748b]">{note}</span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
