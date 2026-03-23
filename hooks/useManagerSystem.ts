'use client';

import { useState, useCallback } from 'react';
import {
  getManagerByCode,
  logManagerActivity,
  logUnrecognizedUpload,
  calculateLevelFromCount,
} from '../lib/supabase';
import type { ManagerInfo } from '../lib/types';

interface UseManagerSystemReturn {
  managerInfo: ManagerInfo | null;
  recognizeAndLog: (code: string, fileName: string) => Promise<void>;
  logUnrecognized: (fileName: string) => Promise<void>;
}

export function useManagerSystem(): UseManagerSystemReturn {
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null);

  const recognizeAndLog = useCallback(async (code: string, fileName: string) => {
    try {
      const manager = await getManagerByCode(code);
      if (!manager) {
        await logUnrecognizedUpload(fileName);
        return;
      }

      const { totalCount } = await logManagerActivity(code, manager.name, fileName);
      const { level, exp, required } = calculateLevelFromCount(totalCount);

      setManagerInfo({
        code,
        name: manager.name,
        level,
        exp,
        required,
        expertImageUrl: manager.expertImageUrl,
        count: totalCount,
      });
    } catch (err) {
      console.error('매니저 인식 실패:', err);
    }
  }, []);

  const logUnrecognized = useCallback(async (fileName: string) => {
    try {
      await logUnrecognizedUpload(fileName);
    } catch (err) {
      console.error('미인식 업로드 기록 실패:', err);
    }
  }, []);

  return { managerInfo, recognizeAndLog, logUnrecognized };
}
