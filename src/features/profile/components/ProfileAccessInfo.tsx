import React, { useState } from 'react';
import { Send, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProfileAccessInfoProps {
  email: string;
  displayName: string;
}

const REQUEST_USERNAME = 'ALIF1230';

export default function ProfileAccessInfo({ email, displayName }: ProfileAccessInfoProps) {
  const [copied, setCopied] = useState(false);

  const handleRequest = async () => {
    const msg = [
      'Hello Sir,',
      'আমি TeleQuiz-এর ইউজার। আমার প্রোফাইলে অতিরিক্ত feature access চাইছি।',
      '',
      `Name: ${displayName || '-'}`,
      `Email: ${email || '-'}`,
      'Requested features: Polls, Drafts, OCR, Rapid Fire',
      '',
      'অনুগ্রহ করে এই featureগুলো আমার জন্য সক্রিয় করে দিন।',
      'ধন্যবাদ।',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
    } catch {
      // clipboard না পেলেও link-এ text যাবে
    }

    window.open(`https://t.me/${REQUEST_USERNAME}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  };

  return (
    <div className="border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="p-1.5 rounded-lg bg-white shadow-sm border border-blue-100">
          <Sparkles className="w-4 h-4 text-indigo-600" />
        </span>
        <h3 className="text-sm font-black text-indigo-950">অতিরিক্ত Feature</h3>
      </div>

      <p className="text-sm text-blue-900 font-semibold leading-relaxed">
        সাইন আপ করলেই সাথে সাথে Home পেজে গিয়ে কুইজ তৈরি ও পাঠানো শুরু করতে পারবেন।
      </p>
      <p className="text-xs text-blue-800/80 leading-relaxed">
        Polls, Drafts, OCR, Rapid Fire মতো অতিরিক্ত feature আপনার Admin প্যানেল থেকে সক্রিয় করে দেবেন।
      </p>

      <button
        onClick={handleRequest}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 active:scale-[0.98] cursor-pointer"
      >
        <Send className="w-4 h-4" />
        Feature Request পাঠান (Telegram @{REQUEST_USERNAME})
      </button>

      {copied && (
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          মেসেজ কপি হয়েছে — Telegram-এ paste করে পাঠিয়ে দিন।
        </p>
      )}
    </div>
  );
}
