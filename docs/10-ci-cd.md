# 10. CI/CD 통합

E2E 테스트는 CI/CD 파이프라인에 통합되어야 진정한 가치를 발휘합니다. 이 챕터에서는 GitHub Actions를 중심으로 Playwright 테스트를 자동화하는 방법을 알아봅니다.

## GitHub Actions 기본 구성

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: npm 패키지 설치
        run: npm ci

      - name: Playwright 브라우저 설치
        run: npx playwright install --with-deps chromium

      - name: E2E 테스트 실행
        run: npx playwright test
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}

      - name: 테스트 리포트 업로드
        uses: actions/upload-artifact@v4
        if: always()  # 실패해도 리포트 업로드
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## 서버 시작 후 테스트 실행

자신의 서버를 띄우고 테스트하는 패턴입니다.

```yaml
# .github/workflows/e2e-with-server.yml
name: E2E Tests with Server

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      # 데이터베이스 서비스 (필요한 경우)
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: 의존성 설치
        run: npm ci

      - name: Playwright 브라우저 설치
        run: npx playwright install --with-deps chromium

      - name: 앱 서버 빌드
        run: npm run build

      - name: 앱 서버 시작 (백그라운드)
        run: npm run start:test &
        env:
          DATABASE_URL: postgresql://postgres:testpassword@localhost:5432/testdb
          PORT: 8080

      - name: 서버 준비 대기
        run: npx wait-on http://localhost:8080/health --timeout 60000

      - name: E2E 테스트 실행
        run: npx playwright test
        env:
          BASE_URL: http://localhost:8080

      - name: 리포트 업로드
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Playwright의 webServer 옵션 활용

```typescript
// playwright.config.ts
export default defineConfig({
  // 테스트 실행 전 서버 자동 시작
  webServer: {
    command: 'npm run start:test',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,  // 로컬에서는 기존 서버 재사용
    timeout: 120_000,
  },

  use: {
    baseURL: 'http://localhost:8080',
  },
});
```

## 병렬 실행으로 테스트 시간 단축

```yaml
# 브라우저별 병렬 실행
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - name: E2E 테스트 (${{ matrix.browser }})
        run: npx playwright test --project=${{ matrix.browser }}
```

```yaml
# 테스트 샤딩 (대규모 테스트 분산 실행)
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]

    steps:
      - name: E2E 테스트 (샤드 ${{ matrix.shard }}/4)
        run: npx playwright test --shard=${{ matrix.shard }}/4
```

## PR 리뷰에 테스트 결과 코멘트

```yaml
- name: Playwright 리포트 (Merge)
  uses: daun/playwright-report-summary@v3
  if: always()
  with:
    report-file: playwright-report/results.json
    comment-title: '🎭 E2E 테스트 결과'
```

## 실무 전략

### 테스트 계층화

CI에서 모든 E2E 테스트를 실행하면 시간이 오래 걸립니다. 계층화로 균형을 맞춥니다.

```yaml
# PR 시: 핵심 플로우만 빠르게 (smoke test)
on:
  pull_request:
    branches: [main]

steps:
  - name: Smoke 테스트 (핵심 플로우)
    run: npx playwright test --grep @smoke

---

# main 브랜치 병합 후: 전체 테스트
on:
  push:
    branches: [main]

steps:
  - name: 전체 E2E 테스트
    run: npx playwright test
```

### 테스트에 태그 추가

```typescript
// 핵심 플로우에 @smoke 태그
test('로그인 @smoke', async ({ page }) => { ... });
test('상품 주문 @smoke', async ({ page }) => { ... });

// CI에서 smoke 테스트만 실행
// npx playwright test --grep @smoke
```

### 테스트 결과 캐싱

```yaml
- name: Playwright 브라우저 캐시
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ hashFiles('package-lock.json') }}
    restore-keys: playwright-
```

## .gitignore 설정

```gitignore
# .gitignore
node_modules/
playwright-report/
test-results/
.auth/
*.zip
```

## 로컬에서 CI 환경 시뮬레이션

```bash
# CI 환경 변수 설정 후 실행
CI=true npx playwright test

# 또는 package.json에 ci 스크립트 추가
# "test:ci": "CI=true playwright test --reporter=github"
```

---

## 학습 완료 체크리스트

이 과정을 통해 습득한 기술:

- [ ] Playwright 설치 및 프로젝트 설정
- [ ] 기본 네비게이션 테스트 작성
- [ ] 역할/레이블/텍스트 기반 로케이터 사용
- [ ] 클릭, 입력, 키보드 등 다양한 액션 수행
- [ ] 가시성, 텍스트, 상태 등 다양한 어서션 사용
- [ ] 페이지 오브젝트 모델로 테스트 구조화
- [ ] REST API 직접 테스트 (GET, POST, PUT, DELETE)
- [ ] UI + API 조합 테스트 패턴 적용
- [ ] storageState로 인증 처리
- [ ] 커스텀 픽스처로 테스트 설정 재사용
- [ ] 네트워크 모킹으로 외부 의존성 제거
- [ ] GitHub Actions CI/CD 파이프라인 구성

## 다음 단계

- 자신의 서비스에서 핵심 사용자 플로우 3가지를 E2E 테스트로 작성
- Playwright Codegen으로 테스트 초안 자동 생성 실습
- 팀의 CI/CD 파이프라인에 E2E 테스트 단계 추가

---

| | |
|---|---|
| 이전 문서 | [← 09. 고급 패턴](./09-advanced-patterns.md) |
| 다음 문서 | - |
