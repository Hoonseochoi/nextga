'use client';

import { useState, useCallback } from 'react';
import { extractTextFromPDF } from '../lib/pdf_extractor';
import { extractRawCoverages, calculateHierarchicalSummary } from '../lib/analyzer';
import type { ScanResult } from '../lib/types';

interface UsePdfScannerReturn {
  isScanning: boolean;
  progressPercent: number;
  statusText: string;
  scanResult: ScanResult | null;
  error: string | null;
  scanFile: (file: File) => Promise<void>;
  reset: () => void;
}

export function usePdfScanner(): UsePdfScannerReturn {
  const [isScanning, setIsScanning] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanFile = useCallback(async (file: File): Promise<void> => {
    setIsScanning(true);
    setProgressPercent(0);
    setStatusText('PDF 분석 준비 중...');
    setError(null);
    setScanResult(null);

    try {
      // 1. 텍스트 추출
      const text = await extractTextFromPDF(file, (pct, msg) => {
        setProgressPercent(pct);
        setStatusText(msg);
      });

      setProgressPercent(85);
      setStatusText('담보 내역 분석 중...');

      // 2. 가계약번호 추출 (매니저 인식용)
      const gaMatch = text.match(/가계약번호\s*[:：]?\s*(\d{9,})/);
      const managerCode = gaMatch ? gaMatch[1].substring(0, 9) : null;

      // 3. 고객명 추출
      let customerName = '고객';
      const tableMatch = text.match(/피보험자\s*\|\s*연령\s*[\r\n]+([^\s|\n\r\t]+)/);
      if (tableMatch?.[1]) {
        customerName = tableMatch[1].trim();
      } else {
        const nameMatch = text.match(/피보험자\s*[:：|]?\s*([^|\n\r\t:：]{2,10})/);
        if (nameMatch?.[1]) {
          const temp = nameMatch[1].trim().split(/[\s|([\]]/)[0];
          if (temp && temp !== '연령' && temp !== '성별') {
            customerName = temp;
          }
        }
      }
      if (customerName.includes('보험료')) customerName = '고객';

      // 4. 담보 분석
      const rawCoverages = extractRawCoverages(text);
      const summaryMap = calculateHierarchicalSummary(rawCoverages);

      // 5. 합계 계산
      let grandTotalMin = 0;
      let grandTotalMax = 0;
      summaryMap.forEach((group) => {
        grandTotalMin += group.totalMin;
        grandTotalMax += group.totalMax;
      });

      setProgressPercent(100);
      setStatusText('분석 완료!');

      setScanResult({
        rawCoverages,
        summaryMap,
        grandTotalMin,
        grandTotalMax,
        customerName,
        managerCode,
        fileName: file.name,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setScanResult(null);
    setError(null);
    setProgressPercent(0);
    setStatusText('');
    setIsScanning(false);
  }, []);

  return { isScanning, progressPercent, statusText, scanResult, error, scanFile, reset };
}
