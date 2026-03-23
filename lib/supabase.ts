import { createClient } from '@supabase/supabase-js';
import { LEVEL_THRESHOLDS } from './config';

// 환경변수에서 읽기 — 하드코딩 금지
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── 매니저 정보 조회 (managers 테이블) ──
export async function getManagerByCode(
  code: string
): Promise<{ name: string; expertImageUrl: string | null } | null> {
  const { data, error } = await supabaseClient
    .from('managers')
    .select('name, expert_image_url')
    .eq('code', code)
    .single();

  if (error || !data) return null;
  return {
    name: data.name as string,
    expertImageUrl: (data.expert_image_url as string | null) ?? null,
  };
}

// ── 매니저 활동 기록 ──
export async function logManagerActivity(
  code: string,
  name: string,
  fileName: string
): Promise<{ totalCount: number }> {
  const { error: logError } = await supabaseClient
    .from('manager_logs')
    .insert([{ manager_code: code, manager_name: name, file_name: fileName }]);

  if (logError) throw logError;

  const { count, error: countError } = await supabaseClient
    .from('manager_logs')
    .select('*', { count: 'exact', head: true })
    .eq('manager_code', code);

  if (countError) throw countError;
  const totalCount = count ?? 1;

  const levelInfo = calculateLevelFromCount(totalCount);

  const { error: profileError } = await supabaseClient
    .from('manager_profiles')
    .upsert(
      {
        manager_code: code,
        manager_name: name,
        execution_count: totalCount,
        level: levelInfo.level,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'manager_code' }
    );

  if (profileError) throw profileError;
  return { totalCount };
}

// ── 미인식 업로드 기록 ──
export async function logUnrecognizedUpload(fileName: string): Promise<void> {
  await supabaseClient
    .from('unrecognized_uploads')
    .insert([{ file_name: fileName, created_at: new Date().toISOString() }]);
}

// ── 레벨 계산 (순수 함수) ──
export function calculateLevelFromCount(count: number): {
  level: number;
  exp: number;
  required: number;
} {
  let level = 1;
  let prevMin = 0;
  let nextMin: number = LEVEL_THRESHOLDS[1]?.min ?? Infinity;

  for (const t of LEVEL_THRESHOLDS) {
    if (count >= t.min) {
      level = t.level;
      prevMin = t.min;
      nextMin = t.next;
    }
  }

  const exp = level >= 10 ? count : count - prevMin;
  const required = level >= 10 ? count : nextMin - prevMin;

  return { level, exp, required };
}

// ── 오류 제보 ──
export async function uploadErrorReport(
  email: string,
  content: string,
  file?: File
): Promise<void> {
  let attachmentUrl: string | null = null;

  if (file) {
    const ext = file.name.split('.').pop();
    const filePath = `reports/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('error_attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabaseClient.storage
      .from('error_attachments')
      .getPublicUrl(filePath);

    attachmentUrl = data.publicUrl;
  }

  const { error } = await supabaseClient
    .from('error_reports')
    .insert([{ email, content, attachment_url: attachmentUrl }]);

  if (error) throw error;
}

// ── 분석 횟수 카운터 (counterapi.dev) ──
const COUNTER_NS = 'meritz_analyzer';
const TOTAL_KEY = 'meritz_total_analysis';
const API_BASE = 'https://api.counterapi.dev/v1';

function getTodayKey(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');
  return `meritz_daily_${yyyy}${mm}${dd}`;
}

export async function fetchAnalysisCounts(): Promise<{ total: number; daily: number }> {
  try {
    const [totalRes, dailyRes] = await Promise.all([
      fetch(`${API_BASE}/${COUNTER_NS}/${TOTAL_KEY}`),
      fetch(`${API_BASE}/${COUNTER_NS}/${getTodayKey()}`),
    ]);
    const [totalData, dailyData] = await Promise.all([
      totalRes.json(),
      dailyRes.json(),
    ]) as [{ count?: number }, { count?: number }];
    return { total: totalData.count ?? 0, daily: dailyData.count ?? 0 };
  } catch {
    return { total: 0, daily: 0 };
  }
}

export async function incrementAnalysisCounts(): Promise<{ total: number; daily: number } | null> {
  try {
    const [totalRes, dailyRes] = await Promise.all([
      fetch(`${API_BASE}/${COUNTER_NS}/${TOTAL_KEY}/up`),
      fetch(`${API_BASE}/${COUNTER_NS}/${getTodayKey()}/up`),
    ]);
    const [totalData, dailyData] = await Promise.all([
      totalRes.json(),
      dailyRes.json(),
    ]) as [{ count?: number }, { count?: number }];
    return { total: totalData.count ?? 0, daily: dailyData.count ?? 0 };
  } catch {
    return null;
  }
}
