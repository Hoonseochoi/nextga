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
