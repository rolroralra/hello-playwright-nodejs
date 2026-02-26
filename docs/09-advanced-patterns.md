# 09. 고급 패턴

## 커스텀 픽스처 (Custom Fixtures)

픽스처는 테스트에 필요한 리소스를 선언적으로 준비하는 메커니즘입니다. `beforeEach`보다 재사용성이 높고 명확합니다.

> 실습 파일:
> - [`fixtures/custom-fixtures.ts`](../fixtures/custom-fixtures.ts)
> - [`tests/08-fixtures/fixtures.spec.ts`](../tests/08-fixtures/fixtures.spec.ts)

### 커스텀 픽스처 정의

```typescript
// fixtures/custom-fixtures.ts
import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type MyFixtures = {
  loginPage: LoginPage;
  loggedInPage: Page;
};

export const test = base.extend<MyFixtures>({
  // loginPage 픽스처
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);  // 테스트에 전달
    // 테스트 종료 후 정리 코드 (필요시)
  },

  // loggedInPage 픽스처 (로그인된 상태의 page)
  loggedInPage: async ({ page }, use) => {
    // 로그인 수행
    await page.goto('/login');
    await page.getByLabel('이메일').fill('user@example.com');
    await page.getByLabel('비밀번호').fill('password123');
    await page.getByRole('button', { name: '로그인' }).click();
    await page.waitForURL('/dashboard');

    await use(page);  // 로그인된 상태의 page를 테스트에 전달
  },
});

export { expect } from '@playwright/test';
```

### 커스텀 픽스처 사용

```typescript
// fixtures/custom-fixtures.ts에서 export한 test 사용
import { test, expect } from '../../fixtures/custom-fixtures';

test('loginPage 픽스처 사용', async ({ loginPage }) => {
  // loginPage가 자동으로 준비됨
  await loginPage.login('user@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});

test('loggedInPage 픽스처 사용', async ({ loggedInPage }) => {
  // 이미 로그인된 상태의 page
  await loggedInPage.goto('/profile');
  await expect(loggedInPage.getByText('내 프로필')).toBeVisible();
});
```

---

## 네트워크 모킹 (Network Mocking)

실제 API 서버 없이 프론트엔드를 테스트하거나, 특정 오류 응답을 테스트할 때 유용합니다.

### page.route() - 요청 인터셉트

```typescript
test('API 모킹 - 상품 목록', async ({ page }) => {
  // /api/products 요청을 가로채 모킹 데이터 반환
  await page.route('/api/products', async route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [
        { id: 1, name: '상품 A', price: 10000 },
        { id: 2, name: '상품 B', price: 20000 },
      ],
    });
  });

  await page.goto('/products');
  await expect(page.getByText('상품 A')).toBeVisible();
  await expect(page.getByText('상품 B')).toBeVisible();
});

test('API 오류 모킹 - 서버 오류 처리 확인', async ({ page }) => {
  await page.route('/api/products', route => {
    route.fulfill({ status: 500, json: { error: '서버 오류' } });
  });

  await page.goto('/products');
  await expect(page.getByRole('alert')).toContainText('오류가 발생했습니다');
});

test('네트워크 지연 시뮬레이션', async ({ page }) => {
  await page.route('/api/products', async route => {
    await new Promise(resolve => setTimeout(resolve, 3000));  // 3초 지연
    await route.continue();  // 원래 요청을 그대로 전달
  });

  await page.goto('/products');
  // 로딩 스피너가 표시되는지 확인
  await expect(page.getByTestId('loading-spinner')).toBeVisible();
  await expect(page.getByTestId('loading-spinner')).toBeHidden();
});
```

### 특정 요청만 모킹

```typescript
test('일부 요청만 모킹', async ({ page }) => {
  // 외부 결제 API만 모킹 (나머지는 실제 서버 사용)
  await page.route('**/payment-gateway.com/**', route => {
    route.fulfill({
      status: 200,
      json: { success: true, transactionId: 'test-tx-001' },
    });
  });

  // 실제 앱 서버에서 주문 진행
  await page.goto('/checkout');
  await page.getByRole('button', { name: '결제하기' }).click();
  await expect(page.getByText('결제 완료')).toBeVisible();
});
```

---

## 병렬 실행 (Parallel Execution)

### 파일 단위 병렬 실행 (기본)

```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,   // 파일 간 병렬 실행
  workers: 4,             // 동시 실행 Worker 수
});
```

### 같은 파일 내 병렬 실행

```typescript
// 같은 파일 내에서도 병렬 실행
test.describe.parallel('병렬 실행 그룹', () => {
  test('테스트 1', async ({ page }) => { ... });
  test('테스트 2', async ({ page }) => { ... });
  test('테스트 3', async ({ page }) => { ... });
});
```

### 순차 실행 강제

```typescript
// 특정 그룹은 반드시 순차 실행 (순서 의존성이 있는 경우)
test.describe.serial('순서 중요한 그룹', () => {
  test('1단계: 데이터 생성', async ({ page }) => { ... });
  test('2단계: 데이터 수정', async ({ page }) => { ... });
  test('3단계: 데이터 삭제', async ({ page }) => { ... });
});
```

---

## Trace Viewer 활용

Playwright Trace는 테스트 실행의 모든 것을 기록합니다.

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    trace: 'on-first-retry',  // 첫 재시도 시 트레이스 저장
    // 'on': 항상 저장
    // 'off': 저장 안 함
    // 'retain-on-failure': 실패 시에만 저장
  },
});
```

```bash
# 트레이스 파일 확인
npx playwright show-trace test-results/my-test-trace.zip

# 리포트에서 확인 (실패한 테스트 클릭 후 Trace 탭)
npx playwright show-report
```

---

## 스크린샷 및 동영상

```typescript
// 테스트 중 스크린샷 직접 촬영
await page.screenshot({ path: 'screenshots/step1.png' });

// 특정 요소만 스크린샷
await page.getByRole('table').screenshot({ path: 'screenshots/table.png' });

// 전체 페이지 스크린샷 (스크롤 포함)
await page.screenshot({ path: 'screenshots/full-page.png', fullPage: true });
```

---

## 환경별 설정

```typescript
// playwright.config.ts
const isCI = !!process.env.CI;

export default defineConfig({
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    headless: isCI ? true : false,
    video: isCI ? 'retain-on-failure' : 'off',
  },
});
```

```bash
# 환경별 실행
BASE_URL=https://staging.myservice.com npm test
BASE_URL=https://prod.myservice.com npm test
```

---

## 실습 코드 실행

```bash
# 픽스처 실습 실행
npm run test:fixtures

# 전체 테스트 실행
npm test
```

---

| | |
|---|---|
| 이전 문서 | [← 08. 인증 처리](./08-authentication.md) |
| 다음 문서 | [10. CI/CD 통합 →](./10-ci-cd.md) |
