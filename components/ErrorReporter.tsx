'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Send } from 'lucide-react';
import { uploadErrorReport } from '../lib/supabase';

export default function ErrorReporter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, isError: boolean) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, isError });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const file = fileRef.current?.files?.[0];
      await uploadErrorReport(email, content, file);
      showToast('오류 제보가 성공적으로 접수되었습니다!', false);
      setIsExpanded(false);
      setEmail('');
      setContent('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      showToast('제보 중 문제가 발생했습니다: ' + msg, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
            style={{ backgroundColor: toast.isError ? '#EF4444' : '#10B981' }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--color-meritz-primary)]" />
                  오류 제보
                </h3>
                <button onClick={() => setIsExpanded(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="이메일 (선택)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[var(--color-meritz-primary)] transition-colors"
                />
                <textarea
                  placeholder="어떤 문제가 발생했나요?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={4}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[var(--color-meritz-primary)] resize-none transition-colors"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,image/*"
                  className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !content}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--color-meritz-primary)] text-white text-sm font-black disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? '처리 중...' : '제보하기'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.button
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2 bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-lg hover:bg-gray-700 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              오류 제보
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
