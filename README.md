# OCR Web Monorepo

> **브라우저에서 동작하는 OCR 라이브러리 및 React 웹 애플리케이션**  
> Node.js 22 + React 18 + Turborepo + TypeScript + TDD

---

## 📖 프로젝트 소개

이미지, PDF, Office 문서(Word/Excel/PowerPoint)에서 텍스트를 추출하는 클라이언트 사이드 OCR 솔루션입니다.

### 주요 특징

- 🌐 **100% 클라이언트 사이드** - 서버 없이 브라우저에서 모든 처리
- 📦 **Monorepo 구조** - Turborepo 기반 효율적인 워크스페이스 관리
- 🎯 **TypeScript** - 타입 안전성과 개발자 경험 향상
- ✅ **TDD** - 테스트 주도 개발로 안정성 보장
- 🔧 **확장 가능** - 플러그인 방식으로 엔진/어댑터 교체 가능

---

## 🏗️ 프로젝트 구조

```
.
├── apps/
│   └── web/              # React 18 웹 애플리케이션 (Vite)
└── packages/
    └── ocr-core/         # 브라우저 OCR 라이브러리
```

---

## 🚀 빠른 시작

### 사전 요구사항

- **Node.js**: 22.x 이상
- **pnpm**: 9.x (권장)
- **nvm**: Node 버전 관리용 (선택)

### 설치

```bash
# Node.js 22 설치 (nvm 사용)
nvm install 22
nvm use 22

# pnpm 활성화
corepack enable
corepack prepare pnpm@9.0.0 --activate

# 의존성 설치
pnpm install

# 전체 빌드
pnpm run build

# 테스트 실행
pnpm run test

# Lint 검사
pnpm run lint
```

### 개발 서버 실행

```bash
# 웹 앱 개발 서버
pnpm --filter web run dev

# 또는 Turborepo 사용
pnpm run dev
```

---

## 📦 `@core-nexus/ocr-core` 라이브러리

### 지원 파일 형식

| 파일 타입      | 확장자                                                    | MIME Type                                                                                                    | 처리 방법                                      |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| **이미지**     | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.tiff` | `image/*`                                                                                                    | Tesseract.js OCR                               |
| **PDF**        | `.pdf`                                                    | `application/pdf`                                                                                            | PDF.js (텍스트 레이어 우선) + Tesseract.js OCR |
| **Word**       | `.doc`, `.docx`                                           | `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`              | Office → PDF 변환 후 OCR                       |
| **Excel**      | `.xls`, `.xlsx`                                           | `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`              | Office → PDF 변환 후 OCR                       |
| **PowerPoint** | `.ppt`, `.pptx`                                           | `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` | Office → PDF 변환 후 OCR                       |

### 파일 타입 감지 전략

1. **MIME Type 우선**: `file.type`을 먼저 확인 (브라우저/OS가 제공)
2. **확장자 Fallback**: MIME type이 없거나 매칭 실패 시 확장자로 판단
3. **일반 카테고리 매칭**: `image/*` 같은 일반 MIME type도 지원

### 사용 예제

#### 기본 사용법 (이미지)

```typescript
import { recognize } from '@core-nexus/ocr-core';

const file = document.querySelector('input[type="file"]').files[0];
const result = await recognize(file, { language: 'eng' });

console.log(result.text); // 추출된 텍스트
console.log(result.confidence); // 신뢰도 (0-100)
console.log(result.blocks); // 텍스트 블록 배열
```

#### 통합 API (모든 파일 타입)

```typescript
import { processFileWithOcr } from '@core-nexus/ocr-core';

const file = document.querySelector('input[type="file"]').files[0];
const result = await processFileWithOcr(file, { language: 'kor' });

console.log(`추출된 텍스트: ${result.text}`);
```

#### 파일 타입 감지

```typescript
import { detectFileType } from '@core-nexus/ocr-core';

const file = new File([], 'document.pdf', { type: 'application/pdf' });
console.log(detectFileType(file)); // 'pdf'

const image = new File([], 'photo.jpg', { type: 'image/jpeg' });
console.log(detectFileType(image)); // 'image'
```

#### PDF 처리

```typescript
import { processPdfWithOcr } from '@core-nexus/ocr-core';

const pdfFile = document.querySelector('input[type="file"]').files[0];
const result = await processPdfWithOcr(pdfFile);

// 텍스트 레이어가 있으면 우선 추출, 없으면 OCR 수행
console.log(result.text);
```

#### 설정 변경

```typescript
import { setOcrConfig } from '@core-nexus/ocr-core';

// Office 파일 지원 활성화 (향후 지원 예정)
setOcrConfig({ officeIntegration: 'apryse-webviewer' });
```

#### 타임아웃 설정

```typescript
import { recognize, OcrError } from '@core-nexus/ocr-core';

try {
  const result = await recognize(file, {
    language: 'eng',
    timeoutMs: 30000, // 30초 타임아웃
  });
} catch (error) {
  if (error instanceof OcrError && error.code === 'TIMEOUT') {
    console.error('OCR 처리 시간 초과');
  }
}
```

---

## 🧪 테스트

### 전체 테스트 실행

```bash
pnpm run test
```

### 패키지별 테스트

```bash
# ocr-core 라이브러리 테스트
pnpm --filter @core-nexus/ocr-core test

# 웹 앱 테스트
pnpm --filter web test
```

### 테스트 커버리지

현재 테스트 상태:

- ✅ 파일 타입 감지 (확장자 + MIME type)
- ✅ 이미지 OCR (Tesseract.js)
- ✅ PDF 처리 (텍스트 레이어 + OCR)
- ✅ 입력 검증 및 에러 처리
- ✅ 타임아웃 옵션
- ✅ 통합 API (processFileWithOcr)

---

## 🔧 개발 가이드

### PowerShell 실행 정책 (Windows)

매 세션 시작 시 실행:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
```

이후 pnpm 명령어 사용:

```bash
pnpm.cmd install
pnpm.cmd run build
pnpm.cmd run dev
```

### 검증 스크립트

프로젝트 설정 검증:

```bash
# 전체 설정 검증
npm run verify:setup

# Turborepo 설정 검증
npm run test:turborepo

# Node/TypeScript 설정 검증
npm run test:node-ts

# Lint 설정 검증
npm run test:lint
```

### 빌드

```bash
# 전체 빌드
pnpm run build

# 패키지별 빌드
pnpm --filter @core-nexus/ocr-core run build
pnpm --filter web run build
```

### Lint & Format

```bash
# Lint 검사
pnpm run lint

# Lint 자동 수정
pnpm run lint:fix

# Prettier 포맷팅
pnpm run format

# Prettier 검사만
pnpm run format:check
```

---

## 🎯 주요 기능

### 1. 파일 타입 자동 감지

- MIME type 우선, 확장자 fallback
- 20+ 파일 형식 지원

### 2. 이미지 OCR

- Tesseract.js 기반
- 다국어 지원 (eng, kor 등)
- 블록 단위 결과 (boundingBox, confidence)

### 3. PDF 처리

- 텍스트 레이어 우선 추출 (빠름)
- OCR fallback (스캔 PDF)
- 페이지별 처리

### 4. Office 파일 (향후 지원)

- Word/Excel/PowerPoint → PDF 변환
- Apryse WebViewer 또는 Nutrient SDK 통합
- 플러그인 방식으로 교체 가능

### 5. 에러 처리

- 타입 안전한 `OcrError` 클래스
- 에러 코드: `INVALID_INPUT`, `TIMEOUT`, `UNSUPPORTED_FORMAT`, `NOT_IMPLEMENTED`

### 6. 성능 옵션

- 타임아웃 설정
- Web Worker 지원 (향후)

---

## 🛠️ 기술 스택

### Core

- **언어**: TypeScript 5.5+
- **런타임**: Node.js 22+
- **패키지 관리**: pnpm 9 (workspaces)
- **빌드 도구**: Turborepo 2

### OCR 라이브러리 (`@core-nexus/ocr-core`)

- **번들러**: tsup 8
- **OCR 엔진**: Tesseract.js
- **PDF 렌더링**: PDF.js (pdfjs-dist)
- **테스트**: Vitest 1.6

### 웹 애플리케이션 (`web`)

- **프레임워크**: React 18
- **빌드**: Vite 6
- **테스트**: Vitest + React Testing Library
- **UI**: (추가 예정)

### 개발 도구

- **Lint**: ESLint 8 + typescript-eslint 8
- **Format**: Prettier 3
- **Git Hooks**: Husky 9 + lint-staged

---

## 📚 API 레퍼런스

### `recognize(input, options?)`

기본 OCR 함수.

**Parameters:**

- `input`: `File | Blob | ArrayBuffer | string` (URL/base64)
- `options?`:
  - `language?`: 언어 코드 (기본: 'eng')
  - `detectOrientation?`: 방향 감지
  - `enhanceContrast?`: 대비 향상
  - `timeoutMs?`: 타임아웃 (밀리초)

**Returns:** `Promise<OcrResult>`

### `processFileWithOcr(file, options?)`

통합 API - 파일 타입에 따라 자동 라우팅.

**Parameters:**

- `file`: `File` 객체
- `options?`: `OcrOptions`

**Returns:** `Promise<OcrResult>`

### `detectFileType(file)`

파일 타입 감지 (MIME type + 확장자).

**Returns:** `'image' | 'pdf' | 'word' | 'excel' | 'ppt' | 'unknown'`

### `processImageWithOcr(input, options?)`

이미지 전용 OCR 파이프라인.

### `processPdfWithOcr(input, options?)`

PDF 전용 파이프라인 (텍스트 레이어 우선).

---

## 🔍 파일 타입 감지 로직

### 우선순위

1. **MIME Type 검사** (가장 신뢰도 높음)
   - 정확한 매칭: `application/pdf` → `'pdf'`
   - 일반 카테고리: `image/*` → `'image'`

2. **확장자 검사** (MIME type 없을 때)
   - `.pdf` → `'pdf'`
   - `.jpg`, `.png` → `'image'`
   - `.docx` → `'word'`

3. **Unknown** (둘 다 실패)
   - 미지원 형식으로 처리

### 예시

```typescript
// MIME type이 정확한 경우
new File([], 'doc.txt', { type: 'application/pdf' }); // → 'pdf'

// 확장자로 판단
new File([], 'image.png', { type: '' }); // → 'image'

// 일반 MIME type
new File([], 'photo', { type: 'image/svg+xml' }); // → 'image'

// 알 수 없는 파일
new File([], 'file.xyz', { type: '' }); // → 'unknown'
```

---

## 📋 지원 파일 형식 상세

### 이미지

| 확장자          | MIME Type    | 상태    |
| --------------- | ------------ | ------- |
| `.jpg`, `.jpeg` | `image/jpeg` | ✅ 지원 |
| `.png`          | `image/png`  | ✅ 지원 |
| `.gif`          | `image/gif`  | ✅ 지원 |
| `.webp`         | `image/webp` | ✅ 지원 |
| `.bmp`          | `image/bmp`  | ✅ 지원 |
| `.tiff`, `.tif` | `image/tiff` | ✅ 지원 |

### PDF

| 확장자 | MIME Type         | 상태                          |
| ------ | ----------------- | ----------------------------- |
| `.pdf` | `application/pdf` | ✅ 지원 (텍스트 레이어 + OCR) |

### Office 문서

| 파일           | 확장자          | MIME Type                                                                                                    | 상태              |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------ | ----------------- |
| **Word**       | `.doc`, `.docx` | `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`              | ⏸️ 향후 지원 예정 |
| **Excel**      | `.xls`, `.xlsx` | `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`              | ⏸️ 향후 지원 예정 |
| **PowerPoint** | `.ppt`, `.pptx` | `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` | ⏸️ 향후 지원 예정 |

> **Office 파일 지원**: Apryse WebViewer 또는 Nutrient SDK 통합 계획 중

---

## 🧩 아키텍처

### 어댑터 패턴

```typescript
// OCR 엔진 어댑터
interface OcrEngineAdapter {
  recognize(input: OcrInput, options?: OcrOptions): Promise<OcrResult>;
}

// 구현체
-StubEngine(테스트용) - TesseractEngine(기본);
```

### 파이프라인 구조

```
processFileWithOcr(file)
  ↓
detectFileType(file)
  ↓
┌─────────────┬─────────────┬───────────────┐
│   image     │     pdf     │  word/excel/ppt│
↓             ↓             ↓
processImage  processPdf    [Office → PDF]
WithOcr       WithOcr       → processPdf
  ↓             ↓             ↓
Tesseract.js  PDF.js +      (향후 구현)
              Tesseract
```

### 설정 시스템

```typescript
interface OcrEngineConfig {
  ocrEngine: 'tesseract-js';
  pdfRenderer: 'pdfjs';
  officeIntegration?: 'apryse-webviewer' | 'nutrient-websdk';
}

// 설정 변경
setOcrConfig({ officeIntegration: 'apryse-webviewer' });
```

---

## 🧪 테스트 전략

### TDD 사이클

1. **Red**: 실패하는 테스트 작성
2. **Green**: 최소 구현으로 테스트 통과
3. **Refactor**: 구조 개선

### 테스트 파일 구조

```
packages/ocr-core/test/
├── fixtures/
│   ├── sample.png         # 테스트 이미지
│   └── sample-text.pdf    # 테스트 PDF
├── recognize.test.ts      # 기본 recognize 함수
├── config.test.ts         # 설정 테스트
├── file-type.test.ts      # 파일 타입 감지
├── file-type-mime.test.ts # MIME type 우선순위
├── image-pipeline.test.ts # 이미지 파이프라인
├── pdf-pipeline.test.ts   # PDF 파이프라인
├── office-pipeline.test.ts # Office 파일 에러
└── file-pipeline.test.ts  # 통합 API
```

---

## 🤝 기여하기

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 커밋 컨벤션

- `feat:` - 새 기능
- `fix:` - 버그 수정
- `chore:` - 설정/빌드 변경
- `docs:` - 문서 업데이트
- `test:` - 테스트 추가/수정
- `refactor:` - 리팩토링

---

## 📝 향후 계획

### Phase 1: 핵심 기능 완성 ✅

- [x] Monorepo 구조
- [x] OCR 라이브러리 스캐폴딩
- [x] Tesseract.js 통합
- [x] 파일 타입별 파이프라인

### Phase 2: 웹 UI 완성 🔄

- [ ] 파일 업로드 컴포넌트
- [ ] 드래그앤드롭
- [ ] 결과 표시 UI
- [ ] 옵션 설정 패널

### Phase 3: Office 파일 지원

- [ ] Apryse/Nutrient SDK 통합
- [ ] Office → PDF 변환 어댑터

### Phase 4: 성능 최적화

- [ ] Web Worker 통합
- [ ] 진행률 표시
- [ ] 캐싱 전략

---

## 📄 라이선스

MIT License

---

## 📞 문의

이슈나 풀 리퀘스트를 환영합니다!

Repository: https://github.com/skandla2002ai-andy/OCR_Project
