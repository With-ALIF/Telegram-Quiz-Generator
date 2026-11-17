import React from 'react';
import { Mail } from 'lucide-react';

interface ProfileInfoProps {
  email: string | null;
  uid?: string;
}

export default function ProfileInfo({ email }: ProfileInfoProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
      <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl text-slate-500">
        <Mail className="w-5 h-5" />
        <span className="truncate">{email}</span>
      </div>
    </div>
  );
}
