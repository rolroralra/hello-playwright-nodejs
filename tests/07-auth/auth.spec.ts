import { test, expect, BrowserContext } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 07. 인증 처리 (Authentication)
 *
 * 목표: 로그인이 필요한 서비스를 테스트하는 다양한 방법을 익힌다.
 *
 * 전략 1: storageState - 로그인 상태를 파일로 저장하여 재사용 (권장)
 * 전략 2: 각 테스트마다 로그인 수행 (느리지만 단순)
 * 전략 3: API로 로그인 토큰 발급 후 쿠키/헤더 설정
 *
 * 실습 대상: https://the-internet.herokuapp.com/login
 */

// storageState 파일 경로
const STORAGE_STATE_PATH = path.join(process.cwd(), '.auth', 'user.json');

/**
 * 전략 1: storageState를 활용한 세션 재사용
 *
 * 개념:
 * - 최초 로그인 시 브라우저의 쿠키/localStorage 상태를 파일로 저장
 * - 이후 테스트에서는 저장된 상태를 로드하여 로그인 과정 스킵
 * - CI/CD에서 매우 효과적 (로그인 비용 1회만 지불)
 */
test.describe('전략 1: storageState로 세션 재사용', () => {
  // 이 describe 블록의 모든 테스트는 저장된 인증 상태로 실행
  test.use({ storageState: STORAGE_STATE_PATH });

  test.beforeAll(async ({ browser }) => {
    // .auth 디렉토리 생성
    if (!fs.existsSync(path.join(process.cwd(), '.auth'))) {
      fs.mkdirSync(path.join(process.cwd(), '.auth'), { recursive: true });
    }

    // 로그인 수행 후 상태 저장
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://the-internet.herokuapp.com/login');
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await page.getByRole('button', { name: 'Login' }).click();

    // 로그인 성공 확인
    await expect(page.locator('.flash.success')).toBeVisible();

    // 인증 상태 저장
    await context.storageState({ path: STORAGE_STATE_PATH });
    await context.close();
  });

  test('로그인 상태에서 보안 페이지 접근', async ({ page }) => {
    // storageState로 이미 로그인된 상태
    await page.goto('https://the-internet.herokuapp.com/secure');

    // 로그인 후 접근 가능한 콘텐츠 확인
    await expect(page.locator('.flash.success')).toBeVisible();
  });

  test('로그인 상태 유지 - 여러 페이지 이동', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/secure');
    await expect(page.locator('h2')).toContainText('Secure Area');

    // 다른 페이지 이동 후 돌아와도 세션 유지
    await page.goto('https://the-internet.herokuapp.com');
    await page.goto('https://the-internet.herokuapp.com/secure');
    await expect(page.locator('h2')).toContainText('Secure Area');
  });
});

/**
 * 전략 2: 각 테스트마다 직접 로그인
 *
 * 단점: 테스트마다 로그인 요청 발생 → 느림
 * 장점: 각 테스트가 완전히 독립적
 */
test.describe('전략 2: 각 테스트마다 로그인', () => {
  test('로그인 후 보안 페이지 접근', async ({ page }) => {
    // 1. 로그인 페이지 이동
    await page.goto('https://the-internet.herokuapp.com/login');

    // 2. 자격증명 입력
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');

    // 3. 로그인 버튼 클릭
    await page.getByRole('button', { name: 'Login' }).click();

    // 4. 로그인 성공 확인
    await expect(page.locator('.flash.success')).toBeVisible();
    await expect(page).toHaveURL(/\/secure/);
  });

  test('잘못된 자격증명으로 로그인 실패', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');

    await page.getByLabel('Username').fill('wronguser');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    // 로그인 실패 메시지 확인
    await expect(page.locator('.flash.error')).toBeVisible();
    // 로그인 페이지에 그대로 있음
    await expect(page).toHaveURL(/\/login/);
  });

  test('로그아웃', async ({ page }) => {
    // 로그인
    await page.goto('https://the-internet.herokuapp.com/login');
    await page.getByLabel('Username').fill('tomsmith');
    await page.getByLabel('Password').fill('SuperSecretPassword!');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/secure/);

    // 로그아웃
    await page.getByRole('link', { name: 'Logout' }).click();

    // 로그아웃 후 로그인 페이지로 이동
    await expect(page).toHaveURL(/\/login/);
  });
});

/**
 * 전략 3: API를 통한 인증 토큰 설정
 *
 * Bearer 토큰 기반 API를 테스트할 때 유용
 * 실제 서비스에서는 이 패턴을 많이 사용
 */
test.describe('전략 3: API 토큰으로 인증 (개념 예시)', () => {
  test('API 요청에 Authorization 헤더 설정', async ({ request }) => {
    // 실제 서비스에서는 로그인 API 호출로 토큰 획득
    // const loginResponse = await request.post('/api/auth/login', {
    //   data: { username: 'user', password: 'pass' }
    // });
    // const { token } = await loginResponse.json();

    // 개념 예시: Authorization 헤더로 API 호출
    const token = 'Bearer example-jwt-token';

    const response = await request.get('https://jsonplaceholder.typicode.com/posts/1', {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    // jsonplaceholder는 토큰 검증을 하지 않지만,
    // 실제 서비스에서는 401/403 등을 검증
    expect(response.status()).toBe(200);
  });
});
