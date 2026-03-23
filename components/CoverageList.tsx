'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import {
  findDetails,
  formatDisplayAmount,
  parseKoAmount,
} from '../lib/analyzer';
import type {
  CoverageItem,
  CoverageDetailEntry,
  DetailItem,
  VariantEntry,
  PassthroughEntry,
  PassthroughDualEntry,
  JongEntry,
} from '../lib/types';

interface CoverageListProps {
  rawCoverages: CoverageItem[];
}

function getCoverageIcon(name: string): string {
  if (name.includes('암') && name.includes('수술')) return '🔪';
  if (name.includes('방사선')) return '☢️';
  if (name.includes('항암') || name.includes('약물')) return '💊';
  if (name.includes('입원')) return '🏥';
  if (name.includes('진단')) return '🩺';
  if (name.includes('로봇') || name.includes('다빈치')) return '🤖';
  return '🛡️';
}

function resolveDetails(item: CoverageItem): DetailItem[] | null {
  const details = findDetails(item.name);
  if (!details) return null;

  if (Array.isArray(details)) return details as DetailItem[];

  type TypedEntry = VariantEntry | PassthroughEntry | PassthroughDualEntry | JongEntry;
  const typed = details as TypedEntry;
  switch (typed.type) {
    case 'variant': {
      const amountVal = parseKoAmount(item.amount);
      let data = typed.data[amountVal.toString()];
      if (!data) {
        if (amountVal > 6000) data = typed.data['8000'] ?? typed.data['10000'];
        else if (amountVal > 3000) data = typed.data['5000'] ?? typed.data['4000'];
        else if (amountVal > 1000) data = typed.data['2000'] ?? typed.data['1000'];
        if (!data && typed.data['10000']) data = typed.data['10000'];
      }
      return data ?? null;
    }
    case 'passthrough': {
      return [{ name: typed.displayName, amount: item.amount }];
    }
    case 'passthrough-dual': {
      return [{ name: typed.displayName, amount: item.amount }];
    }
    case '26jong': {
      return [{ name: typed.detailName, amount: item.amount }];
    }
    default:
      return null;
  }
}

export default function CoverageList({ rawCoverages }: CoverageListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const sorted = [...rawCoverages].sort((a, b) => {
    const aHas = !!findDetails(a.name);
    const bHas = !!findDetails(b.name);
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return 0;
  });

  return (
    <div className="w-full">
      <button
        onClick={() => setIsCollapsed((v) => !v)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <h3 className="text-base font-black text-gray-700">
          📋 전체 보장 내역 ({rawCoverages.length}건)
        </h3>
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
          <span>{isCollapsed ? '펼치기' : '접기'}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
      {!isCollapsed && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ overflow: 'hidden' }}
      >
      <div className="flex flex-col gap-3">
        {sorted.map((item, idx) => {
          const resolvedDetails = resolveDetails(item);
          const isExpanded = expandedIds.has(item.id);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`
                bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-3
                ${resolvedDetails ? 'cursor-pointer hover:border-red-200 transition-colors' : ''}
              `}
              onClick={() => resolvedDetails && toggleExpand(item.id)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 text-base shadow-inner flex-shrink-0">
                    {getCoverageIcon(item.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-gray-800 truncate" title={item.name}>
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] font-medium text-gray-400">가입담보리스트 추출 항목</p>
                      {resolvedDetails && (
                        <span className="text-[9px] font-black text-red-400 bg-red-50 px-1.5 py-0.5 rounded leading-none">
                          세부내역 {isExpanded ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-lg font-black text-[var(--color-meritz-primary)]"
                    style={{ fontFamily: 'var(--font-outfit)' }}
                  >
                    {formatDisplayAmount(item.amount)}
                  </span>
                  {resolvedDetails && (
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  )}
                </div>
              </div>

              <AnimatePresence>
              {resolvedDetails && isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                  className="pt-4 border-t border-gray-100"
                >
                  <p className="text-[11px] font-black text-red-600 mb-3 flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-red-600 rounded-full inline-block" /> 상세 보장 내역
                  </p>
                  <div className="space-y-3">
                    {resolvedDetails.map((det, i) => (
                      <div key={i} className="flex flex-col text-[11px]">
                        <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg">
                          <span className="font-bold text-gray-700 mr-2 flex-1">{det.name}</span>
                          <span className="font-black text-gray-900">{formatDisplayAmount(det.amount)}</span>
                        </div>
                        {det.sub?.map((sub, j) => {
                          const parts = sub.trim().split(' ');
                          const subAmt = parts.pop() ?? '';
                          const subName = parts.join(' ');
                          return (
                            <div key={j} className="flex justify-between pl-4 mt-1.5 text-[10px] text-gray-400/80 font-medium">
                              <span className="flex-1 mr-2 flex items-start gap-1">
                                <span className="text-gray-300">ㄴ</span>
                                <span>{subName}</span>
                              </span>
                              <span className="flex-shrink-0">{subAmt}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
