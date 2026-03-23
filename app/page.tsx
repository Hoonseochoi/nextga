'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download } from 'lucide-react';
import { usePdfScanner } from '../hooks/usePdfScanner';
import { useManagerSystem } from '../hooks/useManagerSystem';
import { useCounter } from '../hooks/useCounter';
import { exportAsImage } from '../lib/export';
import UploadZone from '../components/UploadZone';
import InsightCard from '../components/InsightCard';
import SummaryGrid from '../components/SummaryGrid';
import CoverageList from '../components/CoverageList';
import ManagerBadge from '../components/ManagerBadge';
import ErrorReporter from '../components/ErrorReporter';

export default function Home() {
  const { isScanning, progressPercent, statusText, scanResult, error, scanFile, reset } = usePdfScanner();
  const { managerInfo, recognizeAndLog, logUnrecognized } = useManagerSystem();
  const { counter, increment } = useCounter();

  // 스캔 완료 시 매니저 인식 + 카운터 증가
  useEffect(() => {
    if (!scanResult) return;

    if (scanResult.managerCode) {
      recognizeAndLog(scanResult.managerCode, scanResult.fileName);
    } else {
      logUnrecognized(scanResult.fileName);
    }

    if (scanResult.rawCoverages.length > 0) {
      increment();
    }
  }, [scanResult, recognizeAndLog, logUnrecognized, increment]);

  const handleFileSelect = (file: File) => {
    scanFile(file);
  };

  const handleExport = () => {
    if (scanResult) {
      exportAsImage(scanResult.fileName).catch(console.error);
    }
  };

  return (
    <main className="min-h-screen text-gray-900 selection:bg-red-500/30">
      <ManagerBadge managerInfo={managerInfo} />
      <ErrorReporter />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16 flex flex-col items-center gap-8">
        {/* 분석 횟수 카운터 — 랜딩/분석 양쪽 모두 상단 중앙 표시 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm rounded-full px-4 py-2"
        >
          {/* LIVE 인디케이터 */}
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-[10px] font-black text-red-500 tracking-widest uppercase">Live</span>
          </span>
          <span className="w-px h-3 bg-gray-200" />
          {/* TODAY */}
          <span className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today</span>
            <span className="text-sm font-black text-gray-800" style={{ fontFamily: 'var(--font-outfit)' }}>
              {counter.daily.toLocaleString()}
            </span>
          </span>
          <span className="w-px h-3 bg-gray-200" />
          {/* TOTAL */}
          <span className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
            <span className="text-sm font-black text-[var(--color-meritz-primary)]" style={{ fontFamily: 'var(--font-outfit)' }}>
              {counter.total.toLocaleString()}
            </span>
          </span>
        </motion.div>

        <AnimatePresence mode="wait">
          {!scanResult && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md flex flex-col items-center gap-8"
            >
              <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 mb-4">
                  암 보장 분석기
                </h1>
                <p className="text-lg text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
                  가입제안서 PDF를 업로드하면 암 치료 보장 내역을 즉시 분석해드립니다.
                </p>
              </div>

              <UploadZone
                onFileSelect={handleFileSelect}
                isScanning={isScanning}
                progressPercent={progressPercent}
                statusText={statusText}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium max-w-md w-full"
          >
            ⚠️ {error}
          </motion.div>
        )}

        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-8"
          >
            {/* 캡처 영역: 이름바 + 인사이트카드 + 9개 집계카드 */}
            <div id="capture-zone" className="flex flex-col gap-8">
              <div
                id="file-info-bar"
                className="w-full flex justify-between items-center bg-white/70 backdrop-blur-md p-4 rounded-3xl border border-gray-200/50 shadow-sm sticky top-4 z-40"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-xl font-bold text-[var(--color-meritz-primary)]">
                    {scanResult.customerName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{scanResult.customerName}님</h2>
                    <p className="text-sm font-bold text-[var(--color-meritz-primary)]">보장 분석 결과</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 hover:shadow transition-all text-gray-600"
                    title="이미지로 저장"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={reset}
                    className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 hover:shadow transition-all text-gray-600 group"
                    title="다시 분석하기"
                  >
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  </button>
                </div>
              </div>

              <InsightCard
                customerName={scanResult.customerName}
                grandTotalMin={scanResult.grandTotalMin}
                grandTotalMax={scanResult.grandTotalMax}
                expertName={managerInfo?.expertImageUrl ? managerInfo.name : '메리'}
                expertImageUrl={managerInfo?.expertImageUrl ?? '/mery.png'}
              />

              <SummaryGrid
                summaryMap={scanResult.summaryMap}
                grandTotalMin={scanResult.grandTotalMin}
                grandTotalMax={scanResult.grandTotalMax}
              />
            </div>

            {/* 캡처 제외 영역: 세부 담보 내역 */}
            <CoverageList rawCoverages={scanResult.rawCoverages} />
          </motion.div>
        )}
      </div>
    </main>
  );
}
