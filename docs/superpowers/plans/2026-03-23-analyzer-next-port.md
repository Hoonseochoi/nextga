# 암보장분석기 Next.js 포팅 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 HTML/JS 기반 암보장분석기를 Next.js 16 App Router + TypeScript strict 환경으로 완전 재작성

**Architecture:** 기존 스켈레톤 파일 전체 교체. lib/(순수 로직) → hooks/(상태 관리) → components/(UI) → page.tsx(오케스트레이터) 계층 분리. 타입은 lib/types.ts 단일 소스.

**Tech Stack:** Next.js 16.2, React 19, TypeScript strict, Tailwind v4, Supabase v2, pdfjs-dist v5, tesseract.js v7, framer-motion v12, html2canvas-pro

**Spec:** `docs/superpowers/specs/2026-03-23-analyzer-next-design.md`

---

## 파일 맵

| 파일 | 액션 | 역할 |
|------|------|------|
| `.env.local` | 생성 | Supabase 자격증명 |
| `next.config.ts` | 수정 | PDF.js worker webpack 설정 |
| `lib/types.ts` | 생성 | 모든 TypeScript 타입 단일 소스 |
| `lib/config.ts` | 교체 | coverageDetailsMap 담보 사전 |
| `lib/analyzer.ts` | 교체 | 순수 분석 로직 |
| `lib/pdf_extractor.ts` | 교체 | PDF.js + Tesseract OCR |
| `lib/supabase.ts` | 교체 | Supabase 클라이언트 + DB 함수 |
| `lib/export.ts` | 생성 | html2canvas-pro 이미지 내보내기 |
| `hooks/usePdfScanner.ts` | 교체 | PDF 처리 + 분석 통합 훅 |
| `hooks/useManagerSystem.ts` | 생성 | 매니저 인식·레벨·Supabase 연동 |
| `hooks/useCounter.ts` | 생성 | counterapi.dev 분석 횟수 훅 |
| `app/layout.tsx` | 교체 | 폰트, lang="ko", 메타데이터 |
| `app/globals.css` | 유지 | 기존 CSS 변수 유지 (수정 불필요) |
| `app/page.tsx` | 교체 | 오케스트레이터 |
| `components/UploadZone.tsx` | 교체 | 드래그앤드롭 + 진행 상태 |
| `components/InsightCard.tsx` | 교체 | 5년 치료비 인사이트 카드 |
| `components/SummaryGrid.tsx` | 생성 | 담보 집계 그리드 |
| `components/CoverageList.tsx` | 교체 | 담보 상세 목록 (클릭 토글) |
| `components/ManagerBadge.tsx` | 교체 | 매니저 배지 + 레벨 패널 |
| `components/ErrorReporter.tsx` | 교체 | 오류 제보 다이나믹 아일랜드 |
| `public/level/lv1~10.png` | 복사 | 레벨 이미지 |

---

## Task 1: 환경 설정 + 기존 스켈레톤 정리

**Files:**
- Create: `.env.local`
- Modify: `next.config.ts`
- Delete: `lib/analyzer.js`, `lib/config.js`, `lib/pdf_extractor.js`

- [ ] **Step 1: .env.local 생성**

```
NEXT_PUBLIC_SUPABASE_URL=https://omgwvnibssizmhovporl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase 대시보드 → Project Settings → API → anon key 붙여넣기>
```
> **주의:** 실제 키값은 절대 플랜 문서나 git에 커밋하지 말 것. `.env.local`은 `.gitignore`에 포함되어 있어야 함.

- [ ] **Step 2: next.config.ts에 PDF.js worker 번들 설정 추가**

```ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // PDF.js v5 worker를 CDN 없이 로컬 번들로 해결
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist/build/pdf.worker.mjs': path.resolve(
        './node_modules/pdfjs-dist/build/pdf.worker.mjs'
      ),
    };
    return config;
  },
};

export default nextConfig;
```
> `lib/pdf_extractor.ts`에서 `new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url)`로
> worker를 참조하면 webpack이 위 alias를 통해 로컬 파일로 해석함. CDN 불필요.

- [ ] **Step 3: 기존 .js 파일 삭제**

```bash
rm lib/analyzer.js lib/config.js lib/pdf_extractor.js
```

- [ ] **Step 4: jspdf 의존성 제거**

```bash
npm uninstall jspdf
```

- [ ] **Step 5: 타입 체크로 검증**

```bash
npx tsc --noEmit
```
예상: 아직 타입 파일이 없으니 임포트 에러 발생 — 정상 (다음 태스크에서 해결)

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: 환경 설정 + 기존 JS 스켈레톤 제거"
```

---

## Task 2: 타입 정의 (lib/types.ts)

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: lib/types.ts 생성**

```ts
// 암보장분석기 공유 타입 — 모든 컴포넌트는 여기서 import

export interface CoverageItem {
  id: number;
  name: string;
  amount: string;
  premium: string;
  period: string;
  original: string;
}

export interface SummaryDetailItem {
  name: string;
  amount: string;
  maxAmount?: string;
  source: string;
  hiddenInDetail?: boolean;
  sub?: string[];
  targetName?: string;
}

export interface SummaryGroup {
  displayName: string;
  totalMin: number;
  totalMax: number;
  items: SummaryDetailItem[];
}

export interface ScanResult {
  rawCoverages: CoverageItem[];
  summaryMap: Map<string, SummaryGroup>;
  grandTotalMin: number;
  grandTotalMax: number;
  customerName: string;
  managerCode: string | null;
  fileName: string;
}

export interface ManagerInfo {
  code: string;
  name: string;
  level: number;
  exp: number;
  required: number;
  expertImageUrl: string | null;
  count: number;
}

export interface LevelThreshold {
  level: number;
  min: number;
  next: number;
}

export interface CounterState {
  daily: number;
  total: number;
}

// coverageDetailsMap에서 사용하는 내부 타입
export interface DetailItem {
  name: string;
  amount: string;
  maxAmount?: string;
  sub?: string[];
  hiddenInDetail?: boolean;
  targetName?: string;
}

export interface VariantEntry {
  type: 'variant';
  data: Record<string, DetailItem[]>;
}

export interface PassthroughEntry {
  type: 'passthrough';
  displayName: string;
}

export interface PassthroughDualEntry {
  type: 'passthrough-dual';
  displayName: string;
  summaryTargets: string[];
}

export interface JongEntry {
  type: '26jong';
  detailName: string;
  summaryItems: Array<{ name: string; targetName: string }>;
}

export type CoverageDetailEntry =
  | DetailItem[]
  | VariantEntry
  | PassthroughEntry
  | PassthroughDualEntry
  | JongEntry;
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```
예상: types.ts 자체는 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add lib/types.ts
git commit -m "feat: lib/types.ts — 공유 TypeScript 타입 정의"
```

---

## Task 3: 담보 사전 (lib/config.ts)

**Files:**
- Create: `lib/config.ts`
- Reference: 기존 `lib/config.js` 내용 (삭제 전 내용 참조)

- [ ] **Step 1: lib/config.ts 생성 — coverageDetailsMap 포팅**

기존 `lib/config.js` (또는 원본 `js/config.js`)의 `coverageDetailsMap` 전체를 TypeScript로 이식.
`currentFileName` 전역 변수는 제거 (훅에서 state로 관리).

```ts
import type { CoverageDetailEntry } from './types';

export const LEVEL_THRESHOLDS = [
  { level: 1, min: 0, next: 2 },
  { level: 2, min: 2, next: 5 },
  { level: 3, min: 5, next: 9 },
  { level: 4, min: 9, next: 14 },
  { level: 5, min: 14, next: 20 },
  { level: 6, min: 20, next: 27 },
  { level: 7, min: 27, next: 35 },
  { level: 8, min: 35, next: 44 },
  { level: 9, min: 44, next: 54 },
  { level: 10, min: 54, next: Infinity },
] as const;

export const coverageDetailsMap: Record<string, CoverageDetailEntry> = {
  // 기존 lib/config.js 또는 js/config.js의 coverageDetailsMap 내용 전체 복사
  // (매우 긴 객체 — 그대로 붙여넣기)
};
```

> **주의:** coverageDetailsMap은 수백 줄의 복잡한 중첩 객체. 기존 js/config.js에서 `coverageDetailsMap` 객체 전체를 그대로 붙여넣고 타입만 추가.

- [ ] **Step 2: 타입 에러 수정**

```bash
npx tsc --noEmit
```
타입 불일치 있으면 해당 항목의 type 필드 확인하여 수정.

- [ ] **Step 3: 커밋**

```bash
git add lib/config.ts
git commit -m "feat: lib/config.ts — coverageDetailsMap TypeScript 이식"
```

---

## Task 4: 분석 로직 (lib/analyzer.ts)

**Files:**
- Create: `lib/analyzer.ts`
- Reference: 원본 `js/analyzer.js`

- [ ] **Step 1: lib/analyzer.ts 생성**

원본 `js/analyzer.js`에서 모든 함수를 TypeScript로 이식. `coverageDetailsMap`은 `lib/config.ts`에서 import.

```ts
import { coverageDetailsMap } from './config';
import type { CoverageItem, SummaryGroup, SummaryDetailItem, DetailItem, CoverageDetailEntry } from './types';

// ── 한국어 금액 파싱 ──
export function parseKoAmount(str: string): number {
  if (!str) return 0;
  let clean = str.replace(/[,원\s]/g, '');
  let total = 0;

  if (clean.includes('억')) {
    const parts = clean.split('억');
    total += (parseInt(parts[0]) || 0) * 10000;
    clean = parts[1] || '';
  }

  if (clean.includes('만')) {
    const parts = clean.split('만');
    let manPart = parts[0];
    let val = 0;
    if (manPart.includes('천')) {
      const p = manPart.split('천');
      val += (parseInt(p[0]) || 0) * 1000;
      manPart = p[1] || '';
    }
    if (manPart.includes('백')) {
      const p = manPart.split('백');
      val += (parseInt(p[0]) || 0) * 100;
      manPart = p[1] || '';
    }
    if (manPart.includes('십')) {
      const p = manPart.split('십');
      val += (parseInt(p[0]) || 0) * 10;
      manPart = p[1] || '';
    }
    val += (parseInt(manPart) || 0);
    total += val;
  } else if (clean) {
    let val = 0;
    if (clean.includes('천')) {
      const p = clean.split('천');
      val += (parseInt(p[0]) || 0) * 1000;
      clean = p[1] || '';
    }
    if (clean.includes('백')) {
      const p = clean.split('백');
      val += (parseInt(p[0]) || 0) * 100;
      clean = p[1] || '';
    }
    if (clean.includes('십')) {
      const p = clean.split('십');
      val += (parseInt(p[0]) || 0) * 10;
      clean = p[1] || '';
    }
    val += (parseInt(clean) || 0);
    total += val;
  }
  return total;
}

// ── 만원 단위 포맷 ──
export function formatKoAmount(val: number): string {
  if (val === 0) return '0원';
  const uk = Math.floor(val / 10000);
  const man = val % 10000;
  let result = '';
  if (uk > 0) result += `${uk}억 `;
  if (man > 0) result += `${man.toLocaleString()}만`;
  return result.trim() + '원';
}

// ── 표시용 금액 정규화 ──
export function formatDisplayAmount(str: string): string {
  if (!str) return str;
  const val = parseKoAmount(str);
  if (val === 0) return str;
  return formatKoAmount(val);
}

// ── coverageDetailsMap 조회 (내보내기: CoverageList에서 사용) ──
export function findDetails(itemName: string): CoverageDetailEntry | undefined {
  // 원본 js/analyzer.js의 findDetails 함수 전체 이식
  let details = coverageDetailsMap[itemName];
  if (!details) {
    if (itemName.includes('암 통합치료비') && (itemName.includes('III') || itemName.includes('Ⅲ'))) {
      details = coverageDetailsMap['암진단및치료비(암 통합치료비III)'];
    } else if (itemName.includes('암 통합치료비') && (itemName.includes('Ⅱ') || itemName.includes('II')) && itemName.includes('비급여')) {
      details = coverageDetailsMap['암 통합치료비Ⅱ(비급여)'];
    } else if (itemName.includes('암 통합치료비') && itemName.includes('주요치료')) {
      details = coverageDetailsMap['암 통합치료비(주요치료)(비급여(전액본인부담 포함), 암중점치료기관(상급 종합병원 포함))'];
    } else if (itemName.includes('암 통합치료비') && itemName.includes('비급여') && itemName.includes('전액본인부담')) {
      details = coverageDetailsMap['암 통합치료비(비급여(전액본인부담 포함), 암중점치료기관(상급종합병원 포함))'];
    } else if (itemName.includes('암 통합치료비') && itemName.includes('기본형')) {
      details = coverageDetailsMap['암 통합치료비(기본형)(암중점치료기관(상급종합병원 포함))'];
    } else if (itemName.includes('암 통합치료비') && itemName.includes('실속형')) {
      details = coverageDetailsMap['암 통합치료비(실속형)(암중점치료기관(상급종합병원 포함))'];
    } else if (itemName.includes('중입자방사선')) {
      details = coverageDetailsMap['항암중입자방사선치료비'];
    } else if (itemName.includes('세기조절방사선')) {
      details = coverageDetailsMap['항암세기조절방사선치료비'];
    } else if (itemName.includes('면역항암약물') || itemName.includes('면역항암')) {
      details = coverageDetailsMap['특정면역항암약물허가치료비'];
    } else if (itemName.includes('표적항암약물') || itemName.includes('표적항암')) {
      details = coverageDetailsMap['표적항암약물허가치료비'];
    } else if (itemName.includes('양성자방사선') || itemName.includes('양성자')) {
      details = coverageDetailsMap['항암양성자방사선치료비'];
    } else if (itemName.includes('26종')) {
      details = coverageDetailsMap['26종항암방사선및약물치료비'];
    } else if (itemName.includes('다빈치') && itemName.includes('로봇')) {
      if (!itemName.includes('특정암') || itemName.includes('제외')) {
        details = coverageDetailsMap['다빈치로봇암수술비'];
      }
    } else if ((itemName.includes('암수술비') || itemName.includes('암 수술비')) && itemName.includes('유사암제외')) {
      details = coverageDetailsMap['암수술비(유사암제외)'];
    } else if (itemName.includes('계속받는') && itemName.includes('항암방사선') && itemName.includes('약물') && itemName.includes('급여')) {
      details = coverageDetailsMap['계속받는 항암방사선약물치료비(급여)'];
    }
  }
  return details;
}

// ── 담보 텍스트 추출 ──
export function extractRawCoverages(text: string): CoverageItem[] {
  // 원본 js/analyzer.js의 extractRawCoverages 함수 전체 이식
  // (console.log → 제거 또는 유지)
  // ... (전체 로직 동일)
}

// ── 계층 집계 ──
export function calculateHierarchicalSummary(results: CoverageItem[]): Map<string, SummaryGroup> {
  // 원본 js/analyzer.js의 calculateHierarchicalSummary 함수 전체 이식
  // ... (전체 로직 동일)
}
```

> **주의:** `extractRawCoverages`와 `calculateHierarchicalSummary`는 원본 로직 그대로 이식. 변경하지 말 것 — 이 로직은 오랜 시간 디버깅된 핵심 엔진.

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add lib/analyzer.ts lib/config.ts
git commit -m "feat: lib/analyzer.ts — 분석 로직 TypeScript 이식"
```

---

## Task 5: PDF 텍스트 추출 (lib/pdf_extractor.ts)

**Files:**
- Create: `lib/pdf_extractor.ts`
- Reference: 원본 `js/pdf_extractor.js`

- [ ] **Step 1: lib/pdf_extractor.ts 생성**

```ts
// PDF.js + Tesseract OCR 폴백
// 'use client' 금지 — lib/ 모듈에는 사용 안 함. 브라우저 전용 코드는 typeof window 가드로 처리.
// 페이지 1 (가계약번호), 3~6 (가입담보리스트) 처리

export async function extractTextFromPDF(
  file: File,
  onProgress: (pct: number, text: string) => void
): Promise<string> {
  // 동적 import — Next.js 서버 사이드 실행 방지
  const pdfjsLib = await import('pdfjs-dist');

  // Worker 설정: pdfjs-dist v5는 모듈 내부에서 worker를 자동 처리
  // 또는 명시적 설정:
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pagesToProcess = [1, 3, 4, 5, 6].filter(p => p <= pdf.numPages);
  const total = pagesToProcess.length;
  let fullText = '';

  for (let idx = 0; idx < pagesToProcess.length; idx++) {
    const pageNum = pagesToProcess[idx];
    onProgress(Math.round((idx / total) * 85), `${pageNum}페이지 분석 중...`);

    let pageText = '';
    const page = await pdf.getPage(pageNum);

    try {
      // 텍스트 레이어 우선
      const content = await page.getTextContent();
      if (content?.items?.length > 0) {
        // 원본 pdf_extractor.js의 Y좌표 기반 줄바꿈 보존 로직 이식
        const items = content.items.map((item: Record<string, unknown>) => ({
          str: item.str as string,
          x: (item.transform as number[])[4],
          y: (item.transform as number[])[5],
          w: item.width as number,
          hasEOL: item.hasEOL as boolean,
        }));

        let lastY: number | null = null;
        let lastX: number | null = null;

        for (const item of items) {
          if (lastY !== null) {
            if (Math.abs(item.y - lastY) > 8) {
              pageText += '\n';
            } else if (lastX !== null && Math.abs(item.x - lastX) > 5) {
              pageText += ' ';
            }
          }
          pageText += item.str;
          if (item.hasEOL) {
            pageText += '\n';
            lastY = null;
          } else {
            lastY = item.y;
            lastX = item.x + item.w;
          }
        }
      }
    } catch {
      // 텍스트 레이어 실패 시 Tesseract OCR 폴백
      try {
        const Tesseract = await import('tesseract.js');
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;

        const result = await Tesseract.default.recognize(canvas, 'kor+eng');
        pageText = result.data.text;
      } catch (ocrErr) {
        console.error(`${pageNum}페이지 OCR 실패:`, ocrErr);
      }
    }

    fullText += pageText + '\n';
  }

  onProgress(100, '텍스트 추출 완료');
  return fullText;
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add lib/pdf_extractor.ts
git commit -m "feat: lib/pdf_extractor.ts — PDF.js + Tesseract OCR TypeScript 이식"
```

---

## Task 6: Supabase 클라이언트 (lib/supabase.ts)

**Files:**
- Modify: `lib/supabase.ts` (전체 교체)

- [ ] **Step 1: lib/supabase.ts 교체**

```ts
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
  return { name: data.name as string, expertImageUrl: data.expert_image_url as string | null };
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

// ── 레벨 계산 ──
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
    const [totalData, dailyData] = await Promise.all([totalRes.json(), dailyRes.json()]) as [
      { count?: number },
      { count?: number }
    ];
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
    const [totalData, dailyData] = await Promise.all([totalRes.json(), dailyRes.json()]) as [
      { count?: number },
      { count?: number }
    ];
    return { total: totalData.count ?? 0, daily: dailyData.count ?? 0 };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add lib/supabase.ts
git commit -m "feat: lib/supabase.ts — env 변수 + TypeScript strict 적용"
```

---

## Task 7: 이미지 내보내기 (lib/export.ts)

**Files:**
- Create: `lib/export.ts`

- [ ] **Step 1: lib/export.ts 생성**

```ts
// html2canvas-pro로 분석 결과를 PNG로 내보내기

export async function exportAsImage(originalFileName: string): Promise<void> {
  const html2canvas = (await import('html2canvas-pro')).default;

  const target = document.querySelector('main');
  if (!target) throw new Error('캡처 대상을 찾을 수 없습니다.');

  // 폰트 로딩 대기
  await document.fonts.ready;

  const finalFileName = `${originalFileName.replace(/\.pdf$/i, '')} 분석.png`;

  const canvas = await html2canvas(target, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#EBEBEB',
    onclone: (clonedDoc: Document) => {
      const cloneMain = clonedDoc.querySelector('main');
      if (!cloneMain) return;

      // 지정 섹션 외 모두 숨김
      const allowedIds = ['file-info-bar', 'insight-section', 'summary-section'];
      Array.from(cloneMain.children).forEach((child) => {
        const el = child as HTMLElement;
        if (!allowedIds.includes(el.id)) {
          el.style.display = 'none';
        }
      });

      // 대상 섹션 강제 노출 + 버튼 숨김
      allowedIds.forEach((id) => {
        const el = clonedDoc.getElementById(id);
        if (el) {
          el.style.display = 'block';
          el.classList.remove('hidden');
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          el.style.animation = 'none';

          // 내보내기/리셋 버튼 숨김
          el.querySelectorAll('button').forEach((btn) => {
            (btn as HTMLElement).style.display = 'none';
          });

          // blur 장식 숨김
          el.querySelectorAll('.blur-3xl').forEach((el) => {
            (el as HTMLElement).style.display = 'none';
          });
        }
      });

      // 폰트 강제 적용
      const style = clonedDoc.createElement('style');
      style.innerHTML = `
        * {
          font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif !important;
          animation: none !important;
          transition: none !important;
        }
      `;
      clonedDoc.head.appendChild(style);
    },
  });

  const imgData = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imgData;
  link.download = finalFileName;
  link.click();
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add lib/export.ts
git commit -m "feat: lib/export.ts — html2canvas-pro 이미지 내보내기"
```

---

## Task 8: PDF 스캐너 훅 (hooks/usePdfScanner.ts)

**Files:**
- Modify: `hooks/usePdfScanner.ts` (전체 교체)

- [ ] **Step 1: hooks/usePdfScanner.ts 교체**

```ts
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
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add hooks/usePdfScanner.ts
git commit -m "feat: hooks/usePdfScanner.ts — PDF 스캐너 훅 완전 재작성"
```

---

## Task 9: 매니저 시스템 훅 (hooks/useManagerSystem.ts)

**Files:**
- Create: `hooks/useManagerSystem.ts`

- [ ] **Step 1: hooks/useManagerSystem.ts 생성**

```ts
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
      // 1. managers 테이블에서 매니저 정보 조회
      const manager = await getManagerByCode(code);
      if (!manager) {
        await logUnrecognizedUpload(fileName);
        return;
      }

      // 2. 활동 기록 + 총 실행 횟수 조회
      const { totalCount } = await logManagerActivity(code, manager.name, fileName);

      // 3. 레벨 계산
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
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add hooks/useManagerSystem.ts
git commit -m "feat: hooks/useManagerSystem.ts — 매니저 인식·레벨 훅"
```

---

## Task 10: 분석 횟수 카운터 훅 (hooks/useCounter.ts)

**Files:**
- Create: `hooks/useCounter.ts`

- [ ] **Step 1: hooks/useCounter.ts 생성**

```ts
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

  // 마운트 시 초기 조회
  useEffect(() => {
    fetchAnalysisCounts().then((data) => setCounter(data));
  }, []);

  const increment = useCallback(async () => {
    const data = await incrementAnalysisCounts();
    if (data) setCounter(data);
  }, []);

  return { counter, increment };
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add hooks/useCounter.ts
git commit -m "feat: hooks/useCounter.ts — 분석 횟수 카운터 훅"
```

---

## Task 11: 레이아웃 (app/layout.tsx)

**Files:**
- Modify: `app/layout.tsx` (전체 교체)

- [ ] **Step 1: app/layout.tsx 교체**

```tsx
import type { Metadata } from 'next';
import { Noto_Sans_KR, Outfit } from 'next/font/google';
import './globals.css';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '암 치료비 보장금액 분석기',
  description: '가입제안서 PDF를 업로드하면 암 치료 보장 내역을 즉시 분석해드립니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: 타입 체크 + 빌드 확인**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add app/layout.tsx
git commit -m "feat: app/layout.tsx — 폰트(Noto Sans KR + Outfit), lang=ko"
```

---

## Task 12: 업로드 존 (components/UploadZone.tsx)

**Files:**
- Modify: `components/UploadZone.tsx` (전체 교체)

- [ ] **Step 1: components/UploadZone.tsx 교체**

드래그앤드롭 + 파일 입력 + 진행 상태 표시 내장.

```tsx
'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isScanning: boolean;
  progressPercent: number;
  statusText: string;
}

export default function UploadZone({
  onFileSelect,
  isScanning,
  progressPercent,
  statusText,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.includes('pdf') && !file.type.startsWith('image/')) return;
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (isScanning) {
    return (
      <div className="w-full p-8 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center animate-pulse">
          <FileText className="w-8 h-8 text-[var(--color-meritz-primary)]" />
        </div>
        <div className="w-full flex flex-col items-center gap-3">
          <p className="text-sm font-bold text-gray-600">{statusText || 'PDF 분석 중...'}</p>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-2 rounded-full bg-[var(--color-meritz-primary)]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-xs text-gray-400 font-medium">{progressPercent}%</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-full p-10 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-200
        flex flex-col items-center gap-4 text-center
        ${isDragging
          ? 'border-[var(--color-meritz-primary)] bg-red-50'
          : 'border-gray-200 bg-white hover:border-[var(--color-meritz-primary)] hover:bg-red-50/30'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <AnimatePresence>
        <motion.div
          key={isDragging ? 'drag' : 'idle'}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center"
        >
          <Upload className="w-8 h-8 text-[var(--color-meritz-primary)]" />
        </motion.div>
      </AnimatePresence>
      <div>
        <p className="text-base font-bold text-gray-700">
          PDF 파일을 드래그하거나 클릭하세요
        </p>
        <p className="text-sm text-gray-400 mt-1">
          가입제안서 PDF 또는 이미지 파일 지원
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add components/UploadZone.tsx
git commit -m "feat: UploadZone — 드래그앤드롭 + 진행 상태 내장"
```

---

## Task 13: 인사이트 카드 (components/InsightCard.tsx)

**Files:**
- Modify: `components/InsightCard.tsx` (전체 교체)

- [ ] **Step 1: components/InsightCard.tsx 교체**

```tsx
'use client';

import { motion } from 'framer-motion';
import { formatKoAmount } from '../lib/analyzer';

interface InsightCardProps {
  customerName: string;
  grandTotalMin: number;
  grandTotalMax: number;
  expertName: string;
  expertImageUrl: string | null;
}

export default function InsightCard({
  customerName,
  grandTotalMin,
  grandTotalMax,
  expertName,
  expertImageUrl,
}: InsightCardProps) {
  const total5Min = grandTotalMin * 5;
  const total5Max = grandTotalMax * 5;

  let totalDisplay = formatKoAmount(total5Min);
  if (total5Min !== total5Max) {
    totalDisplay = `${formatKoAmount(total5Min)} ~ ${formatKoAmount(total5Max)}`;
  }

  return (
    <motion.div
      id="insight-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-3xl p-6 shadow-xl bg-white border border-red-50 relative overflow-hidden"
    >
      {/* 배경 장식 */}
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
        {/* 전문가 이미지 */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-white ring-1 ring-red-100 bg-gray-100">
            {expertImageUrl ? (
              <img
                src={expertImageUrl}
                alt={`보험전문가 ${expertName}`}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[var(--color-meritz-primary)]">
                {expertName.charAt(0)}
              </div>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[var(--color-meritz-primary)] text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-md uppercase tracking-tighter">
            Expert
          </div>
        </div>

        {/* 텍스트 */}
        <div className="text-center sm:text-left flex-1">
          <p className="text-gray-500 text-[13px] font-bold mb-1 opacity-80">
            🛡️{' '}
            <span className="text-gray-400">
              보험전문가 <b className="text-gray-600">{expertName}</b>의 insight : 전문 통계에 의하면 암치료는 5년정도 받는대요 !
            </span>
          </p>
          <h3 className="text-lg sm:text-xl font-medium text-gray-800 leading-relaxed">
            <span className="font-black text-[var(--color-meritz-primary)] underline decoration-red-200 underline-offset-4">
              {customerName}
            </span>
            님이{' '}
            <span className="font-bold text-gray-900 mx-1">5년간</span> 보장받을 수 있는{' '}
            <span className="font-black text-gray-900 border-b-2 border-red-500/30">암 치료비</span>는 최대
          </h3>
          <div className="mt-2 flex items-baseline gap-2 justify-center sm:justify-start">
            <span
              className="text-3xl sm:text-4xl font-black tracking-tight"
              style={{ fontFamily: 'var(--font-outfit)', color: 'var(--color-meritz-primary)' }}
            >
              {totalDisplay}
            </span>
            <span className="text-gray-400 text-xs font-bold ml-1">입니다.</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-3 font-medium tracking-tight leading-tight">
            * 위 금액은 산출된 암 치료비 합산의 단순히 5배를 곱한 값입니다. 실제 보장금액과 상이합니다.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add components/InsightCard.tsx
git commit -m "feat: InsightCard — 5년 치료비 인사이트 카드"
```

---

## Task 14: 집계 그리드 (components/SummaryGrid.tsx)

**Files:**
- Create: `components/SummaryGrid.tsx`

- [ ] **Step 1: components/SummaryGrid.tsx 생성**

기존 `CoverageList.tsx`의 그리드 부분을 분리.

```tsx
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
          const totalDisplay = hasRange
            ? `${formatKoAmount(data.totalMin)} ~ ${formatKoAmount(data.totalMax)}`
            : formatKoAmount(data.totalMin);

          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="p-5 rounded-3xl flex flex-col gap-4 bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* 아이콘 + 합계 */}
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
                      {totalDisplay}
                    </p>
                  )}
                </div>
              </div>

              <div className="h-px w-full border-t border-dashed border-gray-200" />

              {/* 담보명 + 세부 항목 */}
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
                            const iAmt = parts.pop();
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
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add components/SummaryGrid.tsx
git commit -m "feat: SummaryGrid — 담보 집계 카드 그리드"
```

---

## Task 15: 담보 목록 (components/CoverageList.tsx)

**Files:**
- Modify: `components/CoverageList.tsx` (전체 교체)

- [ ] **Step 1: components/CoverageList.tsx 교체**

원본 `ui_renderer.js`의 세부 목록 렌더링 로직 이식. 클릭 시 세부내역 토글.

```tsx
'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import {
  findDetails,
  formatDisplayAmount,
  parseKoAmount,
} from '../lib/analyzer';
import type { CoverageItem, CoverageDetailEntry, DetailItem } from '../lib/types';

interface CoverageListProps {
  rawCoverages: CoverageItem[];
}

// 담보명에 따른 이모지 아이콘
function getCoverageIcon(name: string): string {
  if (name.includes('암') && name.includes('수술')) return '🔪';
  if (name.includes('방사선')) return '☢️';
  if (name.includes('항암') || name.includes('약물')) return '💊';
  if (name.includes('입원')) return '🏥';
  if (name.includes('진단')) return '🩺';
  if (name.includes('로봇') || name.includes('다빈치')) return '🤖';
  return '🛡️';
}

// variant 타입에서 금액에 맞는 데이터 선택
function resolveVariantDetails(details: CoverageDetailEntry, amountStr: string): DetailItem[] | null {
  if (!details || typeof details !== 'object' || !('type' in details)) return null;
  if (details.type !== 'variant') return null;

  const amountVal = parseKoAmount(amountStr);
  let data = details.data[amountVal.toString()];
  if (!data) {
    if (amountVal > 6000) data = details.data['8000'] ?? details.data['10000'];
    else if (amountVal > 3000) data = details.data['5000'] ?? details.data['4000'];
    else if (amountVal > 1000) data = details.data['2000'] ?? details.data['1000'];
    if (!data && details.data['10000']) data = details.data['10000'];
  }
  return data ?? null;
}

// 담보 상세 해석
function resolveDetails(item: CoverageItem): DetailItem[] | null {
  const details = findDetails(item.name);
  if (!details) return null;

  if (Array.isArray(details)) return details as DetailItem[];

  if ('type' in details) {
    if (details.type === 'variant') return resolveVariantDetails(details, item.amount);
    if (details.type === 'passthrough') return [{ name: details.displayName, amount: item.amount }];
    if (details.type === 'passthrough-dual') return [{ name: details.displayName, amount: item.amount }];
    if (details.type === '26jong') return [{ name: details.detailName, amount: item.amount }];
  }
  return null;
}

export default function CoverageList({ rawCoverages }: CoverageListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 세부내역 있는 항목 먼저
  const sorted = [...rawCoverages].sort((a, b) => {
    const aHas = !!findDetails(a.name);
    const bHas = !!findDetails(b.name);
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return 0;
  });

  return (
    <div className="w-full">
      <h3 className="text-base font-black text-gray-700 mb-4">📋 전체 보장 내역 ({rawCoverages.length}건)</h3>
      <div className="flex flex-col gap-3">
        {sorted.map((item, idx) => {
          const resolvedDetails = resolveDetails(item);
          const isExpanded = expandedIds.has(item.id);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`
                bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-3
                ${resolvedDetails ? 'cursor-pointer hover:border-red-200 transition-colors' : ''}
              `}
              onClick={() => resolvedDetails && toggleExpand(item.id)}
            >
              {/* 헤더 행 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 text-base shadow-inner flex-shrink-0">
                    {getCoverageIcon(item.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-gray-800 truncate" title={item.name}>
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] font-medium text-gray-400">가입담보리스트 추출 항목</p>
                      {resolvedDetails && (
                        <span className="text-[9px] font-black text-red-400 bg-red-50 px-1.5 py-0.5 rounded leading-none">
                          세부내역 {isExpanded ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-lg font-black text-[var(--color-meritz-primary)]"
                    style={{ fontFamily: 'var(--font-outfit)' }}
                  >
                    {formatDisplayAmount(item.amount)}
                  </span>
                  {resolvedDetails && (
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  )}
                </div>
              </div>

              {/* 세부내역 */}
              {resolvedDetails && isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-4 border-t border-gray-100"
                >
                  <p className="text-[11px] font-black text-red-600 mb-3 flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-red-600 rounded-full inline-block" /> 상세 보장 내역
                  </p>
                  <div className="space-y-3">
                    {resolvedDetails.map((det, i) => (
                      <div key={i} className="flex flex-col text-[11px]">
                        <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg">
                          <span className="font-bold text-gray-700 mr-2 flex-1">{det.name}</span>
                          <span className="font-black text-gray-900">{formatDisplayAmount(det.amount)}</span>
                        </div>
                        {det.sub?.map((sub, j) => {
                          const parts = sub.trim().split(' ');
                          const subAmt = parts.pop();
                          const subName = parts.join(' ');
                          return (
                            <div key={j} className="flex justify-between pl-4 mt-1.5 text-[10px] text-gray-400/80 font-medium">
                              <span className="flex-1 mr-2 flex items-start gap-1">
                                <span className="text-gray-300">ㄴ</span>
                                <span>{subName}</span>
                              </span>
                              <span className="flex-shrink-0">{subAmt}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add components/CoverageList.tsx
git commit -m "feat: CoverageList — 담보 상세 목록 + 세부내역 토글"
```

---

## Task 16: 매니저 배지 (components/ManagerBadge.tsx)

**Files:**
- Modify: `components/ManagerBadge.tsx` (전체 교체)

- [ ] **Step 1: components/ManagerBadge.tsx 교체**

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ManagerInfo, CounterState } from '../lib/types';

interface ManagerBadgeProps {
  managerInfo: ManagerInfo | null;
  counter: CounterState;
}

export default function ManagerBadge({ managerInfo, counter }: ManagerBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!managerInfo) {
    // 매니저 미인식 시 카운터만 표시
    return (
      <div className="fixed top-4 right-4 z-50 bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm rounded-2xl px-4 py-2 flex items-center gap-3">
        <div className="text-center">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">오늘</p>
          <p className="text-sm font-black text-[var(--color-meritz-primary)]">{counter.daily.toLocaleString()}</p>
        </div>
        <div className="w-px h-8 bg-gray-100" />
        <div className="text-center">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">누적</p>
          <p className="text-sm font-black text-gray-700">{counter.total.toLocaleString()}</p>
        </div>
      </div>
    );
  }

  const progressPct = managerInfo.level >= 10
    ? 100
    : Math.min(100, Math.round((managerInfo.exp / managerInfo.required) * 100));

  return (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute top-14 right-0 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 flex flex-col gap-4"
          >
            {/* 레벨 이미지 */}
            <div className="flex items-center gap-4">
              <img
                src={`/level/lv${managerInfo.level}.png`}
                alt={`레벨 ${managerInfo.level}`}
                className="w-16 h-16 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div>
                <p className="text-xs text-gray-400 font-bold">매니저</p>
                <p className="text-lg font-black text-gray-800">{managerInfo.name}</p>
                <p className="text-sm font-black text-[var(--color-meritz-primary)]">LV.{managerInfo.level}</p>
              </div>
            </div>

            {/* 경험치 바 */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                <span>경험치</span>
                <span>{managerInfo.exp} / {managerInfo.required}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-2 rounded-full bg-[var(--color-meritz-primary)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {managerInfo.level >= 10
                  ? '최고 레벨에 도달했습니다!'
                  : `다음 레벨까지 ${managerInfo.required - managerInfo.exp}회 남았습니다.`}
              </p>
            </div>

            {/* 분석 횟수 */}
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">오늘</p>
                <p className="text-lg font-black text-[var(--color-meritz-primary)]">{counter.daily.toLocaleString()}</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">누적</p>
                <p className="text-lg font-black text-gray-700">{counter.total.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 배지 버튼 */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm rounded-2xl px-4 py-2 flex items-center gap-2 hover:shadow-md transition-all"
      >
        <div className="w-8 h-8 rounded-xl bg-[var(--color-meritz-primary)] flex items-center justify-center text-white text-xs font-black">
          {managerInfo.level}
        </div>
        <div className="text-left">
          <p className="text-[10px] font-bold text-gray-400 leading-none">LV.{managerInfo.level}</p>
          <p className="text-xs font-black text-gray-800 leading-tight">{managerInfo.name}</p>
        </div>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add components/ManagerBadge.tsx
git commit -m "feat: ManagerBadge — 매니저 배지 + 레벨 패널"
```

---

## Task 17: 오류 제보 (components/ErrorReporter.tsx)

**Files:**
- Modify: `components/ErrorReporter.tsx` (전체 교체)

- [ ] **Step 1: components/ErrorReporter.tsx 교체**

원본 다이나믹 아일랜드 패턴 이식.

```tsx
'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Send } from 'lucide-react';
import { uploadErrorReport } from '../lib/supabase';

export default function ErrorReporter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, isError: boolean) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const file = fileRef.current?.files?.[0];
      await uploadErrorReport(email, content, file);
      showToast('오류 제보가 성공적으로 접수되었습니다!', false);
      setIsExpanded(false);
      setEmail('');
      setContent('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      showToast('제보 중 문제가 발생했습니다: ' + msg, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
            style={{ backgroundColor: toast.isError ? '#EF4444' : '#10B981' }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 다이나믹 아일랜드 */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--color-meritz-primary)]" />
                  오류 제보
                </h3>
                <button onClick={() => setIsExpanded(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="이메일 (선택)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[var(--color-meritz-primary)] transition-colors"
                />
                <textarea
                  placeholder="어떤 문제가 발생했나요?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={4}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[var(--color-meritz-primary)] resize-none transition-colors"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,image/*"
                  className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !content}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--color-meritz-primary)] text-white text-sm font-black disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? '처리 중...' : '제보하기'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.button
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2 bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-lg hover:bg-gray-700 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              오류 제보
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add components/ErrorReporter.tsx
git commit -m "feat: ErrorReporter — 오류 제보 다이나믹 아일랜드"
```

---

## Task 18: 메인 페이지 (app/page.tsx)

**Files:**
- Modify: `app/page.tsx` (전체 교체)

- [ ] **Step 1: app/page.tsx 교체**

```tsx
'use client';

import { useEffect, useRef } from 'react';
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
  // recognizeAndLog, logUnrecognized, increment는 useCallback으로 안정화되어 의존성 배열에 안전하게 추가
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
      <ManagerBadge managerInfo={managerInfo} counter={counter} />
      <ErrorReporter />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16 flex flex-col items-center gap-8">
        {/* 헤더 + 업로드 존 */}
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

        {/* 에러 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium max-w-md w-full"
          >
            ⚠️ {error}
          </motion.div>
        )}

        {/* 결과 */}
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-8"
          >
            {/* 상단 바 */}
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

            {/* 인사이트 카드 */}
            <InsightCard
              customerName={scanResult.customerName}
              grandTotalMin={scanResult.grandTotalMin}
              grandTotalMax={scanResult.grandTotalMax}
              expertName={managerInfo?.name ?? '전문가'}
              expertImageUrl={managerInfo?.expertImageUrl ?? null}
            />

            {/* 집계 그리드 */}
            <SummaryGrid
              summaryMap={scanResult.summaryMap}
              grandTotalMin={scanResult.grandTotalMin}
              grandTotalMax={scanResult.grandTotalMax}
            />

            {/* 담보 상세 목록 */}
            <CoverageList rawCoverages={scanResult.rawCoverages} />
          </motion.div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 타입 체크 + 빌드**

```bash
npx tsc --noEmit
npm run build
```
예상: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: app/page.tsx — 메인 오케스트레이터 완성"
```

---

## Task 19: 정적 에셋 복사

**Files:**
- Copy: `레벨 이미지` → `public/level/`

- [ ] **Step 1: 레벨 이미지 복사**

```bash
# 상위 폴더의 level 디렉터리에서 복사
mkdir -p public/level
cp -r ../../level/. public/level/
```
> Windows bash 환경에서 경로 확인 필요. `C:\Users\chlgn\OneDrive\Desktop\가입제안서PJ\level\` → `public/level/`

- [ ] **Step 2: 빌드 확인**

```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속하여 UI 확인.

- [ ] **Step 3: 커밋**

```bash
git add public/
git commit -m "chore: 레벨 이미지 에셋 public 폴더로 복사"
```

---

## Task 20: Supabase managers 테이블 시드

**Files:**
- 별도 SQL 파일 (DB 직접 실행)

- [ ] **Step 1: Supabase 대시보드에서 managers 테이블 생성**

```sql
CREATE TABLE IF NOT EXISTS managers (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  expert_image_url TEXT
);
```

- [ ] **Step 2: managers.js 데이터를 INSERT로 변환하여 실행**

`C:\Users\chlgn\OneDrive\Desktop\가입제안서PJ\managers.js`의 `MANAGERS_MAP` 데이터를 INSERT:

```sql
INSERT INTO managers (code, name) VALUES
  ('121202739', '훈서초이'),
  ('315005123', '우은혜'),
  ('318001506', '백경희'),
  -- ... 전체 목록 삽입
ON CONFLICT (code) DO NOTHING;
```

- [ ] **Step 3: 전문가 이미지 업로드 (선택)**

Supabase Storage `expert_images` 버킷 생성 후 `mery.png`, `yewon.png` 등 업로드.
URL을 `managers` 테이블의 `expert_image_url` 컬럼에 업데이트:

```sql
UPDATE managers SET expert_image_url = '<Storage Public URL>' WHERE code = '해당코드';
```

- [ ] **Step 4: 최종 빌드 + 동작 확인**

```bash
npm run build
npm run dev
```
실제 PDF 업로드 → 분석 결과 확인:
- 담보 추출 정확도
- 매니저 배지 표시
- 5년 치료비 인사이트
- 세부내역 토글
- 이미지 내보내기

- [ ] **Step 5: 최종 커밋**

```bash
git add -A
git commit -m "feat: 암보장분석기 Next.js 포팅 완성

- TypeScript strict 전환
- PDF.js + Tesseract OCR 텍스트 추출
- coverageDetailsMap 계층 집계
- Supabase managers 테이블 연동
- 매니저 레벨 시스템
- 분석 횟수 카운터
- 이미지 내보내기 (html2canvas-pro)
- 오류 제보 다이나믹 아일랜드

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## 완료 체크리스트

- [ ] `npx tsc --noEmit` 에러 없음
- [ ] `npm run build` 성공
- [ ] PDF 업로드 → 담보 추출 동작 확인
- [ ] 매니저 배지 (Supabase 조회)
- [ ] 인사이트 카드 (5년 치료비)
- [ ] 집계 그리드 표시
- [ ] 세부내역 클릭 토글
- [ ] 이미지 내보내기 (PNG 다운로드)
- [ ] 오류 제보 폼 (Supabase 저장)
- [ ] 분석 횟수 카운터 갱신
