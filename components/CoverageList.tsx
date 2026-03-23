'use client';

import { motion } from 'framer-motion';
import { Shield, ShieldAlert, Activity, HeartPulse } from 'lucide-react';
import { formatKoAmount, formatDisplayAmount } from '../lib/analyzer';

interface SubItem {
  name: string;
  amount: string;
  maxAmount?: string;
  source: string;
  hiddenInDetail?: boolean;
  sub?: string[];
}

interface SummaryGroup {
  displayName: string;
  totalMin: number;
  totalMax: number;
  items: SubItem[];
}

interface CoverageListProps {
  summaryMap: Map<string, SummaryGroup>;
  grandTotalMin: number;
  grandTotalMax: number;
}

const getSummaryIcon = (name: string) => {
  if (name.includes('표적')) return <ShieldAlert className="w-10 h-10 text-[var(--primary-color)]" />;
  if (name.includes('면역') || name.includes('약물')) return <Activity className="w-10 h-10 text-emerald-500" />;
  if (name.includes('수술')) return <HeartPulse className="w-10 h-10 text-rose-500" />;
  return <Shield className="w-10 h-10 text-blue-500" />;
};

export default function CoverageList({ summaryMap, grandTotalMin, grandTotalMax }: CoverageListProps) {
  if (summaryMap.size === 0) return null;

  let headerAmountStr = formatKoAmount(grandTotalMin);
  if (grandTotalMin !== grandTotalMax) {
    headerAmountStr = `${formatKoAmount(grandTotalMin)} ~ ${formatKoAmount(grandTotalMax)}`;
  }

  const sortedArray = Array.from(summaryMap.entries()).sort((a, b) => {
    const priorities = ["표적", "면역", "양성자"];
    const getPriority = (n: string) => {
      for (let i = 0; i < priorities.length; i++) {
        if (n.includes(priorities[i])) return i;
      }
      return 99;
    };
    return getPriority(a[0]) - getPriority(b[0]);
  });

  return (
    <div className="w-full">
      <div className="text-lg font-black mb-4 flex items-center gap-2 text-[var(--primary-color)]">
        <span>🛡️ 집계된 암 치료 보장금액 합계</span>
        <span className="text-[1.1em] text-[var(--primary-dark)] ml-3 font-outfit">{headerAmountStr}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {sortedArray.map(([name, data], idx) => {
          let totalDisplay = formatKoAmount(data.totalMin);
          const hasRange = data.totalMin !== data.totalMax;
          if (hasRange) {
            totalDisplay = `${formatKoAmount(data.totalMin)}~${formatKoAmount(data.totalMax)}`;
          }

          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="premium-card p-5 rounded-3xl flex flex-col justify-start gap-4 transition-all duration-300 group hover:shadow-xl border border-gray-100 bg-white"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between min-h-[64px]">
                  <div className="w-14 h-14 flex items-center justify-center bg-gray-50 rounded-2xl">
                    {getSummaryIcon(name)}
                  </div>
                  <div className="text-right pt-1 flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">COVERAGE TOTAL</p>
                    {hasRange ? (
                      <div className="flex flex-col items-end leading-tight">
                        <span className="text-2xl font-black text-red-600 font-outfit pr-8">{formatKoAmount(data.totalMin)}~</span>
                        <span className="text-2xl font-black text-red-600 font-outfit">{formatKoAmount(data.totalMax)}</span>
                      </div>
                    ) : (
                      <p className="text-2xl font-black text-[var(--primary-bright)] font-outfit leading-tight break-keep">
                        {totalDisplay}
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-px w-full bg-gray-50 border-t border-dashed border-gray-200"></div>

                <div className="flex-1">
                  <h4 className="text-sm font-black text-gray-800 mb-2 leading-tight">{name}</h4>
                  
                  <div className="flex flex-col gap-3">
                    {data.items.map((sub, i) => {
                      let truncatedSource = sub.source;
                      if (truncatedSource.length > 25) {
                        truncatedSource = truncatedSource.substring(0, 25) + "...";
                      }

                      return (
                        <div key={i} className="pl-2 border-l-2 border-red-500/10 group/row">
                          <div className="flex items-center justify-between text-[11px] font-bold text-gray-700/90 mb-0.5">
                            <span className="truncate mr-2 flex-1" title={sub.source}>ㄴ {truncatedSource}</span>
                          </div>

                          {sub.sub && sub.sub.length > 0 ? (
                            sub.sub.map((inner, j) => {
                              const parts = inner.trim().split(' ');
                              const iAmt = parts.pop();
                              const iName = parts.join(' ');
                              return (
                                <div key={j} className="text-[10px] mt-1 flex items-center justify-between font-medium text-gray-400">
                                  <span className="truncate mr-2 flex-1 pl-3">ㄴ {iName}</span>
                                  <span className="whitespace-nowrap flex-shrink-0 group-hover/row:text-red-400 transition-colors">{iAmt}</span>
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
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
