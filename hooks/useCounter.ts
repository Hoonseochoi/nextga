'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAnalysisCounts, incrementAnalysisCounts } from '../lib/supabase';
import type { CounterState } from '../lib/types';

interface UseCounterReturn {
  counter: CounterState;
  increment: () => Promise<void>;
}

export function useCounter(): UseCounterReturn {
  const [counter, setCounter] = useState<CounterState>({ daily: 0, total: 0 });

  useEffect(() => {
    fetchAnalysisCounts().then((data) => setCounter(data));
  }, []);

  const increment = useCallback(async () => {
    const data = await incrementAnalysisCounts();
    if (data) setCounter(data);
  }, []);

  return { counter, increment };
}
