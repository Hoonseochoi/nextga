'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, Upload, Send, File as FileIcon } from 'lucide-react';
import { uploadErrorReport } from '../lib/supabase';

export default function ErrorReporter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // Can be toggled externally if needed, but normally true when errors are likely
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expose toggle manually? Not strict, just let the user open it.
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("제보 내용을 입력해주세요.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await uploadErrorReport(email, content, file);
      alert("오류 제보가 성공적으로 접수되었습니다.\n소중한 의견 감사합니다!");
      setIsExpanded(false);
      setContent('');
      setFile(null);
    } catch (err) {
      alert("오류 제보 중 문제가 발생했습니다. 나중에 다시 시도해주세요.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        layout
        initial={{ borderRadius: 32 }}
        className={`bg-gray-900 border border-gray-700 shadow-2xl overflow-hidden text-white transition-all`}
        style={{
           width: isExpanded ? '340px' : 'auto',
        }}
      >
        <motion.div 
          layout="position"
          className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none hover:bg-gray-800 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <Bug className="w-4 h-4 text-red-400" />
          </div>
          {!isExpanded ? (
            <span className="text-sm font-medium whitespace-nowrap text-gray-200 pr-2">
              오류/건의사항 제보하기
            </span>
          ) : (
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-100">오류 제보</span>
              <button 
                className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-5 pt-1 flex flex-col gap-3"
            >
              <div className="space-y-1">
                <input
                  type="email"
                  placeholder="답변 받을 이메일 (선택)"
                  className="w-full bg-gray-800 border-none rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:ring-1 focus:ring-red-500/50 outline-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <textarea
                  placeholder="오류 내용이나 건의사항을 자세히 적어주세요.&#13;&#10;(예: 00보험사 26종이 누락되었어요)"
                  className="w-full bg-gray-800 border-none rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 min-h-[100px] resize-none focus:ring-1 focus:ring-red-500/50 outline-none"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-gray-200 transition-colors bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600">
                  <Upload className="w-3.5 h-3.5" />
                  {file ? <span className="truncate max-w-[120px]">{file.name}</span> : <span>PDF / 스크린샷 첨부</span>}
                  <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} disabled={isSubmitting} />
                </label>
                
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '전송중...' : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      제보하기
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
