'use client';

import { motion } from 'framer-motion';
import { Shield, ShieldAlert, Activity, HeartPulse, Zap } from 'lucide-react';
import { formatKoAmount, formatDisplayAmount } from '../lib/analyzer';
import type { SummaryGroup } from '../lib/types';

interface SummaryGridProps {
  summaryMap: Map<string, SummaryGroup>;
  grandTotalMin: number;
  grandTotalMax: number;
}

function getSummaryIcon(name: string) {
  if (name.includes('표적')) return <ShieldAlert className="w-10 h-10 text-[var(--color-meritz-primary)]" />;
  if (name.includes('면역')) return <Activity className="w-10 h-10 text-emerald-500" />;
  if (name.includes('양성자') || name.includes('중입자') || name.includes('방사선')) return <Zap className="w-10 h-10 text-blue-500" />;
  if (name.includes('수술') || name.includes('로봇')) return <HeartPulse className="w-10 h-10 text-rose-500" />;
  return <Shield className="w-10 h-10 text-gray-400" />;
}

export default function SummaryGrid({ summaryMap, grandTotalMin, grandTotalMax }: SummaryGridProps) {
  if (summaryMap.size === 0) return null;

  const headerAmount =
    grandTotalMin !== grandTotalMax
      ? `${formatKoAmount(grandTotalMin)} ~ ${formatKoAmount(grandTotalMax)}`
      : formatKoAmount(grandTotalMin);

  const sorted = Array.from(summaryMap.entries()).sort((a, b) => {
    const priorities = ['표적', '면역', '양성자'];
    const rank = (n: string) => {
      const i = priorities.findIndex((p) => n.includes(p));
      return i === -1 ? 99 : i;
    };
    return rank(a[0]) - rank(b[0]);
  });

  return (
    <div id="summary-section" className="w-full">
      <div className="text-lg font-black mb-4 flex items-center gap-2 text-[var(--color-meritz-primary)]">
        <span>🛡️ 집계된 암 치료 보장금액 합계</span>
        <span
          className="text-[1.1em] ml-3"
          style={{ fontFamily: 'var(--font-outfit)', color: 'var(--color-meritz-primary-dark)' }}
        >
          {headerAmount}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {sorted.map(([name, data], idx) => {
          const hasRange = data.totalMin !== data.totalMax;

          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="p-5 rounded-3xl flex flex-col gap-4 bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between min-h-[64px]">
                <div className="w-14 h-14 flex items-center justify-center bg-gray-50 rounded-2xl">
                  {getSummaryIcon(name)}
                </div>
                <div className="text-right pt-1 flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    COVERAGE TOTAL
                  </p>
                  {hasRange ? (
                    <div className="flex flex-col items-end leading-tight">
                      <span
                        className="text-2xl font-black text-[var(--color-meritz-primary)] pr-4"
                        style={{ fontFamily: 'var(--font-outfit)' }}
                      >
                        {formatKoAmount(data.totalMin)}~
                      </span>
                      <span
                        className="text-2xl font-black text-[var(--color-meritz-primary)]"
                        style={{ fontFamily: 'var(--font-outfit)' }}
                      >
                        {formatKoAmount(data.totalMax)}
                      </span>
                    </div>
                  ) : (
                    <p
                      className="text-2xl font-black text-[var(--color-meritz-primary)] leading-tight break-keep"
                      style={{ fontFamily: 'var(--font-outfit)' }}
                    >
                      {formatKoAmount(data.totalMin)}
                    </p>
                  )}
                </div>
              </div>

              <div className="h-px w-full border-t border-dashed border-gray-200" />

              <div>
                <h4 className="text-sm font-black text-gray-800 mb-2 leading-tight">{name}</h4>
                <div className="flex flex-col gap-3">
                  {data.items.map((sub, i) => {
                    const truncatedSrc =
                      sub.source.length > 25 ? sub.source.substring(0, 25) + '...' : sub.source;

                    return (
                      <div key={i} className="pl-2 border-l-2 border-red-500/10">
                        <div className="text-[11px] font-bold text-gray-700/90 mb-0.5 truncate" title={sub.source}>
                          ㄴ {truncatedSrc}
                        </div>
                        {sub.sub?.length ? (
                          sub.sub.map((inner, j) => {
                            const parts = inner.trim().split(' ');
                            const iAmt = parts.pop() ?? '';
                            const iName = parts.join(' ');
                            return (
                              <div key={j} className="text-[10px] mt-1 flex items-center justify-between font-medium text-gray-400">
                                <span className="truncate mr-2 flex-1 pl-3">ㄴ {iName}</span>
                                <span className="whitespace-nowrap flex-shrink-0">{iAmt}</span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-[10px] mt-1 flex items-center justify-between font-medium text-gray-400">
                            <span className="truncate mr-2 flex-1 pl-3">ㄴ {sub.name}</span>
                            <span className="text-red-500 whitespace-nowrap flex-shrink-0 font-black">
                              {sub.maxAmount && sub.maxAmount !== sub.amount && !sub.amount.includes('(')
                                ? `${formatDisplayAmount(sub.amount)}(${formatDisplayAmount(sub.maxAmount)})`
                                : formatDisplayAmount(sub.amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
