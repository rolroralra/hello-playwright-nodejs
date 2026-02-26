# 03. 첫 번째 테스트 작성

## 테스트 파일 구조

Playwright 테스트 파일은 `.spec.ts` 확장자를 사용합니다.

```typescript
import { test, expect } from '@playwright/test';

// test.describe: 관련 테스트를 그룹으로 묶음
test.describe('그룹 이름', () => {

  // test.beforeEach: 각 테스트 전에 실행
  test.beforeEach(async ({ page }) => {
    await page.goto('https://example.com');
  });

  // test: 개별 테스트
  test('테스트 이름', async ({ page }) => {
    // 테스트 본문
    await expect(page).toHaveTitle('Example Domain');
  });
});
```

## 첫 번째 테스트 분석

> 실습 파일: [`tests/01-basics/navigation.spec.ts`](../tests/01-basics/navigation.spec.ts)

```typescript
import { test, expect } from '@playwright/test';

test.describe('기본 네비게이션', () => {
  test('페이지 제목 확인', async ({ page }) => {
    // 1. 페이지 이동
    await page.goto('https://playwright.dev');

    // 2. 브라우저 탭 제목 확인
    await expect(page).toHaveTitle(/Playwright/);
  });
});
```

### 코드 분석

| 코드 | 설명 |
|------|------|
| `test('이름', async ({ page }) => {})` | 테스트 함수. `page`는 자동으로 주입되는 브라우저 페이지 |
| `await page.goto(url)` | 지정 URL로 이동 |
| `expect(page).toHaveTitle(/pattern/)` | 페이지 제목이 정규식과 일치하는지 확인 |

## 테스트 픽스처 (Fixtures)

`async ({ page })` 안의 `page`는 Playwright가 제공하는 내장 픽스처입니다.

| 픽스처 | 타입 | 설명 |
|--------|------|------|
| `page` | `Page` | 브라우저의 새 탭 |
| `browser` | `Browser` | 브라우저 인스턴스 |
| `context` | `BrowserContext` | 쿠키/세션이 격리된 브라우저 컨텍스트 |
| `request` | `APIRequestContext` | HTTP 요청 클라이언트 |

```typescript
// page만 사용
test('UI 테스트', async ({ page }) => { ... });

// API 요청 클라이언트 사용
test('API 테스트', async ({ request }) => { ... });

// UI + API 동시 사용
test('UI + API 조합', async ({ page, request }) => { ... });
```

## 테스트 훅 (Hooks)

```typescript
test.describe('훅 예시', () => {
  test.beforeAll(async ({ browser }) => {
    // 이 describe 블록의 모든 테스트 전에 1회 실행
    // browser 픽스처 사용 (page 대신)
  });

  test.afterAll(async () => {
    // 이 describe 블록의 모든 테스트 후에 1회 실행
  });

  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 실행
    await page.goto('https://example.com');
  });

  test.afterEach(async ({ page }) => {
    // 각 테스트 후에 실행 (정리 작업)
  });

  test('테스트 1', async ({ page }) => { ... });
  test('테스트 2', async ({ page }) => { ... });
});
```

## 테스트 제어

```typescript
// 특정 테스트만 실행 (개발 중 임시 사용)
test.only('이것만 실행', async ({ page }) => { ... });

// 특정 테스트 건너뜀
test.skip('이건 건너뜀', async ({ page }) => { ... });

// 조건부로 건너뜀
test.skip(process.env.CI === 'true', '이건 CI에서 건너뜀');

// 실패할 것으로 예상되는 테스트
test.fail('알려진 버그', async ({ page }) => { ... });
```

## 자동 대기 (Auto-Waiting) 이해하기

Playwright는 요소가 상호작용 가능한 상태가 될 때까지 **자동으로 기다립니다**. 수동 `sleep()`은 불필요합니다.

```typescript
// ❌ 이렇게 하지 않아도 됨
await page.waitForTimeout(2000);
await page.getByRole('button').click();

// ✅ 이렇게만 해도 됨 (자동 대기)
await page.getByRole('button').click();
```

### 자동 대기가 확인하는 것

1. **Attached**: DOM에 존재하는가?
2. **Visible**: 화면에 보이는가?
3. **Stable**: 애니메이션이 끝났는가?
4. **Enabled**: 비활성화(disabled)되지 않았는가?
5. **Editable**: 편집 가능한가? (입력 필드)
6. **Receives events**: 클릭 이벤트를 받을 수 있는가?

## 첫 번째 테스트 실행하기

```bash
# 01-basics 테스트 실행
npm run test:basics

# 또는 직접 지정
npx playwright test tests/01-basics/navigation.spec.ts

# UI 모드로 실행 (권장 - 시각적으로 확인 가능)
npx playwright test tests/01-basics --ui
```

### 실행 결과 예시

```
Running 5 tests using 1 worker

  ✓  1 [chromium] › 01-basics/navigation.spec.ts:11:3 › 기본 네비게이션 › 페이지 제목 확인 (1.2s)
  ✓  2 [chromium] › 01-basics/navigation.spec.ts:18:3 › 기본 네비게이션 › 특정 URL로 이동 (0.8s)
  ✓  3 [chromium] › 01-basics/navigation.spec.ts:25:3 › 기본 네비게이션 › 링크 클릭 후 페이지 이동 확인 (1.1s)
  ✓  4 [chromium] › 01-basics/navigation.spec.ts:33:3 › 기본 네비게이션 › 앞으로/뒤로 이동 (1.5s)
  ✓  5 [chromium] › 01-basics/navigation.spec.ts:43:3 › 기본 네비게이션 › 페이지 새로고침 (0.9s)

  5 passed (6.1s)
```

## 실패한 테스트 디버깅

```bash
# 실패 시 HTML 리포트에서 스크린샷과 트레이스 확인
npx playwright show-report

# 특정 테스트를 단계별로 실행
npx playwright test tests/01-basics --debug
```

### HTML 리포트에서 확인할 수 있는 것
- 테스트 실행 시간
- 실패한 단계와 스크린샷
- Trace Viewer (단계별 DOM 상태, 네트워크 요청)

---

| | |
|---|---|
| 이전 문서 | [← 02. 설치와 프로젝트 설정](./02-installation.md) |
| 다음 문서 | [04. 로케이터 →](./04-locators.md) |
