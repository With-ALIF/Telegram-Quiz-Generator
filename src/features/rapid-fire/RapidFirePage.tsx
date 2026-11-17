import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Send, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Hash, 
  FileText, 
  Trash2, 
  Copy, 
  Check, 
  RotateCcw, 
  Clock, 
  Timer,
  Square,
  Sliders,
  Radio,
  ArrowRight,
  X
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { generateQuizFromText } from '../quiz/services/geminiService';
import { sendQuestionTextToTelegram } from '../quiz/services/telegramService';
import { QuizQuestion } from '../../types';
import { generateUUID } from '../../lib/uuid';

const STORAGE_KEYS = {
  ACTIVE_QUESTIONS: 'rapid_fire_active_questions',
  INPUT_TEXT: 'rapid_fire_input_text',
  DELAY_SECONDS: 'rapid_fire_delay_seconds',
  QUESTION_COUNT: 'rapid_fire_question_count',
  TOPIC: 'rapid_fire_topic',
  SUBJECT: 'rapid_fire_subject'
};

export default function RapidFirePage() {
  const { user, loading: authLoading } = useAuthContext();
  const appState = useApp();

  const [inputText, setInputText] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.INPUT_TEXT) || '';
  });
  const [questionCount, setQuestionCount] = useState<number | ''>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.QUESTION_COUNT);
    return saved ? parseInt(saved, 10) || 10 : 10;
  });
  const [subject, setSubject] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SUBJECT) || 'সাধারণ জ্ঞান';
  });
  const [customSubject, setCustomSubject] = useState<string>('');
  const [topic, setTopic] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.TOPIC) || '';
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Omit<QuizQuestion, 'id' | 'status'>[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_QUESTIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [customChannelId, setCustomChannelId] = useState('');
  const [delaySeconds, setDelaySeconds] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DELAY_SECONDS);
    return saved ? parseInt(saved, 10) || 30 : 30;
  });
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [sendingProgress, setSendingProgress] = useState<number | null>(null);
  const [totalToSend, setTotalToSend] = useState<number>(0);
  const [currentSendStatus, setCurrentSendStatus] = useState<'sending' | 'sent' | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [sendingSingleIdx, setSendingSingleIdx] = useState<number | null>(null);
  const [sentSingleIdx, setSentSingleIdx] = useState<number | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const cancelSendingRef = React.useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INPUT_TEXT, inputText);
  }, [inputText]);

  useEffect(() => {
    if (typeof questionCount === 'number') {
      localStorage.setItem(STORAGE_KEYS.QUESTION_COUNT, questionCount.toString());
    }
  }, [questionCount]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBJECT, subject);
  }, [subject]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TOPIC, topic);
  }, [topic]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_QUESTIONS, JSON.stringify(generatedQuestions));
  }, [generatedQuestions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELAY_SECONDS, delaySeconds.toString());
  }, [delaySeconds]);
  const effectiveSubject = subject === 'custom' ? customSubject.trim() || 'অন্যান্য' : subject;
  const effectiveTopic = topic.trim();

  const channels = appState?.settings?.settings?.channels || [];
  const defaultChannelId = appState?.settings?.settings?.activeChannelId || (channels[0]?.id || '');
  const activeChannelId = (selectedChannelId || customChannelId || defaultChannelId).trim();

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      console.warn('[RapidFire] Input text is empty. Please enter text to generate questions.');
      setError('অনুগ্রহ করে আগে আপনার টেক্সট, নোট বা আর্টিকেলটি বক্সে পেস্ট করুন।');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setSendResult(null);
    setSendingProgress(null);

    try {
      const finalCount = typeof questionCount === 'number' && questionCount > 0 ? Math.min(30, questionCount) : 10;
      console.log(`[RapidFire] Requesting quiz generation: ${finalCount} questions, text length: ${inputText.trim().length}`);
      const rawResponse = await generateQuizFromText(inputText.trim(), finalCount, false);
      if (!rawResponse || rawResponse.length === 0) {
        throw new Error('কোনো প্রশ্ন তৈরি করা সম্ভব হয়নি। অনুগ্রহ করে অন্য টেক্সট ট্রাই করুন।');
      }
      console.log(`[RapidFire] Received ${rawResponse.length} questions from generator`);
      const response = rawResponse.map(q => ({
        ...q,
        question: q.question ? q.question.replace(/\s*\[[^\]]*\]\s*$/g, '').trim() : ''
      }));

      setGeneratedQuestions(response);
    } catch (err: any) {
      console.error('[RapidFire] Question generation error:', err);
      setError(err.message || 'প্রশ্ন তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearCurrent = () => {
    setShowClearModal(true);
  };

  const handleConfirmClear = () => {
    setGeneratedQuestions([]);
    setInputText('');
    setSendResult(null);
    setError(null);
    setShowClearModal(false);
  };

  const handleCopyAllQuestions = (questionsToCopy: Omit<QuizQuestion, 'id' | 'status'>[], idKey: string) => {
    const fullText = questionsToCopy.map((q, idx) => `${idx + 1}. ${q.question}`).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteSingleQuestion = (indexToDelete: number) => {
    setGeneratedQuestions(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const handleSendToTelegram = async () => {
    if (generatedQuestions.length === 0) return;

    if (!activeChannelId) {
      setError('❌ কোনো টেলিগ্রাম চ্যানেল সেটআপ করা নেই! নিচে আপনার Channel ID টাইপ করুন অথবা Settings এ গিয়ে সেট করুন।');
      return;
    }

    setIsSending(true);
    setSendResult(null);
    setError(null);
    setCountdownSeconds(null);
    cancelSendingRef.current = false;

    const queue = [...generatedQuestions];
    const initialTotal = queue.length;
    setTotalToSend(initialTotal);
    let successCount = 0;

    try {
      for (let i = 0; i < queue.length; i++) {
        if (cancelSendingRef.current) break;

        const q = queue[i];
        setSendingProgress(i + 1);
        setCurrentSendStatus('sending');
        setCountdownSeconds(null);

        const questionPayload: QuizQuestion = {
          id: generateUUID(),
          question: q.question,
          options: q.options || [],
          correctOptionIndex: q.correctOptionIndex ?? 0,
          explanation: q.explanation || '',
          status: 'pending',
          topic: effectiveTopic ? `${effectiveSubject} - ${effectiveTopic}` : effectiveSubject
        };

        const success = await sendQuestionTextToTelegram(
          questionPayload,
          appState?.settings?.settings || {},
          activeChannelId
        );

        if (success) {
          successCount++;
          setCurrentSendStatus('sent');
        }

        if (i < queue.length - 1 && !cancelSendingRef.current) {
          const totalWait = Math.max(1, typeof delaySeconds === 'number' ? delaySeconds : 30);
          for (let remaining = totalWait; remaining > 0; remaining--) {
            if (cancelSendingRef.current) break;
            setCountdownSeconds(remaining);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          setCountdownSeconds(null);
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setGeneratedQuestions(prev => prev.filter((item, idx) => {
          return idx > 0;
        }));
        setCurrentSendStatus(null);
      }

      if (cancelSendingRef.current) {
        setSendResult(`🛑 পাঠানো স্থগিত করা হয়েছে। (${successCount} টি প্রশ্ন টেলিগ্রামে পাঠানো হয়েছে)`);
      } else {
        setSendResult(`✅ সফলভাবে ${successCount} টি প্রশ্ন টেলিগ্রামে পাঠানো হয়েছে!`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'টেলিগ্রামে পাঠানোর সময় ত্রুটি ঘটেছে। অনুগ্রহ করে আপনার বটের পারমিশন চেক করুন।');
    } finally {
      setIsSending(false);
      setSendingProgress(null);
      setCountdownSeconds(null);
      setCurrentSendStatus(null);
    }
  };

  const handleSendSingleQuestion = async (idx: number) => {
    if (isSending || sendingSingleIdx !== null) return;

    const activeChannelId = customChannelId.trim() || selectedChannelId || defaultChannelId;
    if (!activeChannelId) {
      setError('টেলিগ্রাম চ্যানেল সিলেক্ট করুন অথবা চ্যানেলের আইডি / ইউজারনেম দিন।');
      return;
    }

    const q = generatedQuestions[idx];
    if (!q) return;

    setSendingSingleIdx(idx);
    setError(null);
    setSendResult(null);

    try {
      const questionPayload: QuizQuestion = {
        id: generateUUID(),
        question: q.question,
        options: q.options || [],
        correctOptionIndex: q.correctOptionIndex ?? 0,
        explanation: q.explanation || '',
        status: 'pending',
        topic: effectiveTopic ? `${effectiveSubject} - ${effectiveTopic}` : effectiveSubject
      };

      const success = await sendQuestionTextToTelegram(
        questionPayload,
        appState?.settings?.settings || {},
        activeChannelId
      );

      if (success) {
        setSentSingleIdx(idx);

        await new Promise(resolve => setTimeout(resolve, 1000));

        setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx));
        setSendResult(`✅ প্রশ্নটি সফলভাবে টেলিগ্রামে পাঠানো হয়েছে!`);
      } else {
        setError('প্রশ্নটি পাঠানো যায়নি। টেলিগ্রাম বট ও চ্যানেলের পারমিশন চেক করুন।');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'টেলিগ্রামে পাঠানোর সময় ত্রুটি ঘটেছে। অনুগ্রহ করে আপনার বটের পারমিশন চেক করুন।');
    } finally {
      setSendingSingleIdx(null);
      setSentSingleIdx(null);
    }
  };

  if (authLoading) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Rapid Fire Generator</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(generatedQuestions.length > 0 || inputText) && (
            <button
              onClick={handleClearCurrent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
              title="নতুন সেশন শুরু করুন"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ক্লিয়ার</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            <h2 className="text-base font-extrabold text-slate-800">Input Text</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[5, 10, 15, 20, 30].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${questionCount === num
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shrink-0">
              <Hash className="w-4 h-4 text-slate-500" />
              <label className="text-xs font-bold text-slate-600">Custom:</label>
              <input
                type="number"
                min={1}
                max={30}
                placeholder="10"
                value={questionCount === '' ? '' : questionCount}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setQuestionCount('');
                  } else {
                    const parsed = parseInt(raw, 10);
                    if (!isNaN(parsed)) {
                      setQuestionCount(Math.min(30, Math.max(0, parsed)));
                    }
                  }
                }}
                onBlur={() => {
                  if (questionCount === '' || questionCount < 1) {
                    setQuestionCount(10);
                  }
                }}
                className="w-12 bg-white border border-slate-200 rounded-lg py-0.5 text-slate-800 font-extrabold text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2.5 text-xs border border-red-100 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isGenerating}
            placeholder="Paste your text, notes, or article here..."
            className="w-full h-64 px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm leading-relaxed text-slate-700 placeholder-slate-400"
          />
          {inputText && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                {inputText.length} chars
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2.5 text-xs border border-red-100 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="relative overflow-hidden w-full bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 hover:from-slate-800 hover:via-slate-800 hover:to-indigo-900 disabled:opacity-50 text-white py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl font-black text-sm tracking-wide transition-all duration-300 shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-indigo-950/30 border border-slate-700/60 hover:border-indigo-500/40 active:scale-[0.99] flex items-center justify-between group cursor-pointer disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform pointer-events-none" />

          {isGenerating ? (
            <div className="flex items-center justify-center gap-3 w-full py-0.5">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-left">
                <span className="font-bold text-sm text-white">প্রশ্ন তৈরি হচ্ছে...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-xs group-hover:bg-indigo-500/20 group-hover:border-indigo-400/30 transition-all shadow-2xs">
                  <Sparkles className="w-4 h-4 text-indigo-300 group-hover:text-yellow-300 transition-colors animate-pulse" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    <span>Generate Rapid Fire</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/10 group-hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/15 backdrop-blur-xs text-xs font-bold text-white transition-all shadow-2xs">
                <span className="font-mono">{questionCount || 10} টি প্রশ্ন</span>
                <ArrowRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </>
          )}
        </button>

        <AnimatePresence>
          {generatedQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-slate-100 pt-6 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Generated Questions
                      </h3>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-mono">
                        {generatedQuestions.length} টি
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleClearCurrent}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 transition-all shadow-2xs active:scale-95 cursor-pointer"
                    title="সব প্রশ্ন স্ক্রিন থেকে ক্লিয়ার করুন"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>ক্লিয়ার</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {generatedQuestions.map((q, idx) => {
                  const isFirst = idx === 0;
                  const isSentBulk = isSending && isFirst && currentSendStatus === 'sent';
                  const isCurrentlySendingBulk = isSending && isFirst && currentSendStatus === 'sending';
                  const isWaitingNextBulk = isSending && isFirst && currentSendStatus === 'sent' && countdownSeconds !== null;
                  const isPendingBulk = isSending && !isFirst;

                  const isSendingThisSingle = sendingSingleIdx === idx;
                  const isSentThisSingle = sentSingleIdx === idx;

                  const isAnySending = isSending || sendingSingleIdx !== null;

                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 group shadow-2xs hover:shadow-xs ${
                        isCurrentlySendingBulk || isSendingThisSingle
                          ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                          : isWaitingNextBulk
                            ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/25 shadow-sm'
                            : isSentBulk || isSentThisSingle
                              ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-400/20'
                              : 'bg-white hover:bg-slate-50/50 border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 transition-colors shadow-2xs mt-0.5 ${
                            isSentBulk || isWaitingNextBulk || isSentThisSingle
                              ? 'bg-emerald-600 text-white'
                              : isCurrentlySendingBulk || isSendingThisSingle
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 border border-slate-200/80'
                          }`}
                        >
                          {idx + 1}
                        </span>

                        <div className="space-y-2 flex-1 min-w-0">
                          <p className="text-slate-800 text-[13px] sm:text-sm font-semibold leading-relaxed select-text">
                            {q.question}
                          </p>

                          {(isSending || isSendingThisSingle || isSentThisSingle) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {(isSentBulk || isWaitingNextBulk || isSentThisSingle) && (
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs animate-fade-in">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                  <span>Sent (টেলিগ্রামে পাঠানো হয়েছে)</span>
                                </span>
                              )}
                              {(isCurrentlySendingBulk || isSendingThisSingle) && (
                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md flex items-center gap-1.5 animate-pulse">
                                  <div className="w-2.5 h-2.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                  <span>টেলিগ্রামে পাঠানো হচ্ছে...</span>
                                </span>
                              )}
                              {isWaitingNextBulk && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md flex items-center gap-1.5 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
                                  <span>পরবর্তী প্রশ্ন পাঠানো হবে:</span>
                                  <strong className="font-mono text-amber-950 font-black text-[11px] bg-white px-1.5 py-0.2 rounded border border-amber-300">
                                    {countdownSeconds}s
                                  </strong>
                                  <span>পর</span>
                                </span>
                              )}
                              {isPendingBulk && (
                                <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200/60">
                                  অপেক্ষমান (Pending)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                        <button
                          type="button"
                          disabled={isAnySending}
                          onClick={() => handleSendSingleQuestion(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                            isSentThisSingle
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                              : isSendingThisSingle
                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                                : 'bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 hover:border-transparent active:scale-95'
                          } disabled:opacity-40 disabled:pointer-events-none`}
                          title="শুধুমাত্র এই প্রশ্নটি টেলিগ্রামে পাঠান"
                        >
                          {isSendingThisSingle ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>পাঠানো হচ্ছে...</span>
                            </>
                          ) : isSentThisSingle ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Sent</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                              <span>পাঠান</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={isAnySending}
                          onClick={() => handleDeleteSingleQuestion(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200/60 transition-all disabled:opacity-30 cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-4">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/90 flex items-center justify-center text-indigo-600 shadow-2xs">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Dispatch Configuration</h4>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          Telegram
                        </span>
                      </div>
                    </div>
                  </div>
                  {activeChannelId && (
                    <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Ready to Broadcast</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  <div className="lg:col-span-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Target Channel</span>
                      </label>
                      {activeChannelId && (
                        <span className="text-[10px] font-mono font-semibold text-slate-400">
                          {activeChannelId}
                        </span>
                      )}
                    </div>

                    {channels.length > 0 ? (
                      <div className="relative">
                        <select
                          value={selectedChannelId || (customChannelId ? '__custom__' : defaultChannelId)}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setSelectedChannelId('');
                            } else {
                              setSelectedChannelId(e.target.value);
                              setCustomChannelId('');
                            }
                          }}
                          className="w-full appearance-none bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-all cursor-pointer pr-9"
                        >
                          {channels.map((chan) => (
                            <option key={chan.id} value={chan.id}>📢 {chan.name} ({chan.id})</option>
                          ))}
                          <option value="__custom__">✍️ Custom Chat ID...</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={customChannelId}
                        onChange={(e) => setCustomChannelId(e.target.value)}
                        placeholder={defaultChannelId || "@your_channel_id"}
                        className="w-full bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-all placeholder-slate-400"
                      />
                    )}

                    {(!selectedChannelId && (channels.length === 0 || customChannelId)) && (
                      <div className="pt-1 animate-fade-in">
                        <input
                          type="text"
                          value={customChannelId}
                          onChange={(e) => setCustomChannelId(e.target.value)}
                          placeholder="@channel_username বা -100xxxxxxxxxx"
                          className="w-full bg-white border border-indigo-200 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-2xs transition-all placeholder-slate-400"
                        />
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Sending Cadence</span>
                      </label>
                      <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                        {delaySeconds}s delay
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50/80 border border-slate-200/90 rounded-xl shadow-2xs">
                      {[3, 5, 10, 30, 45, 60].map((sec) => {
                        const isSelected = delaySeconds === sec;
                        return (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setDelaySeconds(sec)}
                            className={`flex-1 min-w-[36px] py-1.5 rounded-lg text-xs font-bold transition-all text-center ${isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                            }`}
                          >
                            {sec}s
                          </button>
                        );
                      })}

                      <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200">
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={delaySeconds}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              setDelaySeconds(Math.max(1, Math.min(300, val)));
                            }
                          }}
                          className="w-12 bg-white border border-slate-200 rounded-lg py-1 text-slate-800 font-extrabold text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                          title="Custom seconds"
                        />
                        <span className="text-[10px] font-bold text-slate-400 pr-1">s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isSending && (
                <div className="space-y-2 animate-fade-in">
                  {countdownSeconds !== null ? (
                    <div className="bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-100/60 border border-amber-200/90 text-amber-900 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-200/90 flex items-center justify-center text-amber-800 shrink-0 shadow-xs">
                          <Timer className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              প্রশ্ন {sendingProgress} / {totalToSend} টেলিগ্রামে পাঠানো হয়েছে!
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                              <Check className="w-3 h-3 text-emerald-600" /> Sent
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800 font-medium">
                            কাউন্টডাউন শেষে এটি প্যানেল হতে রিমুভ হয়ে পরবর্তী প্রশ্ন পাঠানো হবে...
                          </p>
                          <div className="w-full max-w-xs bg-amber-200/70 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.round(((sendingProgress || 1) / Math.max(1, totalToSend)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-amber-300 shadow-xs">
                          <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                          <span className="text-lg font-black font-mono text-amber-950">{countdownSeconds}s</span>
                          <span className="text-[10px] font-bold text-amber-700">বাকি</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { cancelSendingRef.current = true; }}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                          title="পাঠানো থামান"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>থামান</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-indigo-50/90 text-indigo-950 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-indigo-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            টেলিগ্রাম চ্যানেলে প্রশ্ন পাঠানো হচ্ছে... ({sendingProgress}/{totalToSend})
                          </div>
                          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
                            Telegram Poll তৈরি ও ব্রডকাস্ট প্রক্রিয়াধীন
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        <span className="font-mono font-bold bg-white px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 shadow-2xs">
                          {Math.round(((sendingProgress || 1) / Math.max(1, totalToSend)) * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => { cancelSendingRef.current = true; }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 flex items-center gap-1 transition-all active:scale-95"
                          title="পাঠানো থামান"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>থামান</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {sendResult && (
                <div className="bg-emerald-50 text-emerald-900 p-4 rounded-xl flex items-center gap-2.5 text-xs border border-emerald-200 shadow-xs animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{sendResult}</span>
                </div>
              )}

              <button
                onClick={handleSendToTelegram}
                disabled={isSending}
                className={`w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl font-black text-sm tracking-wide transition-all duration-200 shadow-md active:scale-[0.99] flex items-center justify-between group cursor-pointer disabled:cursor-not-allowed ${
                  isSending
                    ? countdownSeconds !== null
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                      : 'bg-indigo-600 opacity-90 text-white shadow-indigo-600/20'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white hover:shadow-xl hover:shadow-indigo-500/20'
                }`}
              >
                {isSending ? (
                  countdownSeconds !== null ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                        <span className="font-bold">পরবর্তী প্রশ্ন পাঠানো হবে {countdownSeconds}s পর...</span>
                      </div>
                      <span className="font-mono text-xs bg-white/20 px-2.5 py-1 rounded-lg">
                        {sendingProgress}/{totalToSend}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="font-bold">টেলিগ্রামে পাঠানো হচ্ছে ({sendingProgress}/{totalToSend})...</span>
                      </div>
                      <span className="font-mono text-xs bg-white/20 px-2.5 py-1 rounded-lg">
                        {Math.round(((sendingProgress || 1) / Math.max(1, totalToSend)) * 100)}%
                      </span>
                    </div>
                  )
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs shadow-2xs">
                        <Send className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <div className="text-left leading-tight">
                        <div className="text-sm font-bold text-white">টেলিগ্রাম চ্যানেলে ব্রডকাস্ট করুন</div>
                        <div className="text-[11px] font-medium text-indigo-100/90">Send to Telegram Channel</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/20 backdrop-blur-xs text-xs font-bold text-white transition-all">
                      <span className="font-mono">{generatedQuestions.length} টি প্রশ্ন</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showClearModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative space-y-4 text-center"
              >
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  title="বন্ধ করুন"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-2xs">
                  <Trash2 className="w-6 h-6 text-rose-500" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-extrabold text-slate-800">
                    সব প্রশ্ন ক্লিয়ার করবেন?
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    বর্তমান স্ক্রিনের সবগুলো প্রশ্ন মুছে যাবে। আপনি কি নিশ্চিত যে আপনি এটি করতে চান?
                  </p>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClearModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer active:scale-95"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmClear}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/25 transition-all cursor-pointer active:scale-95"
                  >
                    হ্যাঁ, ক্লিয়ার করুন
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

