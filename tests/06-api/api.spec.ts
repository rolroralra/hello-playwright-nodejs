import { test, expect } from '@playwright/test';

/**
 * 06. API 테스트
 *
 * 목표: Playwright의 APIRequestContext를 사용해 REST API를 테스트하는 방법을 익힌다.
 *      서버 개발자가 자신의 API를 E2E 관점에서 테스트하는 방법을 실습한다.
 *
 * 실습 대상: https://jsonplaceholder.typicode.com (무료 REST API Mock)
 *
 * Playwright API 테스트의 장점:
 * - UI 테스트와 API 테스트를 같은 도구로 처리
 * - UI 상태 설정을 API로 빠르게 처리 (테스트 데이터 준비)
 * - 실제 HTTP 요청/응답 검증
 */

test.describe('REST API 테스트', () => {
  const BASE_URL = 'https://jsonplaceholder.typicode.com';

  // --- GET 요청 ---

  test('GET /posts - 목록 조회', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts`);

    // 응답 상태 코드 확인
    expect(response.status()).toBe(200);

    // 응답 바디 파싱
    const posts = await response.json();

    // 데이터 구조 검증
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts.length).toBeGreaterThan(0);

    // 첫 번째 항목의 필드 확인
    const firstPost = posts[0];
    expect(firstPost).toHaveProperty('id');
    expect(firstPost).toHaveProperty('title');
    expect(firstPost).toHaveProperty('body');
    expect(firstPost).toHaveProperty('userId');
  });

  test('GET /posts/:id - 단건 조회', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`);

    expect(response.status()).toBe(200);

    const post = await response.json();
    expect(post.id).toBe(1);
    expect(typeof post.title).toBe('string');
    expect(typeof post.body).toBe('string');
  });

  test('GET /posts/:id - 존재하지 않는 리소스 (404)', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/99999`);

    expect(response.status()).toBe(404);
  });

  // --- POST 요청 ---

  test('POST /posts - 새 리소스 생성', async ({ request }) => {
    const newPost = {
      title: 'Playwright API 테스트',
      body: 'Playwright로 REST API를 테스트합니다.',
      userId: 1,
    };

    const response = await request.post(`${BASE_URL}/posts`, {
      data: newPost,
    });

    // 생성 성공 응답 코드
    expect(response.status()).toBe(201);

    const createdPost = await response.json();
    expect(createdPost.title).toBe(newPost.title);
    expect(createdPost.body).toBe(newPost.body);
    expect(createdPost.userId).toBe(newPost.userId);
    // 서버에서 ID 할당
    expect(createdPost).toHaveProperty('id');
  });

  // --- PUT 요청 ---

  test('PUT /posts/:id - 전체 수정', async ({ request }) => {
    const updatedPost = {
      id: 1,
      title: '수정된 제목',
      body: '수정된 내용',
      userId: 1,
    };

    const response = await request.put(`${BASE_URL}/posts/1`, {
      data: updatedPost,
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.title).toBe(updatedPost.title);
  });

  // --- PATCH 요청 ---

  test('PATCH /posts/:id - 부분 수정', async ({ request }) => {
    const response = await request.patch(`${BASE_URL}/posts/1`, {
      data: { title: '부분 수정된 제목' },
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.title).toBe('부분 수정된 제목');
    // body 필드는 원본 유지
    expect(result).toHaveProperty('body');
  });

  // --- DELETE 요청 ---

  test('DELETE /posts/:id - 삭제', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/posts/1`);

    // 삭제 성공 응답 코드
    expect(response.status()).toBe(200);
  });

  // --- 헤더 및 쿼리 파라미터 ---

  test('쿼리 파라미터로 필터링 - GET /posts?userId=1', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts`, {
      params: { userId: 1 },
    });

    expect(response.status()).toBe(200);

    const posts = await response.json();
    // userId가 1인 게시물만 반환
    posts.forEach((post: { userId: number }) => {
      expect(post.userId).toBe(1);
    });
  });

  test('커스텀 헤더 포함 요청', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`, {
      headers: {
        'Accept': 'application/json',
        'X-Custom-Header': 'playwright-test',
      },
    });

    expect(response.status()).toBe(200);
    // 응답 헤더 확인
    expect(response.headers()['content-type']).toContain('application/json');
  });

  // --- UI + API 조합 테스트 (실무 패턴) ---

  test('API로 데이터 준비 후 UI에서 확인하는 패턴', async ({ page, request }) => {
    // 1. API로 데이터 조회
    const response = await request.get(`${BASE_URL}/users/1`);
    const user = await response.json();

    expect(user.name).toBeTruthy();

    // 2. UI에서 해당 데이터 확인 (실제로는 자신의 서비스 URL 사용)
    // 예시: API에서 받은 사용자 이름이 UI에도 표시되는지 확인
    await page.goto('https://playwright.dev');

    // 실제 서비스에서는:
    // await page.goto(`/users/${user.id}`);
    // await expect(page.getByText(user.name)).toBeVisible();

    console.log(`API에서 조회한 사용자: ${user.name}`);
    expect(user.name).toBe('Leanne Graham');
  });
});
