# 암보장분석기 Next.js 포팅 설계 스펙

**날짜:** 2026-03-23
**목표:** 기존 HTML/JS 기반 암보장분석기를 Next.js 16 App Router + TypeScript strict 환경으로 완전 이식

---

## 1. 범위

### 포함
- PDF 텍스트 추출 (PDF.js + Tesseract OCR 폴백)
- 담보 추출 및 계층 집계 로직 전체
- 매니저 인식 (가계약번호 → Supabase `managers` 테이블)
- 매니저 레벨 시스템 (Supabase `manager_logs` / `manager_profiles`)
- 고객명 추출
- Insight Card (5년 치료비 계산 + 전문가 이미지)
- 담보 집계 그리드 + 상세 목록 (클릭 시 세부내역 토글)
- 오류 제보 (Supabase `error_reports` + `error_attachments` Storage)
- 분석 횟수 카운터 (counterapi.dev)
- 이미지 내보내기 (`lib/export.ts` — html2canvas-pro → PNG 다운로드)

### 제외
- 로그인/인증 시스템 (추후 추가)
- admin/manager/agent 역할 체계

---

## 2. 기술 스택

- Next.js 16.2.1 (App Router)
- React 19, TypeScript strict (`any` 금지, `unknown` 사용)
- Tailwind CSS v4 (v3 혼용 금지)
- Supabase (@supabase/supabase-js v2)
- pdfjs-dist v5, tesseract.js v7
- framer-motion v12, lucide-react
- html2canvas-pro (이미지 내보내기)
- `jspdf` — **제거 대상** (코드에 미사용, `package.json`에서 삭제)

---

## 3. 디렉터리 구조

```
analyzer-next/
├── app/
│   ├── layout.tsx          # Noto Sans KR + Outfit 폰트, lang="ko", 메타데이터
│   ├── globals.css         # Tailwind v4 + CSS 커스텀 변수 (--primary-color 등)
│   └── page.tsx            # 오케스트레이터 Client Component
├── lib/
│   ├── types.ts            # 공유 TypeScript 타입 단일 소스 (모든 컴포넌트는 여기서 import)
│   ├── analyzer.ts         # 순수 분석 로직 (부수효과 없음)
│   ├── pdf_extractor.ts    # PDF.js + Tesseract OCR
│   ├── config.ts           # coverageDetailsMap (담보 사전)
│   ├── supabase.ts         # Supabase 클라이언트 + DB 함수
│   └── export.ts           # exportAsImage (html2canvas-pro)
├── hooks/
│   ├── usePdfScanner.ts    # PDF 처리 + 분석 통합 훅
│   ├── useManagerSystem.ts # 매니저 인식·레벨·Supabase 연동
│   └── useCounter.ts       # counterapi.dev 분석 횟수 + UI 상태
└── components/
    ├── UploadZone.tsx       # 드래그앤드롭 (진행 상태 내장)
    ├── InsightCard.tsx      # 5년 치료비 카드
    ├── SummaryGrid.tsx      # 담보 집계 그리드 (CoverageList와 분리)
    ├── CoverageList.tsx     # 담보 상세 목록 (클릭 토글 세부내역)
    ├── ManagerBadge.tsx     # 매니저 배지 + 레벨 패널
    └── ErrorReporter.tsx   # 오류 제보 다이나믹 아일랜드
```

> `public/level/lv1.png ~ lv10.png` — 레벨 이미지 (기존 `level/` 폴더에서 복사)
> `public/icons/` — 담보 아이콘 (기존 base64 → 파일로 추출)

---

## 4. 타입 정의 (lib/types.ts) — 단일 소스

```ts
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
```

---

## 5. 모듈별 책임

### lib/analyzer.ts
순수 함수만. 부수효과(DOM, 콘솔 제외) 없음.

```ts
export function parseKoAmount(str: string): number
export function formatKoAmount(val: number): string
export function formatDisplayAmount(str: string): string
export function extractRawCoverages(text: string): CoverageItem[]
export function calculateHierarchicalSummary(results: CoverageItem[]): Map<string, SummaryGroup>
// findDetails는 analyzer.ts 내부 함수 (export 안함)
// CoverageList에서 상세 데이터가 필요할 경우: rawCoverages + findDetails 결과를
// ScanResult.resolvedDetails: Map<number, DetailEntry[]> 로 사전 계산하여 전달
```

### lib/pdf_extractor.ts
```ts
export async function extractTextFromPDF(
  file: File,
  onProgress: (pct: number, text: string) => void
): Promise<string>
```
- PDF.js 텍스트 레이어 우선 (페이지 1, 3~6)
- 텍스트 레이어 없으면 Tesseract OCR 폴백
- **PDF.js Worker 설정**: CDN 금지. `next.config.ts`에서 webpack 설정으로 worker 파일 번들:
  ```ts
  // next.config.ts
  config.resolve.alias['pdfjs-dist/build/pdf.worker.mjs'] =
    path.resolve('./node_modules/pdfjs-dist/build/pdf.worker.mjs');
  ```
  코드에서: `pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();`

### lib/supabase.ts
- 자격증명은 **반드시 `.env.local`**에서 읽어야 함. 원본 코드의 하드코딩은 제거할 기술부채.
  ```ts
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  ```
- `getManagerByCode(code: string): Promise<{ name: string; expertImageUrl: string | null } | null>`
  → `managers` 테이블 조회
- `logManagerActivity(code: string, name: string, fileName: string): Promise<{ totalCount: number }>`
- `logUnrecognizedUpload(fileName: string): Promise<void>`
- `uploadErrorReport(email: string, content: string, file?: File): Promise<void>`

### lib/export.ts
```ts
export async function exportAsImage(fileName: string): Promise<void>
```
- `<main>` 캡처, file-info + insight-section + summary-section만 노출
- `{fileName} 분석.png` 다운로드
- 애니메이션/트랜지션 제거 후 캡처

### hooks/usePdfScanner.ts
```ts
// 반환 타입
interface UsePdfScannerReturn {
  isScanning: boolean;
  progressPercent: number;
  statusText: string;
  scanResult: ScanResult | null;
  error: string | null;
  scanFile: (file: File) => Promise<void>;  // 주의: scanPdf(ArrayBuffer) 아님
  reset: () => void;
}
```
내부 처리 순서:
1. `extractTextFromPDF(file, onProgress)` — 텍스트 추출
2. 가계약번호 추출 (`가계약번호 숫자{9,}` 패턴) → `managerCode`
3. 고객명 추출 → `customerName`
4. `extractRawCoverages(text)` → `calculateHierarchicalSummary(rawCoverages)`
5. `grandTotalMin/Max` 계산
6. `ScanResult` 반환

### hooks/useManagerSystem.ts
```ts
interface UseManagerSystemReturn {
  managerInfo: ManagerInfo | null;
  recognizeAndLog: (code: string, fileName: string) => Promise<void>;
  logUnrecognized: (fileName: string) => Promise<void>;
}
```
내부 처리:
1. `getManagerByCode(code)` → name, expertImageUrl
2. `logManagerActivity(code, name, fileName)` → totalCount
3. `calculateLevelFromCount(totalCount)` → level, exp, required
4. `managerInfo` 상태 업데이트

### hooks/useCounter.ts
```ts
interface UseCounterReturn {
  counter: CounterState;
  increment: () => Promise<void>;
}
```
- 마운트 시 `fetchAnalysisCounts()` 호출
- `increment()` 분석 완료 시 호출
- `CounterState { daily, total }` 을 UI에 노출 (ManagerBadge 또는 별도 영역)

---

## 6. Supabase 스키마

### 신규 테이블: managers
```sql
CREATE TABLE managers (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  expert_image_url TEXT  -- Supabase Storage URL 또는 외부 URL
);
```

**데이터 마이그레이션:** 기존 `managers.js`의 `MANAGERS_MAP` 객체를 SQL INSERT로 변환하여 테이블에 삽입. 전문가 이미지는 Supabase Storage `expert_images` 버킷에 업로드 후 URL 저장.

### 기존 테이블 (유지)
- `manager_logs (manager_code, manager_name, file_name, created_at)`
- `manager_profiles (manager_code, manager_name, execution_count, level, updated_at)`
- `unrecognized_uploads (file_name, created_at)`
- `error_reports (email, content, attachment_url, created_at)`
- Storage: `error_attachments` (버킷)

---

## 7. 컴포넌트 인터페이스

```ts
// UploadZone — 진행 상태 내장 (별도 ProgressBar 컴포넌트 없음)
interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isScanning: boolean;
  progressPercent: number;
  statusText: string;
}

// InsightCard
interface InsightCardProps {
  customerName: string;
  grandTotalMin: number;
  grandTotalMax: number;
  expertName: string;
  expertImageUrl: string | null;  // null이면 기본 플레이스홀더 표시
}

// SummaryGrid — 집계 카드 그리드
interface SummaryGridProps {
  summaryMap: Map<string, SummaryGroup>;
  grandTotalMin: number;
  grandTotalMax: number;
}

// CoverageList — 상세 목록 (클릭 시 세부내역 토글)
// findDetails를 내부에서 호출 가능하도록 analyzer.ts에서 export
interface CoverageListProps {
  rawCoverages: CoverageItem[];
}

// ManagerBadge
interface ManagerBadgeProps {
  managerInfo: ManagerInfo | null;
  counter: CounterState;
}

// ErrorReporter — 내부 상태만 관리
// props 없음
```

> **주의:** `findDetails`는 `CoverageList` 내부에서 직접 사용하기 위해 `analyzer.ts`에서 export.

---

## 8. 이미지 내보내기 (lib/export.ts)

```ts
export async function exportAsImage(originalFileName: string): Promise<void> {
  // 1. document.fonts.ready 대기
  // 2. html2canvas-pro로 <main> 캡처
  // 3. onclone: file-info, insight-section, summary-section만 노출, 나머지 hidden
  // 4. 애니메이션/transition 제거, blur 데코 hidden
  // 5. `${originalFileName} 분석.png` 다운로드
}
```

---

## 9. 환경 변수

`.env.local` (절대 커밋 금지):
```
NEXT_PUBLIC_SUPABASE_URL=https://omgwvnibssizmhovporl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

---

## 10. 코딩 규칙

- 모든 `lib/`, `hooks/`, `components/` 파일은 `.ts` / `.tsx` (`.js` 금지)
- TypeScript strict: `any` 금지, `unknown` 사용
- 주석·UI·로그: 한국어
- Tailwind v4만 사용 (v3 클래스 혼용 금지)
- 환경변수: `process.env.NEXT_PUBLIC_*` 참조, 하드코딩 금지
- PDF.js Worker: CDN 금지, `next.config.ts` webpack 설정으로 번들
- reset: `window.location.reload()` 금지 — 훅의 `reset()` 상태 초기화 사용
- 기존 스켈레톤 파일 전체 교체 (수정 아님)

---

## 11. 정적 에셋

- `public/level/lv1.png` ~ `lv10.png` — 기존 `level/` 폴더에서 복사
- `public/icons/icon-a.png` ~ `icon-i.png` — 기존 base64 데이터에서 추출하거나 SVG로 교체
