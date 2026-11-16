import React from 'react';
import { TelegramSettings } from '../../../../types';
import { useAuth } from '../../../auth/hooks/useAuth';
import DisplayConfig from './DisplayConfig';
import { QUIZ_TOPICS } from '../../constants';
import { Filter } from 'lucide-react';

interface QuizListToolbarProps {
  settings: TelegramSettings;
  onChannelChange: (channelId: string) => void;
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
  canEditSuffix?: boolean;
  globalDefaultSuffix?: string;
  delaySeconds?: number;
  setDelaySeconds?: (sec: number) => void;
}

const DELAY_OPTIONS = [1, 3, 5, 10, 15, 30, 60, 90];

export default function QuizListToolbar({
  settings,
  onChannelChange,
  selectedTopic,
  onTopicChange,
  canEditSuffix: canEditSuffixProp,
  globalDefaultSuffix,
  delaySeconds = 3,
  setDelaySeconds
}: QuizListToolbarProps) {
  const { user, isAdmin } = useAuth();

  const canEditSuffix = canEditSuffixProp !== undefined ? canEditSuffixProp : (isAdmin || user?.permissions?.includes('suffix-edit'));

  const channelsList = settings?.channels || [];
  const selectedChannelIdsList = settings?.selectedChannelIds || [];

  const visibleChannels = (user && selectedChannelIdsList.length > 0
    ? channelsList.filter(c => selectedChannelIdsList.includes(c.id))
    : channelsList
  );

  React.useEffect(() => {
    if (visibleChannels.length > 0 && !visibleChannels.some(c => c.id === settings?.activeChannelId)) {
      onChannelChange(visibleChannels[0].id);
    }
  }, [visibleChannels, settings?.activeChannelId, onChannelChange]);

  let displayPrefix = settings?.questionPrefix || '';
  let displaySuffix = (canEditSuffix ? settings?.explanationSuffix : (settings?.explanationSuffix || globalDefaultSuffix)) || '';

  if (settings?.activeChannelId) {
    const activeChannel = (settings?.channels || []).find(c => c.id === settings.activeChannelId);
    if (activeChannel) {
      if (activeChannel.activePrefixId === 'none') {
        displayPrefix = '';
      } else if (activeChannel.activePrefixId) {
        const prefixObj = (settings?.prefixes || []).find(p => p.id === activeChannel.activePrefixId);
        if (prefixObj) displayPrefix = prefixObj.content;
      }

      if (activeChannel.activeSuffixId === 'none') {
        displaySuffix = '';
      } else if (activeChannel.activeSuffixId) {
        const suffixObj = (settings?.suffixes || []).find(s => s.id === activeChannel.activeSuffixId);
        if (suffixObj) {
          displaySuffix = suffixObj.content;
        } else if (!canEditSuffix && globalDefaultSuffix) {
          displaySuffix = globalDefaultSuffix;
        }
      } else if (!canEditSuffix && globalDefaultSuffix) {
        displaySuffix = globalDefaultSuffix;
      }
    }
  }

  const labelClass = "text-[10px] lg:text-[11px] uppercase font-bold text-slate-400 tracking-wider";
  const fieldClass = "w-full bg-white border border-slate-200 rounded-xl text-xs lg:text-sm font-semibold text-slate-700 outline-none shadow-sm cursor-pointer transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-sm space-y-3">
      <h3 className="text-sm font-black text-slate-800">Delivery Configuration</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {settings.channels && settings.channels.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="target-channel" className={`${labelClass} flex items-center justify-between`}>
              Target Channel
              {user && settings.selectedChannelIds && settings.selectedChannelIds.length > 1 && (
                <span className="text-[8px] lg:text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold normal-case">
                  {settings.selectedChannelIds.length} SELECTED
                </span>
              )}
            </label>
            <select
              id="target-channel"
              value={settings.activeChannelId || ''}
              onChange={(e) => onChannelChange(e.target.value)}
              className={`${fieldClass} py-2 lg:py-2.5 px-3`}
            >
              {visibleChannels.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="subject-filter" className={labelClass}>Subject</label>
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="subject-filter"
              value={selectedTopic}
              onChange={(e) => onTopicChange(e.target.value)}
              className={`${fieldClass} py-2 lg:py-2.5 pl-9 pr-3`}
            >
              <option value="all">All Subjects</option>
              <option value="uncategorized">Uncategorized</option>
              {QUIZ_TOPICS.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className={`${labelClass} shrink-0`}>Message Delay</span>
        <div className="flex flex-wrap gap-1.5">
          {DELAY_OPTIONS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setDelaySeconds && setDelaySeconds(sec)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                delaySeconds === sec
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
          <label htmlFor="custom-delay" className={`${labelClass} whitespace-nowrap`}>Custom delay</label>
          <input
            id="custom-delay"
            type="number"
            min="1"
            max="90"
            value={delaySeconds}
            placeholder="5 seconds"
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= 90) setDelaySeconds && setDelaySeconds(val);
            }}
            className="w-24 bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-slate-700 outline-none shadow-sm transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-400 placeholder:font-medium"
            title="কাস্টম সেকেন্ড (সর্বোচ্চ ৯০ সেকেন্ড)"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Message Format</span>
        <DisplayConfig displayPrefix={displayPrefix || ''} displaySuffix={displaySuffix || ''} />
      </div>
    </div>
  );
}
