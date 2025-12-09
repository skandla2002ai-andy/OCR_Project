# TODO – OCR Web Monorepo (Node 22 + React 18 + Turborepo + TDD)

> 목표
>
> - Client 단에서 동작하는 OCR 라이브러리(`@core-nexus/ocr-core`)를 만들고
> - 이를 사용하는 React 18 웹앱(`web`)을 Turborepo 기반 mono repo로 구성
> - Node.js 22, TypeScript, TDD(테스트 주도 개발)를 원칙으로 개발
> - Cursor를 활용해 TODO 기반으로 작업을 쪼개서 진행

---

## 0. 프로젝트 전반 설계

- [x] **프로젝트 이름 및 기본 구조 확정**
  - [x] 리포지토리 이름: `ocr-web-monorepo` (임시, 필요 시 변경)
  - [x] 워크스페이스 구조
    ```text
    .
    ├── apps
    │   └── web          # React 18 웹 UI (Vite 또는 Next 중 선택, 기본은 Vite)
    └── packages
        └── ocr-core     # 브라우저용 OCR 라이브러리 (Tesseract.js 또는 WebAssembly 기반)
    ```
  - [x] 공통 기술 스택 결정
    - Node.js: **22.x**
    - 언어: **TypeScript**
    - 테스트: **Vitest** 또는 **Jest** (기본: Vitest)
    - 번들러(웹): **Vite + React 18**
    - 패키지 매니저: **pnpm** (권장) 또는 npm
  - [x] **설정 검증 스크립트 작성 및 실행**
    - [x] `scripts/verify-setup.js` 생성 - Node 버전, workspaces, 디렉토리 구조, tsconfig.base.json 검증
    - [x] `package.json`에 `verify:setup` 스크립트 추가
    - [x] 검증 스크립트 실행하여 모든 항목 통과 확인

---

## 1. Turborepo + Mono Repo 기본 세팅 (TDD 환경의 바탕)

### 1-1. Turborepo 초기화

- [x] **Turborepo 워크스페이스 초기화**
  - Red:
    - [x] `package.json`의 `workspaces` 설정에 `apps/*`, `packages/*`가 포함되어 있는지 테스트 스크립트로 검증  
           (예: 간단한 Node 스크립트로 `package.json`을 읽어와 workspaces 배열을 체크)
  - Green:
    - [x] `pnpm init` 또는 `npm init` 후 Turborepo 템플릿 적용 (`npx create-turbo@latest` 참고)
    - [x] `turbo.json` 생성 및 `build`, `lint`, `test`, `dev` 파이프라인 정의
  - Refactor:
    - [x] `scripts` 및 `turbo.json`내 job 이름을 일관성 있게 정리 (`build`, `test`, `lint`, `dev`)

### 1-2. Node 22 & TS 공통 설정

- [x] **Node 22 엔진 명시 및 TS 베이스 설정**
  - Red:
    - [x] `node -v` 실행 결과를 체크하는 스크립트 또는 문서화된 체크리스트 추가
    - [x] 루트 `tsconfig.base.json` 존재 여부 테스트 (파일 존재 테스트)
  - Green:
    - [x] `package.json`에 `"engines": { "node": ">=22" }` 추가
    - [x] 루트에 `tsconfig.base.json` 생성, 공통 설정 정의
      - `moduleResolution`, `target`, `lib: ["ES2022", "DOM"]` 등
  - Refactor:
    - [x] `apps/web`, `packages/ocr-core`에서 루트 `tsconfig.base.json`을 확장하도록 정리

### 1-3. 공통 개발툴 (ESLint / Prettier / Husky 등)

- [x] **코드 품질 도구 세팅**
  - Red:
    - [x] 잘못된 코드 스타일이 있을 경우 lint가 실패하는지 확인하는 최소 lint 테스트 추가
  - Green:
    - [x] ESLint + TypeScript 설정 (`@typescript-eslint/*`) 추가
    - [x] Prettier 설정 추가 및 ESLint와 연동
    - [x] 필요 시 Husky + lint-staged로 pre-commit 훅 설정
  - Refactor:
    - [x] 모든 workspace에서 공통 `.eslintrc`, `.prettierrc`를 재사용하도록 구조 정리

---

## 2. `packages/ocr-core` – 클라이언트 OCR 라이브러리 (TDD 핵심)

### 2-1. 패키지 스캐폴딩

- [ ] **ocr-core 패키지 생성**
  - Red:
    - [ ] `import { recognize } from "@core-nexus/ocr-core"` 호출 시 TypeScript가 타입을 인식하는지 테스트 (d.ts 체크)
  - Green:
    - [ ] `packages/ocr-core/package.json` 생성
      - `"name": "@core-nexus/ocr-core"`
      - `"main": "dist/index.cjs"`
      - `"module": "dist/index.mjs"`
      - `"types": "dist/index.d.ts"`
    - [ ] `src/index.ts` 및 기본 폴더 구조 생성
  - Refactor:
    - [ ] 빌드 설정을 `tsup` 또는 `rollup` 등으로 통일된 형태로 정리

### 2-2. OCR API 설계 (도메인 모델 + TDD)

- [ ] **핵심 API 시그니처 정의**
  - 제안 API:

    ```ts
    type OcrInput = File | Blob | ArrayBuffer | string; // URL or base64
    interface OcrOptions {
      language?: string; // "eng", "kor", ...
      detectOrientation?: boolean;
      enhanceContrast?: boolean;
    }

    interface OcrResult {
      text: string;
      confidence: number;
      blocks?: OcrBlock[];
    }

    interface OcrBlock {
      text: string;
      boundingBox: [number, number, number, number]; // x, y, w, h
      confidence: number;
    }

    declare function recognize(input: OcrInput, options?: OcrOptions): Promise<OcrResult>;
    ```

  - Red:
    - [ ] 위 형태의 타입을 기대하는 유닛 테스트 작성 (타입 레벨 + 런타임 에러 테스트)
  - Green:
    - [ ] `recognize` 함수를 stub 구현 (임시로 고정된 결과 반환)
  - Refactor:
    - [ ] 타입을 `types.ts`로 분리하고 index에서 re-export

### 2-3. OCR 엔진 연동 (예: Tesseract.js 또는 WASM)

- [ ] **외부 OCR 엔진 선택 및 래핑**
  - Red:
    - [ ] 예시 이미지(샘플 fixture)를 입력했을 때, 특정 키워드가 결과 텍스트에 포함되는지 확인하는 테스트 작성
      - 실제 이미지 파일은 `packages/ocr-core/test/fixtures/sample.png` 등으로 관리
  - Green:
    - [ ] Tesseract.js 혹은 선택한 OCR 엔진을 `recognize` 내부에서 호출
    - [ ] 입력 타입(File/Blob/URL/base64)을 엔진이 처리 가능한 포맷으로 변환
  - Refactor:
    - [ ] OCR 엔진 어댑터 패턴 도입 (`OcrEngineAdapter` 인터페이스)
    - [ ] 나중에 엔진 변경/추가가 쉽도록 구조화

### 2-4. 에러 및 성능 옵션

- [ ] **에러 처리 및 타임아웃 옵션 추가**
  - Red:
    - [ ] 지원하지 않는 입력 타입일 때 에러가 발생하는 테스트
    - [ ] 일정 시간(예: 10초) 이상 걸리면 타임아웃 에러가 발생하는 테스트
  - Green:
    - [ ] 입력 검증 및 예외 처리 로직 구현
    - [ ] 타임아웃 옵션 구현 (`OcrOptions`에 `timeoutMs` 추가 고려)
  - Refactor:
    - [ ] 에러 타입(`OcrError`) 정의 및 일관된 에러 메시지 전략 수립

---

## 3. `apps/web` – React 18 OCR 웹 UI

### 3-1. React 앱 스캐폴딩

- [ ] **React 18 + Vite 앱 생성**
  - Red:
    - [ ] 루트 경로(`/`) 렌더링 시 "OCR Web App" 텍스트가 포함되는지 테스트 (React Testing Library)
  - Green:
    - [ ] `apps/web`에 Vite + React + TS 템플릿 생성
    - [ ] `pnpm dev --filter web` 또는 `turbo dev`로 앱 실행 가능하게 설정
  - Refactor:
    - [ ] 기본 템플릿 코드 정리, 불필요한 파일 제거

### 3-2. UI 기본 흐름 정의 (업로드 → OCR → 결과 표시)

- [ ] **기본 OCR 플로우 컴포넌트 구현**
  - Red:
    - [ ] 사용자가 이미지를 선택 → "인식하기" 버튼 클릭 시
      - 로딩 스피너가 표시되고
      - OCR 결과 텍스트 영역이 존재하는지 테스트
  - Green:
    - [ ] `OcrUploader` 컴포넌트 구현
      - 이미지 업로드 input
      - "인식하기" 버튼
    - [ ] `@core-nexus/ocr-core`의 `recognize`를 호출하여 결과 표시
  - Refactor:
    - [ ] UI 상태를 `useReducer` 또는 상태관리 라이브러리로 정리(필요 시 Zustand 등)

### 3-3. 옵션 설정 UI (language / 옵션)

- [ ] **OCR 옵션 설정 패널**
  - Red:
    - [ ] 언어 드롭다운에서 언어 변경 시, 내부 상태에 반영되는지 테스트
  - Green:
    - [ ] `language`, `detectOrientation`, `enhanceContrast`를 설정할 수 있는 패널 구현
    - [ ] 해당 옵션이 `recognize` 호출 시 전달되는지 연결
  - Refactor:
    - [ ] 옵션 상태를 별도 훅(`useOcrOptions`)으로 분리

---

## 4. TDD 운영 방식 정의 (Cursor 워크플로 포함)

### 4-1. TDD 사이클 템플릿 만들기

- [ ] **TDD 작업 단위 템플릿 정의**
  - [ ] `docs/TDD-GUIDE.md` 생성 (추후)
    - 각 TODO 항목에 대해 다음 순서로 진행:
      1. Red: 실패하는 테스트 작성
      2. Green: 최소 구현으로 테스트 통과
      3. Refactor: 구조/이름/중복 개선
  - [ ] Cursor에서
