# TDD 가이드라인 (Test-Driven Development)

이 프로젝트는 TDD 원칙을 준수하여 개발됩니다. 새로운 기능을 추가하거나 수정할 때 다음 프로세스를 따릅니다.

## 1. TDD 사이클 (Red-Green-Refactor)

### 🔴 Red: 실패하는 테스트 작성

기능을 구현하기 전에 먼저 테스트 코드를 작성합니다. 이때 테스트는 당연히 실패해야 합니다.

**목표:**

- 구현할 기능의 인터페이스(API)를 미리 정의
- 기대하는 동작과 결과값을 명확히 정의
- 테스트 실패를 통해 기능 부재를 확인

**예시:**

```typescript
// test/example.test.ts
describe('detectFileType', () => {
  it('detects pdf file', () => {
    // 아직 구현되지 않은 함수
    expect(detectFileType(new File([], 'test.pdf'))).toBe('pdf');
  });
});
```

### 🟢 Green: 테스트 통과를 위한 최소 구현

테스트를 통과하기 위해 "최소한의 코드"만 작성합니다. 완벽한 구조나 성능보다는 테스트 통과가 우선입니다.

**목표:**

- 빠른 피드백 (테스트 통과 확인)
- 오버 엔지니어링 방지

**예시:**

```typescript
// src/utils.ts
export function detectFileType(file: File) {
  if (file.name.endsWith('.pdf')) return 'pdf';
  return 'unknown';
}
```

### 🔵 Refactor: 리팩토링

테스트가 통과된 상태에서 코드의 구조, 가독성, 성능을 개선합니다. 테스트가 보호막 역할을 하므로 안전하게 수정할 수 있습니다.

**목표:**

- 중복 제거
- 가독성 향상
- 더 나은 알고리즘 적용

**예시:**

```typescript
// src/utils.ts (리팩토링 후)
const EXT_MAP = { '.pdf': 'pdf' };
export function detectFileType(file: File) {
  const ext = getExtension(file.name);
  return EXT_MAP[ext] || 'unknown';
}
```

---

## 2. 테스트 작성 원칙

1. **단위 테스트 (Unit Test) 우선**
   - 함수/클래스 단위로 격리하여 테스트합니다.
   - 외부 의존성(API, DB 등)은 Mocking하여 테스트 속도와 안정성을 확보합니다.

2. **테스트 설명 명확화**
   - `it('should return true when input is valid', ...)` (X - 모호함)
   - `it('returns "pdf" when file extension is .pdf', ...)` (O - 명확함)

3. **테스트 데이터 (Fixture) 활용**
   - `packages/ocr-core/test/fixtures/` 경로에 테스트용 샘플 파일(이미지, PDF 등)을 관리합니다.

---

## 3. Cursor AI를 활용한 TDD 워크플로

Cursor와 함께 개발할 때 다음 프롬프트 패턴을 사용하면 효과적입니다.

1. **Red 단계:**

   > "새로운 기능 X를 구현하려고 해. 먼저 실패하는 테스트 케이스를 작성해줘."

2. **Green 단계:**

   > "테스트를 통과하기 위한 최소한의 구현 코드를 작성해줘."

3. **Refactor 단계:**
   > "코드를 더 깔끔하게 리팩토링해주고, 테스트가 여전히 통과하는지 확인해줘."

---

## 4. 테스트 실행 명령어

```bash
# 전체 테스트
pnpm test

# 특정 패키지 테스트
pnpm --filter @core-nexus/ocr-core test

# 특정 파일 테스트
pnpm test -- ui/Button.test.tsx

# Watch 모드 (파일 변경 시 자동 실행)
pnpm test -- --watch
```
