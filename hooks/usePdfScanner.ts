import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { extractTextFromPDF } from '../lib/pdf_extractor';
import { extractRawCoverages, calculateHierarchicalSummary } from '../lib/analyzer';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export function usePdfScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [results, setResults] = useState<any>(null); // Contains raw and summary data
  const [error, setError] = useState<string | null>(null);

  const startScan = async (file: File) => {
    setIsScanning(true);
    setProgressPercent(0);
    setStatusText('PDF 파일 분석 준비 중...');
    setError(null);
    setResults(null);

    try {
      const updateProgress = (percent: number, text: string) => {
        setProgressPercent(percent);
        setStatusText(text);
      };

      const showToast = (msg: string) => {
        console.log("Toast:", msg);
      };

      // 1. Extract Text
      setStatusText('PDF 텍스트 추출 중...');
      const fullText = await extractTextFromPDF(
        file,
        pdfjsLib,
        Tesseract,
        updateProgress,
        showToast,
        console.log
      );

      setProgressPercent(80);
      setStatusText('담보 내역 분석 중...');

      // 2. Analyze Coverages
      const rawCoverages = extractRawCoverages(fullText);
      const summaryMap = calculateHierarchicalSummary(rawCoverages);

      setProgressPercent(100);
      setStatusText('분석 완료!');

      setResults({
        rawCoverages,
        summaryMap
      });
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setResults(null);
    setError(null);
    setProgressPercent(0);
    setStatusText('');
    setIsScanning(false);
  };

  return {
    isScanning,
    progressPercent,
    statusText,
    results,
    error,
    startScan,
    resetScanner
  };
}
