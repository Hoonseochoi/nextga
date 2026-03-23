# Next.js 마이그레이션 작업 요약 및 아키텍처 의사결정 기록

## 🎯 작업 개요
기존의 순수 HTML/JS/CSS 기반이었던 **가입제안서 PDF 분석기**를 최신 React 메타 프레임워크인 **Next.js** 환경으로 완벽하게 이관하는 작업을 진행했습니다. 단순한 코드 복사-붙여넣기가 아닌, 리액트의 패러다임에 맞춰 **컴포넌트화, 상태 관리의 추상화, UI/UX 고도화**에 중점을 두고 구조를 설계했습니다.

---

## 🏗️ 주요 아키텍처 및 의사결정 (My Thoughts)

### 1. 관심사의 분리 (UI와 비즈니스 로직의 완벽한 분리)
기존 프로젝트는 [index.html](file:///c:/Users/chlgn/OneDrive/Desktop/%EA%B0%80%EC%9E%85%EC%A0%9C%EC%95%88%EC%84%9CPJ/index.html)에 UI 구조가 수백 줄 나열되어 있고, [ui_renderer.js](file:///c:/Users/chlgn/OneDrive/Desktop/%EA%B0%80%EC%9E%85%EC%A0%9C%EC%95%88%EC%84%9CPJ/js/ui_renderer.js)에서 DOM을 직접 조작(jQuery 방식과 유사한 `document.getElementById` 등)하여 화면을 업데이트하는 모놀리식(Monolithic) 구조였습니다. 
**제 생각은 "상태(State)가 변하면 UI는 알아서 다시 렌더링되어야 한다"는 것이었습니다.** 
이를 위해 다음과 같이 역할을 나누었습니다:
*   **비즈니스 로직 ([hooks/usePdfScanner.ts](file:///c:/Users/chlgn/OneDrive/Desktop/%EA%B0%80%EC%9E%85%EC%A0%9C%EC%95%88%EC%84%9CPJ/analyzer-next/hooks/usePdfScanner.ts)):** PDF 파일을 읽고, `Tesseract.js`와 `pdfjs-dist`를 활용해 텍스트를 추출하며, [analyzer.js](file:///c:/Users/chlgn/OneDrive/Desktop/%EA%B0%80%EC%9E%85%EC%A0%9C%EC%95%88%EC%84%9CPJ/js/analyzer.js)로 커버리지 맵을 계산하는 등 **"분석"과 관련된 모든 상태(진행률, 로딩 상태, 결과물, 에러)**를 관리하는 커스텀 훅을 만들었습니다.
*   **프레젠테이셔널 컴포넌트 (`components/*`):** 데이터가 주어지면 화면을 어떻게 그릴지만 고민하는 순수 뷰 컴포넌트로 쪼개었습니다.

### 2. UI 컴포넌트의 모듈화
방대한 UI를 기능별로 쪼개어 재사용성과 유지보수성을 극대화했습니다.
*   **[UploadZone.tsx](file:///c:/Users/chlgn/OneDrive/Desktop/%EA%B0%80%EC%9E%85%EC%A0%9C%EC%95%88%EC%84%9CPJ/analyzer-next/components/UploadZone.tsx)**: Drag & Drop 영역과 진행률(Progress Ring) 표시를 전담.
*   **[InsightCard.tsx](file:///c:/Users/chlgn/OneDrive/Desktop/%EA%B0%80%EC%9E%85%EC%A0%9C%EC%95%88%EC%84%9CPJ/analyzer-next/components/InsightCard.tsx)**: 환산된 5년치 총량과 전문가 커멘트를 보여주는 프리미엄 카드 UI 전담.
*   **[CoverageList.tsx](file:///c:/Users/chlgn/OneDrive/Desktop/%EA%B0%80%EC%9E%85%EC%A0%9C%EC%95%88%EC%84%9CPJ/analyzer-next/components/CoverageList.tsx)**: 분류된 보장 항목(암, 뇌, 심장 등)을 그룹화하고, 계층형 뎁스로 보여주는 리스트 전담.
*   **[ManagerBadge.tsx](file:///c:/Users/chlgn/OneDrive/Desktop/%EA%B0%80%EC%9E%85%EC%A0%9C%EC%95%88%EC%84%9CPJ/analyzer-next/components/ManagerBadge.tsx)**: 상단의 매니저 레벨과 경험치를 보여주는 작은 위젯 전담.
*   **[ErrorReporter.tsx](file:///c:/Users/chlgn/OneDrive/Desktop/%EA%B0%80%EC%9E%85%EC%A0%9C%EC%95%88%EC%84%9CPJ/analyzer-next/components/ErrorReporter.tsx)**: 예외 상황 시 Supabase 기능을 연동하여 의견을 남길 수 있는 에러 제보 기능 전담.

### 3. 스타일링 및 애니메이션 (Apple-Style UI 고도화)
*   **Tailwind CSS 도입:** 기존의 인라인 스타일과 복잡한 CSS 클래스명을 직관적인 Tailwind CSS 유틸리티 클래스로 대체했습니다. 다만, 프로젝트 고유 색상(빨간색/검은색 톤) 등 필수 요건은 [globals.css](file:///c:/Users/chlgn/OneDrive/Desktop/%EA%B0%80%EC%9E%85%EC%A0%9C%EC%95%88%EC%84%9CPJ/analyzer-next/app/globals.css)의 `:root` 변수로 남겨두어 일관성을 지켰습니다.
*   **Framer Motion (`framer-motion`) 적용:** 단순히 뚝뚝 끊기는 화면 전환이 아니라, 결과물이 나올 때 부드럽게 페이드인 되고 컴포넌트들이 순차적으로 나타나는(Stagger) 고급스러운 애니메이션(Micro-interactions) 패턴을 주입했습니다.

### 4. 클라이언트 사이드 렌더링 강제 (`"use client"`)
PDF.js의 Canvas 조작과 브라우저 기반 Web Worker를 사용하는 Tesseract.js 특성상, 서버 사이드 렌더링(SSR) 환경에서는 `document is not defined` 등의 에러가 필연적으로 발생합니다. 이를 원천 차단하기 위해 모든 핵심 페이지와 추출 컴포넌트 상단에 `"use client";`를 명시하여 브라우저 내장 API를 안전하게 사용할 수 있도록 조치했습니다.

### 5. Supabase 및 외부 라이브러리 연동 준비
원래 존재했던 [supabase.js](file:///c:/Users/chlgn/OneDrive/Desktop/%EA%B0%80%EC%9E%85%EC%A0%9C%EC%95%88%EC%84%9CPJ/js/supabase.js) 모듈을 `lib/` 폴더 내에 위치시키고, [ErrorReporter](file:///c:/Users/chlgn/OneDrive/Desktop/%EA%B0%80%EC%9E%85%EC%A0%9C%EC%95%88%EC%84%9CPJ/analyzer-next/components/ErrorReporter.tsx#8-135) 컴포넌트 등 필요한 곳에서 환경 변수(Environment Variables)를 참조해 안전하게 호출하도록 기반을 닦아 두었습니다.

---

## 📋 파일 구조 요약

```text
analyzer-next/
├── app/
│   ├── page.tsx           # 모든 컴포넌트와 usePdfScanner를 엮는 메인 통합 페이지
│   ├── layout.tsx         # 글로벌 레이아웃 (폰트 등 적용)
│   └── globals.css        # 디자인 시스템 변수 및 베이스 CSS
├── components/
│   ├── CoverageList.tsx   # 보장 내역 상세 리스트 뷰
│   ├── ErrorReporter.tsx  # Dynamic Island 스타일의 에러 제보 
│   ├── InsightCard.tsx    # 합산액 요약 표시 카드
│   ├── ManagerBadge.tsx   # 유저 뱃지 및 상태 정보
│   └── UploadZone.tsx     # PDF 업로드 및 진행 표시
├── hooks/
│   └── usePdfScanner.ts   # 핵심! PDF 스캔부터 상태 업데이트까지의 라이프사이클 관리
├── lib/
│   ├── analyzer.js        # 정규식 패턴 기반의 텍스트 파싱 핵심 로직 보존
│   ├── config.js          # 각 암/질병 항목의 카테고리 설정값
│   ├── pdf_extractor.js   # PDF.js 및 Tesseract.js (OCR) 텍스트 추출 엔진 보존
│   └── supabase.js        # Supabase 연동 코드 보존
└── public/                # 폰트, 이미지 에셋 및 PDF.js 워커 파일
```

## 🚀 앞으로의 기대 효과
1. **성능 향상:** 리액트의 Virtual DOM을 통해 상태가 변할 때 화면 전체를 다시 렌더링하지 않고 바뀌어야 하는 DOM만 업데이트됩니다.
2. **확장성:** 새로운 분석 기능이나 UI를 추가할 때, 기존 HTML 요소 간의 엉킴을 걱정할 필요 없이 새로운 React 컴포넌트만 만들어서 조립하면 됩니다.
3. **유지보수:** `UI 그리는 코드`와 `데이터 분석하는 코드`가 분리되어, 오류 발생 시 어느 파일을 고쳐야 할지 명확해졌습니다.
