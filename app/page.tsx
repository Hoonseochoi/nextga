'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download } from 'lucide-react';
import usePdfScanner from '../hooks/usePdfScanner';
import UploadZone from '../components/UploadZone';
import InsightCard from '../components/InsightCard';
import CoverageList from '../components/CoverageList';
import ErrorReporter from '../components/ErrorReporter';
import ManagerBadge from '../components/ManagerBadge';

// Temporary dummy image from expert_data.js structure
const MERY_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export default function Home() {
  const {
    isScanning,
    statusText,
    progressPercent,
    results,
    error,
    scanPdf
  } = usePdfScanner();

  // Temporary manager state
  const [managerInfo, setManagerInfo] = useState({
    level: 1,
    exp: 0,
    required: 10,
    count: 0,
    name: '매니저'
  });

  const handleFileSelect = async (file: File) => {
    // Read file as ArrayBuffer and pass to scanPdf
    const buffer = await file.arrayBuffer();
    scanPdf(buffer);
  };

  const handleReset = () => {
    window.location.reload();
  };

  // Extract necessary data from results
  const summaryMap = results?.summaryMap;
  const grandTotalMin = results?.grandTotalMin || 0;
  const grandTotalMax = results?.grandTotalMax || 0;
  const customerName = results?.customerName || '고객';

  return (
    <main className="min-h-screen bg-[#F5F5F7] text-gray-900 font-sans selection:bg-red-500/30">
      <ManagerBadge {...managerInfo} />
      <ErrorReporter />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16 flex flex-col items-center">
        {/* Header section when not yet scanned or scanning */}
        <AnimatePresence mode="wait">
          {!results && (
            <motion.div
              key="header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-10"
            >
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Cancer Coverage Analyzer
              </h1>
              <p className="text-lg text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
                가입제안서 PDF를 업로드하면 암 치료 보장 내역을 즉시 분석해드립니다.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Zone */}
        {!results && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <UploadZone
              onFileSelect={handleFileSelect}
              isScanning={isScanning}
              progressPercent={progressPercent}
              statusText={statusText}
            />
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2 max-w-md w-full"
          >
            ⚠️ {error}
          </motion.div>
        )}

        {/* Results Section */}
        {results && summaryMap && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col items-center gap-8"
          >
            {/* Header for results */}
            <div className="w-full flex justify-between items-center bg-white/50 backdrop-blur-md p-4 rounded-3xl border border-gray-200/50 shadow-sm sticky top-4 z-40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-xl font-bold text-[var(--primary-color)]">
                  {customerName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">{customerName}님</h2>
                  <p className="text-sm font-bold text-[var(--primary-color)]">보장 분석 결과</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 hover:shadow transition-all text-gray-600"
                  title="PDF로 저장 / 인쇄"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleReset}
                  className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 hover:shadow transition-all text-gray-600 group"
                  title="다시 분석하기"
                >
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>
            </div>

            {/* Insight Card */}
            <InsightCard 
              grandTotalMin={grandTotalMin}
              grandTotalMax={grandTotalMax}
              customerName={customerName}
              expertName="전문가"
              expertImgSrc={MERY_B64}
            />

            {/* Coverage List */}
            <CoverageList 
              summaryMap={summaryMap}
              grandTotalMin={grandTotalMin}
              grandTotalMax={grandTotalMax}
            />
          </motion.div>
        )}
      </div>
    </main>
  );
}
