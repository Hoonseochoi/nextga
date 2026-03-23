'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ManagerBadgeProps {
  level: number;
  exp: number;
  required: number;
  count: number;
  name?: string;
}

export default function ManagerBadge({ level, exp, required, count, name = '매니저' }: ManagerBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (badgeRef.current && !badgeRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const progressPercent = level >= 10 ? 100 : Math.min(100, Math.round((exp / required) * 100));

  return (
    <div className="absolute top-4 right-4 z-50 pointer-events-auto" ref={badgeRef}>
      <motion.div 
        layout
        className={`relative ${isExpanded ? 'w-64' : 'w-auto'} overflow-hidden rounded-2xl shadow-lg bg-white/90 backdrop-blur border border-white/20 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer level-theme-${level}`}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Closed State (Simple Badge) */}
        <div className={`flex items-center gap-2 px-4 py-3 ${isExpanded ? 'border-b border-gray-100' : ''}`}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 overflow-hidden ring-2 ring-white/50 relative">
            {/* The image should point to public/level/lv*.png which we need to copy over later */}
            <img src={`/level/lv${level}.png`} alt={`Level ${level}`} className="w-full h-full object-cover scale-[1.15]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-super-tight text-gray-500 uppercase leading-none mb-0.5">Manager</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-gray-800 leading-none">{name}</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm bg-[var(--primary-color)] text-white shadow-sm leading-none flex items-center">
                LV.{level}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded State (Details) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-4"
            >
              <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 mb-0.5">다음 레벨까지</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-gray-800">{exp}</span>
                    <span className="text-sm font-bold text-gray-400">/ {required}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-gray-400 block mb-0.5">총 실행횟수</span>
                  <span className="text-sm font-black text-[var(--primary-color)]">{count}회</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-2 relative shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute top-0 left-0 h-full rounded-full bg-[var(--primary-color)] shadow-[0_0_8px_var(--primary-color)] transition-all duration-300"
                ></motion.div>
                {/* Shine effect */}
                <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]"></div>
              </div>

              <div className="text-center">
                <span className="text-[10px] font-medium text-gray-400">
                  {level >= 10 ? '최고 레벨에 도달했습니다!' : `다음 레벨까지 ${required - exp}회 남았습니다.`}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
