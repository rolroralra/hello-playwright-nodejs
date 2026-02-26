# 01. Playwright 소개

## Playwright란?

Playwright는 Microsoft가 개발한 오픈소스 E2E(End-to-End) 테스트 프레임워크입니다. Chromium, Firefox, WebKit 등 주요 브라우저를 지원하며, 하나의 API로 모든 브라우저를 자동화할 수 있습니다.

```
실제 브라우저
  ┌─────────────────────────────┐
  │   Chrome / Firefox / Safari │
  │                             │
  │   ┌─────────────────────┐   │
  │   │    웹 애플리케이션    │   │
  │   │  (서버가 만든 UI)    │   │
  │   └─────────────────────┘   │
  └─────────────────────────────┘
           ▲
           │ 자동화
           │
  ┌─────────────────────┐
  │     Playwright      │
  │  (테스트 코드 실행)  │
  └─────────────────────┘
```

## 왜 서버 개발자에게 E2E 테스트가 필요한가?

서버 개발자는 보통 단위 테스트와 통합 테스트에 익숙합니다. 하지만 실제 사용자 관점에서 서비스 전체 흐름을 검증하는 E2E 테스트는 다른 가치를 제공합니다.

### 테스트 피라미드에서 E2E의 위치

```
        ▲
       /E\      ← E2E 테스트 (소수, 고비용, 고가치)
      / 2E \        실제 브라우저로 전체 흐름 검증
     /─────\
    /통합테스트\   ← 통합 테스트 (중간)
   /           \     API, DB, 서비스 계층 연동 검증
  /─────────────\
 /  단위  테스트  \  ← 단위 테스트 (다수, 저비용)
/─────────────────\   개별 함수/클래스 검증
```

### E2E 테스트가 발견하는 버그

| 테스트 유형 | 발견 가능한 문제 |
|------------|----------------|
| 단위 테스트 | 개별 함수 로직 오류 |
| 통합 테스트 | API ↔ DB 연동 오류 |
| **E2E 테스트** | **실제 사용자 흐름 전체의 오류** |

예를 들어, 다음과 같은 문제는 E2E 테스트만이 발견합니다:
- API 응답 스펙이 맞아도 UI에서 렌더링 오류 발생
- 인증 토큰이 올바르게 전달되지 않아 로그인 후 특정 페이지 접근 불가
- 여러 API를 순서대로 호출해야 하는 플로우에서 타이밍 이슈

## Playwright vs 다른 테스트 도구 비교

| 기능 | Playwright | Cypress | Selenium |
|------|-----------|---------|----------|
| 브라우저 지원 | Chromium, Firefox, WebKit | Chrome (주력), Firefox | 모든 브라우저 |
| API 테스트 | 지원 | 지원 | 미지원 |
| 병렬 실행 | 네이티브 지원 | 유료(Cloud) | 설정 복잡 |
| 자동 대기 | 자동 | 자동 | 수동 |
| 언어 지원 | TypeScript, JS, Python, Java, C# | JS/TS | 다수 |
| 성능 | 빠름 | 중간 | 느림 |

## Playwright가 제공하는 것

### 1. 자동 대기 (Auto-Waiting)
수동으로 `sleep()` 또는 `waitFor()`를 호출할 필요 없습니다. 요소가 클릭 가능한 상태가 될 때까지 자동으로 기다립니다.

```typescript
// 자동으로 버튼이 나타날 때까지 기다림
await page.getByRole('button', { name: 'Submit' }).click();
```

### 2. 강력한 로케이터
사용자가 실제로 보는 것(텍스트, 역할, 레이블)을 기반으로 요소를 찾습니다.

```typescript
// 접근성 역할 기반 (권장)
page.getByRole('button', { name: '로그인' })
page.getByLabel('이메일')
page.getByPlaceholder('이메일을 입력하세요')
```

### 3. 네트워크 인터셉트
API 요청을 가로채고 응답을 조작할 수 있습니다.

```typescript
// API 응답 모킹
await page.route('/api/users', route => {
  route.fulfill({ json: [{ id: 1, name: '테스트 사용자' }] });
});
```

### 4. UI + API 통합 테스트
브라우저 자동화와 HTTP 요청을 같은 테스트에서 처리합니다.

```typescript
test('주문 생성 후 목록에 표시', async ({ page, request }) => {
  // API로 주문 생성
  const order = await request.post('/api/orders', { data: { productId: 1 } });
  const { id } = await order.json();

  // UI에서 주문 목록 확인
  await page.goto('/orders');
  await expect(page.getByText(`주문 #${id}`)).toBeVisible();
});
```

## 이 교육에서 배우는 것

| 단계 | 주제 | 목표 |
|------|------|------|
| 01 | Playwright 소개 | E2E 테스트의 필요성 이해 |
| 02 | 설치와 설정 | 프로젝트 구성 방법 |
| 03 | 첫 번째 테스트 | 기본 테스트 작성 |
| 04 | 로케이터 | 요소를 찾는 다양한 방법 |
| 05 | 액션과 어서션 | UI 조작 및 결과 검증 |
| 06 | 페이지 오브젝트 모델 | 테스트 코드 구조화 |
| 07 | API 테스트 | REST API 직접 검증 |
| 08 | 인증 처리 | 로그인이 필요한 서비스 테스트 |
| 09 | 고급 패턴 | 픽스처, 네트워크 모킹, 병렬화 |
| 10 | CI/CD 통합 | 자동화 파이프라인 구성 |

## 교육 목표

이 과정을 마치면 다음을 할 수 있습니다:
- 실제 서비스의 주요 사용자 플로우를 E2E 테스트로 작성
- API 엔드포인트를 Playwright로 테스트
- 로그인이 필요한 보안 페이지 테스트
- 유지보수 가능한 테스트 코드 구조화 (POM 패턴)
- GitHub Actions 등 CI/CD에 테스트 통합

---

## 참고 자료

- [Playwright 공식 문서](https://playwright.dev)
- [Playwright GitHub](https://github.com/microsoft/playwright)

---

| | |
|---|---|
| 이전 문서 | - |
| 다음 문서 | [02. 설치와 프로젝트 설정 →](./02-installation.md) |
