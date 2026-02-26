# 02. 설치와 프로젝트 설정

## 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

```bash
node --version  # v18.x 이상
npm --version
```

## 프로젝트 초기화

```bash
# 새 디렉토리 생성 및 이동
mkdir hello-playwright && cd hello-playwright

# npm 프로젝트 초기화
npm init -y

# Playwright 및 TypeScript 설치
npm install -D @playwright/test typescript @types/node

# Playwright 브라우저 설치 (최초 1회)
npx playwright install
```

> 이 프로젝트는 이미 설치가 완료되어 있습니다.

## 프로젝트 구조

```
hello-playwright/
├── playwright.config.ts     # Playwright 전체 설정
├── tsconfig.json            # TypeScript 설정
├── package.json
│
├── tests/                   # 테스트 파일 (실습 코드)
│   ├── 01-basics/           # 기본 네비게이션
│   ├── 02-locators/         # 로케이터 전략
│   ├── 03-actions/          # 액션 (클릭, 입력 등)
│   ├── 04-assertions/       # 어서션
│   ├── 05-page-objects/     # POM 패턴
│   ├── 06-api/              # API 테스트
│   ├── 07-auth/             # 인증 처리
│   └── 08-fixtures/         # 커스텀 픽스처
│
├── pages/                   # 페이지 오브젝트
│   └── TodoPage.ts
│
├── fixtures/                # 커스텀 픽스처
│   └── custom-fixtures.ts
│
└── docs/                    # 교육 문서
    ├── 01-introduction.md
    ├── 02-installation.md
    └── ...
```

## playwright.config.ts 상세 설명

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 테스트 파일 위치
  testDir: './tests',

  // 모든 테스트 파일을 병렬로 실행
  fullyParallel: true,

  // CI에서 test.only 사용 시 빌드 실패 (실수 방지)
  forbidOnly: !!process.env.CI,

  // CI에서 실패한 테스트 재시도 횟수
  retries: process.env.CI ? 2 : 0,

  // 리포트 형식
  reporter: [['html'], ['list']],

  use: {
    // 기본 URL (page.goto('/path') 처럼 상대 경로 사용 가능)
    baseURL: 'http://localhost:8080',

    // 실패 시 스크린샷 자동 저장
    screenshot: 'only-on-failure',

    // 실패 시 동영상 저장
    video: 'retain-on-failure',

    // 재시도 시 트레이스 저장 (상세 디버깅)
    trace: 'on-first-retry',
  },

  // 테스트 실행 브라우저 설정
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
```

> 참고: [`playwright.config.ts`](../playwright.config.ts)

## 실무에서의 baseURL 설정

자신의 서비스를 테스트할 때는 `baseURL`을 설정하면 편리합니다.

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // 로컬 개발 서버
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
  },
});
```

```bash
# 환경별로 다른 서버 대상으로 테스트
BASE_URL=https://staging.myservice.com npx playwright test
BASE_URL=https://prod.myservice.com npx playwright test
```

## package.json 스크립트

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:report": "playwright show-report",
    "test:basics": "playwright test tests/01-basics"
  }
}
```

> 참고: [`package.json`](../package.json)

## 실행 방법

```bash
# 전체 테스트 실행 (headless)
npm test

# UI 모드로 실행 (테스트 선택, 실시간 확인)
npm run test:ui

# 브라우저 창을 보면서 실행 (headed)
npm run test:headed

# 단계별 디버그 모드
npm run test:debug

# 특정 디렉토리만 실행
npm run test:basics

# 특정 파일만 실행
npx playwright test tests/06-api/api.spec.ts

# 특정 테스트 이름으로 실행 (-g: grep)
npx playwright test -g "GET /posts"

# HTML 리포트 확인
npm run test:report
```

## 유용한 CLI 옵션

```bash
# 특정 브라우저로만 실행
npx playwright test --project=chromium

# 실패한 테스트만 재실행
npx playwright test --last-failed

# 동시 실행 Worker 수 조정
npx playwright test --workers=4

# 느린 테스트 확인 (5000ms 이상)
npx playwright test --reporter=list

# 코드 생성기 (Codegen) - 브라우저 조작을 자동으로 코드로 변환
npx playwright codegen https://myservice.com
```

## Playwright Inspector (디버그 도구)

`test:debug` 스크립트로 실행하면 Inspector가 열립니다:
- 테스트를 단계별로 실행
- 각 단계에서 DOM 상태 확인
- 로케이터 검사 및 수정
- 스크린샷 확인

```bash
# 특정 테스트를 디버그 모드로 실행
npx playwright test tests/01-basics/navigation.spec.ts --debug
```

## Codegen - 코드 자동 생성

브라우저에서 직접 조작하면서 코드를 자동 생성하는 기능입니다.

```bash
# 코드 생성기 실행
npx playwright codegen https://demo.playwright.dev/todomvc
```

브라우저에서 클릭, 입력 등을 하면 오른쪽 패널에 Playwright 코드가 자동으로 생성됩니다. 처음 시작할 때 매우 유용합니다.

---

| | |
|---|---|
| 이전 문서 | [← 01. Playwright 소개](./01-introduction.md) |
| 다음 문서 | [03. 첫 번째 테스트 →](./03-first-test.md) |
