import React, { useState, useEffect } from 'react';
import { Send, Sparkles, CheckCircle2, Camera, Zap, Type, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

interface ProfileAccessInfoProps {
  email: string;
  displayName: string;
  permissions?: string[];
}

const REQUEST_USERNAME = 'ALIF1230';

interface FeatureDef {
  id: string;
  name: string;
  banglaName: string;
  icon: React.ElementType;
}

const ALL_FEATURES: FeatureDef[] = [
  {
    id: 'ocr',
    name: 'OCR Quiz Scan',
    banglaName: 'ছবি হতে কুইজ স্ক্যান',
    icon: Camera
  },
  {
    id: 'rapid-fire',
    name: 'Rapid Fire',
    banglaName: 'র‍্যাপিড ফায়ার কুইজ',
    icon: Zap
  },
  {
    id: 'suffix-edit',
    name: 'Custom Suffix Edit',
    banglaName: 'কাস্টম সাফিক্স এডিট',
    icon: Type
  }
];

export default function ProfileAccessInfo({ email, displayName, permissions: propPermissions }: ProfileAccessInfoProps) {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const currentPermissions: string[] = propPermissions || profile?.permissions || (user as any)?.permissions || [];

  const availableToRequest = ALL_FEATURES.filter(f => !currentPermissions.includes(f.id));
  const alreadyGranted = ALL_FEATURES.filter(f => currentPermissions.includes(f.id));

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds(availableToRequest.map(f => f.id));
  }, [currentPermissions.join(',')]);

  const toggleFeature = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === availableToRequest.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(availableToRequest.map(f => f.id));
    }
  };

  const handleRequest = async () => {
    if (selectedIds.length === 0) return;

    const selectedFeatures = availableToRequest.filter(f => selectedIds.includes(f.id));
    const featureText = selectedFeatures.map(f => `${f.name} (${f.banglaName})`).join(', ');
    const activeText = alreadyGranted.length > 0
      ? alreadyGranted.map(f => `${f.name} (${f.banglaName})`).join(', ')
      : 'None';

    const msg = [
      'Hello Sir,',
      'আমি TeleQuiz-এর ইউজার। আমার প্রোফাইলে অতিরিক্ত feature access চাইছি।',
      '',
      `Name: ${displayName || '-'}`,
      `Email: ${email || '-'}`,
      `Currently active features: ${activeText}`,
      `Requested features: ${featureText}`,
      '',
      'অনুগ্রহ করে এই feature(গুলো) আমার অ্যাকাউন্টে সক্রিয় করে দিন।',
      'ধন্যবাদ।'
    ].join('\n');

    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {}

    window.open(`https://t.me/${REQUEST_USERNAME}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  };

  if (availableToRequest.length === 0) {
    return (
      <div className="border border-emerald-200 bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-teal-50 rounded-2xl p-5 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-emerald-950">সব ফিচার সক্রিয় রয়েছে</h3>
            <p className="text-[11px] text-emerald-700 font-medium">আপনার অ্যাকাউন্টে সকল প্রিমিয়াম ফিচার অনলক করা আছে</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {alreadyGranted.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.id} className="flex items-center gap-2 bg-white/90 border border-emerald-200/80 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 shadow-2xs">
                <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{f.name}</span>
                <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0 stroke-[3]" />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-slate-50 rounded-2xl p-5 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between pb-1 border-b border-indigo-100/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white shadow-2xs border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-indigo-950">অতিরিক্ত Feature Request</h3>
            <p className="text-[11px] text-slate-500 font-medium">যে যে ফিচারের এক্সেস চান তা নির্বাচন করে এডমিনকে রিকোয়েস্ট পাঠান</p>
          </div>
        </div>

        {availableToRequest.length > 1 && (
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            {selectedIds.length === availableToRequest.length ? 'সব আনসিলেক্ট' : 'সব সিলেক্ট'}
          </button>
        )}
      </div>

      {alreadyGranted.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            বর্তমানে সক্রিয় ফিচারসমূহ:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {alreadyGranted.map(f => {
              const Icon = f.icon;
              return (
                <span
                  key={f.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                >
                  <Icon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{f.name}</span>
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            অনুরোধ করার জন্য ফিচার নির্বাচন করুন ({selectedIds.length}/{availableToRequest.length}):
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {availableToRequest.map(feature => {
            const Icon = feature.icon;
            const isSelected = selectedIds.includes(feature.id);

            return (
              <div
                key={feature.id}
                onClick={() => toggleFeature(feature.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-white border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white/70 hover:bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'border-2 border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 truncate">{feature.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleRequest}
        disabled={selectedIds.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
      >
        <Send className="w-4 h-4" />
        <span>
          {selectedIds.length === 0
            ? 'অন্তত একটি ফিচার সিলেক্ট করুন'
            : `${selectedIds.length} টি ফিচার রিকোয়েস্ট পাঠান (via Telegram)`}
        </span>
      </button>

      {copied && (
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-700 animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5" />
          মেসেজ ক্লিপবোর্ডে কপি হয়েছে — Telegram-এ পেস্ট করে পাঠিয়ে দিন।
        </p>
      )}
    </div>
  );
}
