'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ManagerInfo } from '../lib/types';

interface ManagerBadgeProps {
  managerInfo: ManagerInfo | null;
}

export default function ManagerBadge({ managerInfo }: ManagerBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isExpanded) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isExpanded]);

  if (!managerInfo) return null;

  const progressPct =
    managerInfo.level >= 10
      ? 100
      : Math.min(100, Math.round((managerInfo.exp / managerInfo.required) * 100));

  return (
    <div ref={containerRef} className="fixed top-4 right-4 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute top-14 right-0 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 flex flex-col gap-4"
          >
            <div className="flex items-center gap-4">
              <img
                src={`/level/lv${managerInfo.level}.png`}
                alt={`레벨 ${managerInfo.level}`}
                className="w-16 h-16 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div>
                <p className="text-xs text-gray-400 font-bold">매니저</p>
                <p className="text-lg font-black text-gray-800">{managerInfo.name}</p>
                <p className="text-sm font-black text-[var(--color-meritz-primary)]">LV.{managerInfo.level}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                <span>경험치</span>
                <span>{managerInfo.exp} / {managerInfo.required}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-2 rounded-full bg-[var(--color-meritz-primary)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {managerInfo.level >= 10
                  ? '최고 레벨에 도달했습니다!'
                  : `다음 레벨까지 ${managerInfo.required - managerInfo.exp}회 남았습니다.`}
              </p>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm rounded-2xl px-4 py-2 flex items-center gap-2 hover:shadow-md transition-all"
      >
        <div className="w-8 h-8 rounded-xl bg-[var(--color-meritz-primary)] flex items-center justify-center text-white text-xs font-black">
          {managerInfo.level}
        </div>
        <div className="text-left">
          <p className="text-[10px] font-bold text-gray-400 leading-none">LV.{managerInfo.level}</p>
          <p className="text-xs font-black text-gray-800 leading-tight">{managerInfo.name}</p>
        </div>
      </button>
    </div>
  );
}
