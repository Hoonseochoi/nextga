# 🧠 GA_NEXUS — 오케스트레이터

---

## ⚡ 작업 요청이 오면

**기능 개발 / 버그수정 / DB변경 / 배포** 요청 → 무조건 이것만:

```bash
node .agents/run.mjs "요청 내용"

# 옵션
node .agents/run.mjs "긴급 수정" --hotfix   # QA 경량화, 빠른 배포
node .agents/run.mjs "작업" --dry-run       # 코드만 작성, 배포 안 함
```

**직접 파일 수정하거나 git 실행하지 마라. run.mjs가 한다.**

---

## 🔍 직접 처리하는 경우 (예외)

| 요청 | 처리 |
|---|---|
| 파일 읽기 / 분석 / 구조 파악 | 직접 |
| run.mjs / .agents/*.md 수정 | 직접 |
| 에러 로그 확인 | 직접 |

---

## 📐 파이프라인 구조 (run.mjs)

```
[Opus  — 오케스트레이터]  PROJECT_CONTEXT만 읽고 분석 → orchestration_plan.json
[Haiku — scan-agent]      실제 파일 빠르게 읽고 요약  → scan_result.json       (별도 프로세스)
[Opus  — spec-writer]     scan 결과 보고 정밀 스펙 작성 → feature_spec.json
[Opus  — feature-agent]   스펙 + 파일내용 주입받아 코드 작성                   (별도 프로세스)
[Sonnet — qa-agent]  ──┐  병렬 검증                                            (별도 프로세스)
[Sonnet — db-agent]  ──┘                                                        (별도 프로세스)
[Haiku  — deploy-agent]   git push                                              (별도 프로세스)
[Haiku  — rollback-agent] 배포 실패 시 자동 복구                                (별도 프로세스)
```

> **핵심**: 각 에이전트는 완전히 분리된 Claude 프로세스다.
> 오케스트레이터는 PROJECT_CONTEXT(요약본)만 알고, 실제 파일은 scan-agent가 대신 읽는다.
> feature-agent는 스펙 + 파일내용을 주입받아 좁은 컨텍스트로 고품질 코드를 작성한다.

---

## 📁 프로젝트

- **스택**: Next.js 16 App Router · TypeScript · Tailwind CSS v4 · Neon PostgreSQL
- **DB**: `pg` 직접 사용 (ORM 없음)
- **배포**: Vercel (main push → 자동 빌드)

## 📋 코딩 규칙

- 주석·UI·로그: 한국어
- TypeScript strict, `any` 금지
- Tailwind v4 (v3 혼용 금지)
- 환경변수: `.env.local` 참조, 하드코딩 금지

## 👥 역할 체계

- admin / manager / agent
- `is_approved === false` → 승인대기 페이지 강제 리다이렉트

## 📝 누적 기억 파일들

- `.agents/PROJECT_CONTEXT.md` — 패턴, 결정, 이슈 (작업마다 자동 갱신)
- `.agents/decisions.md` — 설계 결정 이유 기록
- `C:\obsidian_hoons\Hoonseo\GA_NEXUS\` — Obsidian 작업 로그

---

## 🔄 작업 완료 후 필수 갱신 (deploy 성공 시 항상 실행)

deploy(git push)가 완료되면 **반드시** 아래 두 곳을 갱신한다. 빠뜨리면 다음 작업에서 컨텍스트가 어긋난다.

### 1. `.agents/PROJECT_CONTEXT.md` 갱신 항목

- `## ⚠️ 가장 중요한 사실들` — 새로 발견된 함정/패턴 추가
- `## 🗂️ API Routes` — 신규 엔드포인트 추가
- `## 🗄️ 실제 DB 테이블` — DB 변경 있을 경우 추가
- `## ⚠️ 알려진 주의사항` — 기술 부채/한계 추가
- `## 📋 완료된 작업 이력` — 새 행 추가 (날짜, Task ID, 작업 내용, 주요 변경, DB 변경)
- 파일 하단 `*마지막 갱신: YYYY-MM-DD*` 날짜 업데이트

### 2. Obsidian (`C:\obsidian_hoons\Hoonseo\GA_NEXUS\`) 갱신 항목

| 파일 | 갱신 내용 |
|---|---|
| `📋 프로젝트 현황.md` | 마지막 작업·총 작업 수 업데이트, 최근 작업 5개 목록 추가, 주의사항 반영 |
| `작업로그/README.md` | 전체 이력 테이블에 새 행 추가 |
| `핵심수정내용/YYYY-MM-DD_TASK-xxx.md` |제목에 핵심 수정 내용 반영 새 파일 생성 (요약, 변경파일, 커밋, 결정, 한계 포함) |
| `DB스키마/DB 스키마 현황.md` | DB 변경 있을 경우: 테이블 정의 + 마이그레이션 이력 추가 |

### 갱신 타이밍

```
git push 완료
  → PROJECT_CONTEXT.md 업데이트
  → Obsidian 파일 업데이트
  → 완료 보고
```
