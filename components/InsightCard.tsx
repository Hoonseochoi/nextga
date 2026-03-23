'use client';

import { motion } from 'framer-motion';
import { formatKoAmount } from '../lib/analyzer';

interface InsightCardProps {
  grandTotalMin: number;
  grandTotalMax: number;
  customerName?: string;
  expertName?: string;
  expertImgSrc: string; // URL or Base64
}

export default function InsightCard({
  grandTotalMin,
  grandTotalMax,
  customerName = '고객',
  expertName = '메리',
  expertImgSrc
}: InsightCardProps) {
  const total5Min = grandTotalMin * 5;
  const total5Max = grandTotalMax * 5;

  let total5Display = formatKoAmount(total5Min);
  if (total5Min !== total5Max) {
    total5Display = `${formatKoAmount(total5Min)} ~ ${formatKoAmount(total5Max)}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="premium-card rounded-3xl p-6 shadow-xl border-none insight-card-gradient animate-insight relative overflow-hidden group mb-8"
    >
      {/* Background Decoration */}
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors"></div>
      
      <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-red-100 border-2 border-white ring-1 ring-red-100 bg-white">
            <img 
              src={expertImgSrc} 
              alt={`보험전문가 ${expertName}`} 
              className="w-full h-full object-cover object-top" 
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-md uppercase tracking-tighter">
            Expert
          </div>
        </div>
        <div className="text-center sm:text-left flex-1">
          <p className="text-gray-500 text-[13px] font-bold mb-1 opacity-80">
            🛡️ <span className="text-gray-400">보험전문가 <b className="text-gray-600">{expertName}</b>의 insight : 전문 통계에 의하면 암치료는 5년정도 받는대요 !</span>
          </p>
          <h3 className="text-lg sm:text-xl font-medium text-gray-800 leading-relaxed">
            <span className="font-black text-[var(--primary-color)] underline decoration-red-200 underline-offset-4">{customerName}</span>님이 
            <span className="font-bold text-gray-900 mx-1">5년간</span> 보장받을 수 있는 
            <span className="font-black text-gray-900 border-b-2 border-red-500/30">암 치료비</span>는 최대
          </h3>
          <div className="mt-2 flex items-baseline gap-2 justify-center sm:justify-start">
            <span className="text-3xl sm:text-4xl font-black text-[var(--primary-color)] tracking-tight font-outfit">
              {total5Display}
            </span>
            <span className="text-gray-400 text-xs font-bold ml-1">입니다.</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-3 font-medium tracking-tight leading-tight">
            * 위 금액은 아래과정에서 산출된 암 치료비 합산의 단순히 5배를 곱한 값입니다. 실제 보장금액과 상이합니다.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
