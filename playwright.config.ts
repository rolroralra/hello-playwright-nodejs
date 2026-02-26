import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 설정 파일
 * 참고: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 테스트 파일이 위치한 디렉토리
  testDir: './tests',

  // 각 테스트 파일은 순차 실행 (같은 파일 내 테스트)
  fullyParallel: true,

  // CI 환경에서 test.only 사용 시 빌드 실패 처리
  forbidOnly: !!process.env.CI,

  // CI 환경에서 실패 시 재시도 횟수
  retries: process.env.CI ? 2 : 0,

  // 병렬 실행할 Worker 수
  workers: process.env.CI ? 1 : undefined,

  // 리포트 형식 설정
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // 모든 테스트에 공통으로 적용할 설정
  use: {
    // 기본 URL (테스트 대상 서비스의 기본 주소)
    baseURL: 'https://demo.playwright.dev',

    // 테스트 실패 시 스크린샷 자동 저장
    screenshot: 'only-on-failure',

    // 테스트 실패 시 동영상 자동 저장
    video: 'retain-on-failure',

    // 테스트 실패 시 트레이스 저장 (상세 디버깅용)
    trace: 'on-first-retry',

    // 브라우저 액션 타임아웃 (ms)
    actionTimeout: 10_000,

    // 네비게이션 타임아웃 (ms)
    navigationTimeout: 30_000,
  },

  // 테스트 실행 환경 정의 (브라우저 종류)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 필요 시 다른 브라우저 활성화
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // 모바일 환경 테스트
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],
});
