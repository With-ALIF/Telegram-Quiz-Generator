import React, { useMemo, useState } from 'react';
import { Users, Layout, FileQuestion, Send, Shield, UserPlus } from 'lucide-react';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { AVAILABLE_PAGES } from '../constants';
import { isRegularUser, timeAgo } from '../utils/adminUtils';
import StatCard from '../components/stats/StatCard';
import RecentActivity, { ActivityEvent } from '../components/stats/RecentActivity';
import DailyPollsChart from '../components/stats/DailyPollsChart';

export default function AdminStats() {
  const { loading, regularUsersCount, users } = useAdminUsers();
  const featuresCount = AVAILABLE_PAGES.length;

  const totalPollsGenerated = users.reduce((sum, user) => sum + (user.stats?.generated || 0), 0);
  const totalPollsSent = users.reduce((sum, user) => sum + (user.stats?.sent || 0), 0);

  const [syncedAt, setSyncedAt] = useState<number>(Date.now() / 1000);

  // Regular members (excluding admins) for growth charts & activity
  const members = useMemo(() => users.filter(isRegularUser), [users]);

  // Members joined in the last 30 days
  const newThisMonth = useMemo(() => {
    const cutoff = Date.now() / 1000 - 30 * 24 * 3600;
    return members.filter(u => (u.createdAt?.seconds || 0) >= cutoff).length;
  }, [members]);

  // Recent activity: newest signups first, then all-time stat events
  const events: ActivityEvent[] = useMemo(() => {
    const signups: ActivityEvent[] = [...members]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 2)
      .map(u => ({
        icon: UserPlus,
        iconBg: '#edf4ff',
        iconColor: '#2563eb',
        title: 'New member registered',
        subtitle: u.displayName || u.email || 'Anonymous',
        time: timeAgo(u.createdAt?.seconds),
      }));

    const stats: ActivityEvent[] = [
      {
        icon: Send,
        iconBg: '#fff7e8',
        iconColor: '#d97706',
        title: 'Messages sent',
        subtitle: `${totalPollsSent.toLocaleString()} all-time messages sent`,
        time: timeAgo(syncedAt),
      },
      {
        icon: Users,
        iconBg: '#f0efff',
        iconColor: '#6547ff',
        title: 'Total members',
        subtitle: `${regularUsersCount} registered members`,
        time: timeAgo(syncedAt),
      },
    ];

    return [...signups, ...stats].slice(0, 3);
  }, [members, totalPollsGenerated, totalPollsSent, regularUsersCount, syncedAt]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    <div className="min-h-full bg-[#f7f9fc] px-4 md:px-8 py-7">
      {/* Overview header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-7">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-[13px] bg-[#e9edff] flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-[#5546ff]" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-[27px] font-extrabold text-[#0f172a] leading-tight">Overview</h1>
            <p className="text-[13px] text-[#64748b]">Platform performance at a glance</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-[#eaf8f0] rounded-full px-4 py-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-[#16a36a] animate-pulse" />
          <span className="text-[11px] font-bold text-[#16804f] tracking-wide">LIVE STATS</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard
          icon={Users}
          iconBg="#edf4ff"
          iconColor="#2563eb"
          value={regularUsersCount}
          label="Total Members"
          badge={`+${newThisMonth} THIS MONTH`}
        />
        <StatCard
          icon={Layout}
          iconBg="#f0efff"
          iconColor="#6547ff"
          value={featuresCount}
          label="Total Features"
          note="Available platform features"
          delay={0.08}
        />
        <StatCard
          icon={FileQuestion}
          iconBg="#eafaf3"
          iconColor="#059669"
          value={totalPollsGenerated.toLocaleString()}
          label="Polls Generated"
          note="All-time generated polls"
          delay={0.16}
        />
        <StatCard
          icon={Send}
          iconBg="#fff7e8"
          iconColor="#d97706"
          value={totalPollsSent.toLocaleString()}
          label="Total Sent"
          note="All-time messages sent"
          delay={0.24}
        />
      </div>

      {/* Daily polls chart (real data from poll_questions.created_at) */}
      <DailyPollsChart />

      {/* Activity panel */}
      <RecentActivity events={events} />
    </div>
  );
}
