import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Table as TableIcon } from 'lucide-react';
import { fetchDailyPollCounts } from '../../services/adminService';

interface DayCount {
  /** YYYY-MM-DD */
  date: string;
  count: number;
}

const RANGES = [7, 30];

const formatDay = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const SKELETON_HEIGHTS = [40, 65, 30, 80, 55, 70, 45, 90, 35, 60, 75, 50, 85, 42];

/**
 * Daily "polls created" bar chart & table for the Admin Dashboard.
 * Data source: GET /api/admin/poll-daily (counts poll_questions.created_at per day).
 */
export default function DailyPollsChart() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<DayCount[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const load = useCallback(async (range: number) => {
    setLoading(true);
    const result = await fetchDailyPollCounts(range);
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    setSelected(null);
    load(days);
  }, [days, load]);

  const total = data ? data.reduce((sum, d) => sum + d.count, 0) : 0;
  const max = data && data.length > 0 ? Math.max(...data.map(d => d.count)) : 0;
  const peak =
    data && data.length > 0
      ? data.reduce((best, d) => (d.count > best.count ? d : best), data[0])
      : null;

  const subtitle = loading
    ? 'Loading daily counts…'
    : !data
      ? 'Could not load daily data'
      : `${total.toLocaleString()} poll${total === 1 ? '' : 's'} in the last ${days} days` +
        (peak && peak.count > 0 ? ` · peak ${peak.count} on ${formatDay(peak.date)}` : '');

  const labelLeft = data && data.length > 0 ? formatDay(data[0].date) : '';
  const labelMid =
    data && data.length > 1 ? formatDay(data[Math.floor(data.length / 2)].date) : '';
  const labelRight = data && data.length > 0 ? formatDay(data[data.length - 1].date) : '';

  // Sort descending (newest dates first) for table view
  const sortedTableData = useMemo(() => {
    if (!data) return [];
    return [...data].reverse();
  }, [data]);

  const isToday = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const isYesterday = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    const yest = new Date(Date.now() - 24 * 3600 * 1000);
    return d.toDateString() === yest.toDateString();
  };

  return (
    <div className="mb-6 rounded-[19px] border border-[#e8edf4] bg-white p-5 shadow-[0_3px_14px_rgba(15,23,42,0.06)] sm:p-6 lg:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[17px] font-extrabold text-[#0f172a]">
            <BarChart3 className="h-4 w-4 text-[#6547ff]" strokeWidth={2.2} aria-hidden="true" />
            Daily Polls Created
          </h2>
          <p className="mt-1 text-[12px] text-[#64748b]">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Graph vs Table */}
          <div
            className="flex gap-1 rounded-lg border border-[#e8edf4] bg-[#f8fafc] p-1"
            role="group"
            aria-label="View toggle"
          >
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              aria-pressed={viewMode === 'chart'}
              title="Graph View"
              className={`flex items-center gap-1.5 cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                viewMode === 'chart'
                  ? 'bg-[#6547ff] text-white shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
              title="Table View"
              className={`flex items-center gap-1.5 cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-[#6547ff] text-white shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Range Selector: 7D vs 30D */}
          <div
            className="flex gap-1 rounded-lg border border-[#e8edf4] bg-[#f8fafc] p-1"
            role="group"
            aria-label="Chart range"
          >
            {RANGES.map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                aria-pressed={days === range}
                className={[
                  'cursor-pointer rounded-md px-3 py-1 text-[11px] font-bold transition-colors',
                  days === range
                    ? 'bg-[#6547ff] text-white shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]',
                ].join(' ')}
              >
                {range}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-5">
        {loading ? (
          <div className="flex h-40 items-end gap-1.5" aria-hidden="true">
            {SKELETON_HEIGHTS.map((height, index) => (
              <div
                key={index}
                className="flex-1 animate-pulse rounded-t bg-[#eef2f7]"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        ) : !data ? (
          <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#e8edf4] bg-[#f8fafc] px-6">
            <p className="text-[12px] font-bold text-[#475569]">Daily poll stats unavailable</p>
            <p className="text-center text-[10px] text-[#64748b]">
              Data will appear as soon as polls are recorded.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="overflow-hidden rounded-xl border border-[#e8edf4] bg-white">
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-[#f8fafc] border-b border-[#e8edf4] text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-center">Day</th>
                    <th className="py-2.5 px-4 text-right">Polls Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {sortedTableData.map(day => {
                    const today = isToday(day.date);
                    const yest = isYesterday(day.date);
                    return (
                      <tr 
                        key={day.date} 
                        className={`hover:bg-[#f8fafc] transition-colors ${today ? 'bg-indigo-50/20' : ''}`}
                      >
                        <td className="py-2.5 px-4 font-semibold text-[#0f172a] whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            {formatDay(day.date)}
                            {today && (
                              <span className="rounded bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                                Today
                              </span>
                            )}
                            {yest && (
                              <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[9px] font-medium">
                                Yesterday
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center text-[#64748b] whitespace-nowrap font-medium">
                          {new Date(`${day.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold whitespace-nowrap">
                          {day.count > 0 ? (
                            <span className="inline-flex items-center justify-center rounded-lg bg-indigo-50 text-[#5546ff] px-2.5 py-0.5 text-xs font-bold">
                              {day.count.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-[#94a3b8] font-normal">0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="sticky bottom-0 bg-[#f8fafc] border-t-2 border-[#e8edf4] text-xs font-bold text-[#0f172a]">
                  <tr>
                    <td className="py-2.5 px-4">
                      Total ({days} Days)
                    </td>
                    <td className="py-2.5 px-4 text-center text-[11px] text-[#64748b]">
                      Avg: {(total / (data.length || 1)).toFixed(1)}/day
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-[#5546ff]">
                      {total.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : total === 0 ? (
          /* Graph View: Empty State */
          <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#e8edf4] bg-[#f8fafc] px-6">
            <p className="text-[12px] font-bold text-[#475569]">
              No polls created in the last {days} days
            </p>
            <p className="text-center text-[10px] text-[#64748b]">
              Generated polls will appear here as soon as they are created.
            </p>
          </div>
        ) : (
          /* Graph View: Bars */
          <>
            <div
              className="flex h-40 items-stretch gap-[3px]"
              role="group"
              aria-label={`Polls created per day over the last ${days} days. Total ${total}, highest ${max} in a day.`}
              onClick={event => {
                if (!(event.target as HTMLElement).closest('button')) setSelected(null);
              }}
            >
              {data.map((day, index) => {
                const height =
                  max > 0 ? Math.max((day.count / max) * 100, day.count > 0 ? 4 : 0) : 0;
                const isSelected = selected === index;
                const label = `${formatDay(day.date)}: ${day.count} poll${day.count === 1 ? '' : 's'}`;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : index)}
                    aria-pressed={isSelected}
                    aria-label={label}
                    title={label}
                    className="relative flex min-w-0 flex-1 cursor-pointer flex-col justify-end rounded-t focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6547ff]"
                  >
                    {isSelected && (
                      <span
                        className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0f172a] px-2 py-1 text-[10px] font-bold text-white shadow-md"
                        style={{ bottom: `calc(${height}% + 8px)` }}
                      >
                        {day.count} poll{day.count === 1 ? '' : 's'} · {formatDay(day.date)}
                        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#0f172a]" />
                      </span>
                    )}
                    <span
                      className={[
                        'block w-full rounded-t-[4px] transition-all',
                        day.count > 0
                          ? isSelected
                            ? 'bg-[#5546ff]'
                            : 'bg-[#6547ff] hover:opacity-75'
                          : 'bg-[#eef2f7]',
                      ].join(' ')}
                      style={{ height: `${height}%` }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Baseline */}
            <div className="h-px bg-[#e8edf4]" />

            {/* X-axis labels */}
            <div className="mt-1.5 flex justify-between text-[10px] text-[#94a3b8]">
              <span>{labelLeft}</span>
              <span className="hidden sm:inline">{labelMid}</span>
              <span>{labelRight}</span>
            </div>

            {/* Click hint */}
            <p className="mt-1 text-center text-[10px] text-[#94a3b8]">
              Click a bar to see its exact count
            </p>
          </>
        )}
      </div>
    </div>
  );
}
