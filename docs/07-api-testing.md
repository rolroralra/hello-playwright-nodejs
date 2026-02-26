# 07. API 테스트

Playwright는 브라우저 자동화뿐만 아니라 REST API를 직접 테스트하는 기능도 제공합니다. 서버 개발자에게 특히 유용한 기능입니다.

> 실습 파일: [`tests/06-api/api.spec.ts`](../tests/06-api/api.spec.ts)

## APIRequestContext

Playwright의 `request` 픽스처는 `APIRequestContext` 인스턴스를 제공합니다. HTTP 클라이언트(axios, fetch)처럼 사용할 수 있습니다.

```typescript
test('API 테스트 기본 구조', async ({ request }) => {
  const response = await request.get('https://api.example.com/users');

  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data).toHaveLength(10);
});
```

## HTTP 메서드별 사용법

### GET

```typescript
// 기본 GET
const response = await request.get('https://jsonplaceholder.typicode.com/posts');

// 쿼리 파라미터
const response = await request.get('/posts', {
  params: { userId: 1, _limit: 10 }
});
// → GET /posts?userId=1&_limit=10

// 커스텀 헤더
const response = await request.get('/posts', {
  headers: { 'Authorization': 'Bearer token123' }
});
```

### POST

```typescript
const response = await request.post('/posts', {
  data: {
    title: '새 게시물',
    body: '내용',
    userId: 1,
  },
});

expect(response.status()).toBe(201);
const created = await response.json();
expect(created).toHaveProperty('id');
```

### PUT / PATCH

```typescript
// PUT: 전체 업데이트
const response = await request.put('/posts/1', {
  data: { id: 1, title: '수정된 제목', body: '수정된 내용', userId: 1 },
});

// PATCH: 부분 업데이트
const response = await request.patch('/posts/1', {
  data: { title: '제목만 수정' },
});
```

### DELETE

```typescript
const response = await request.delete('/posts/1');
expect(response.status()).toBe(200); // 또는 204
```

## 응답 검증

```typescript
const response = await request.get('/users/1');

// 상태 코드 확인
expect(response.status()).toBe(200);
expect(response.ok()).toBeTruthy();  // 200-299 범위

// 응답 헤더 확인
expect(response.headers()['content-type']).toContain('application/json');

// 응답 바디 확인
const user = await response.json();
expect(user.id).toBe(1);
expect(user.name).toBeTruthy();
expect(user.email).toMatch(/@/);

// 응답 텍스트 (JSON이 아닌 경우)
const text = await response.text();
expect(text).toContain('OK');
```

## 오류 응답 테스트

서버 개발자에게 중요한 부분입니다. 다양한 오류 케이스를 명시적으로 테스트합니다.

```typescript
test.describe('오류 케이스 테스트', () => {
  test('404 - 존재하지 않는 리소스', async ({ request }) => {
    const response = await request.get('/users/99999');
    expect(response.status()).toBe(404);
  });

  test('401 - 인증 필요', async ({ request }) => {
    const response = await request.get('/admin/users');
    expect(response.status()).toBe(401);

    const error = await response.json();
    expect(error.message).toContain('인증');
  });

  test('400 - 잘못된 요청', async ({ request }) => {
    const response = await request.post('/users', {
      data: { /* 필수 필드 누락 */ },
    });
    expect(response.status()).toBe(400);

    const error = await response.json();
    expect(error).toHaveProperty('errors');
  });

  test('409 - 중복 리소스', async ({ request }) => {
    const userData = { email: 'existing@example.com', name: '홍길동' };

    await request.post('/users', { data: userData });
    const response = await request.post('/users', { data: userData });

    expect(response.status()).toBe(409);
  });
});
```

## baseURL 설정으로 코드 간결화

```typescript
// playwright.config.ts에 baseURL 설정
export default defineConfig({
  use: {
    baseURL: 'https://api.example.com/v1',
  },
});

// 테스트에서 상대 경로 사용
test('유저 조회', async ({ request }) => {
  const response = await request.get('/users/1');  // baseURL + /users/1
  expect(response.status()).toBe(200);
});
```

## UI + API 조합 패턴 (실무에서 가장 중요)

이 패턴은 서버 개발자가 작성하는 E2E 테스트의 핵심입니다.

### 패턴 1: API로 상태 준비 후 UI 확인

```typescript
test('주문 생성 후 주문 목록에 표시', async ({ page, request }) => {
  // 1. API로 주문 생성 (UI보다 빠르고 안정적)
  const response = await request.post('/api/orders', {
    data: { productId: 'P001', quantity: 2 },
  });
  const { orderId } = await response.json();

  // 2. UI에서 주문 목록 페이지 이동
  await page.goto('/orders');

  // 3. 생성된 주문이 목록에 표시되는지 확인
  await expect(page.getByTestId(`order-${orderId}`)).toBeVisible();
  await expect(page.getByTestId(`order-${orderId}`)).toContainText('처리 중');
});
```

### 패턴 2: UI 액션 후 API로 결과 확인

```typescript
test('UI에서 상품 추가 후 재고 API 확인', async ({ page, request }) => {
  const productId = 'P001';

  // 1. UI에서 상품 추가 폼 작성
  await page.goto('/admin/products/new');
  await page.getByLabel('상품명').fill('테스트 상품');
  await page.getByLabel('재고').fill('100');
  await page.getByRole('button', { name: '저장' }).click();

  // 2. API로 실제 저장 여부 확인
  const response = await request.get(`/api/products?name=테스트 상품`);
  const products = await response.json();
  expect(products[0].stock).toBe(100);
});
```

### 패턴 3: API로 테스트 데이터 정리

```typescript
test('사용자 프로필 수정', async ({ page, request }) => {
  // 테스트용 사용자 생성
  const createResponse = await request.post('/api/users', {
    data: { email: `test-${Date.now()}@example.com`, name: '테스트 유저' },
  });
  const { userId } = await createResponse.json();

  try {
    // UI 테스트 수행
    await page.goto(`/users/${userId}/edit`);
    await page.getByLabel('이름').fill('수정된 이름');
    await page.getByRole('button', { name: '저장' }).click();

    await expect(page.getByText('수정된 이름')).toBeVisible();
  } finally {
    // 테스트 후 데이터 정리
    await request.delete(`/api/users/${userId}`);
  }
});
```

## 독립적인 API 테스트 컨텍스트 생성

인증 등 특별한 설정이 필요한 경우 별도의 API 컨텍스트를 생성합니다.

```typescript
test('인증이 필요한 API 테스트', async ({ playwright }) => {
  // 커스텀 API 컨텍스트 생성
  const apiContext = await playwright.request.newContext({
    baseURL: 'https://api.example.com',
    extraHTTPHeaders: {
      'Authorization': 'Bearer my-token',
      'Content-Type': 'application/json',
    },
  });

  const response = await apiContext.get('/admin/users');
  expect(response.status()).toBe(200);

  // 사용 후 정리
  await apiContext.dispose();
});
```

## 실습 코드 실행

```bash
# API 테스트 실행
npm run test:api

# 특정 테스트만 실행
npx playwright test tests/06-api -g "GET /posts"
```

---

| | |
|---|---|
| 이전 문서 | [← 06. 페이지 오브젝트 모델](./06-page-object-model.md) |
| 다음 문서 | [08. 인증 처리 →](./08-authentication.md) |
