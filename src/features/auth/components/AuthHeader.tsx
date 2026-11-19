import React from 'react';

export default function AuthHeader() {
  return (
    <div className="flex flex-col items-center mb-8">
      <img 
        src="/logo.svg" 
        alt="TeleQuiz Logo" 
        className="w-20 h-20 object-contain rounded-2xl shadow-lg mb-4 flex-shrink-0" 
      />
      <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight">TeleQuiz</h1>
      <p className="text-slate-500 text-sm font-medium">The Ultimate Telegram Quiz Platform</p>
    </div>
  );
}
