import { test, expect } from '@playwright/test';

/**
 * 01. 기본 네비게이션
 *
 * 목표: page.goto(), URL 확인, 타이틀 확인 등 기본 탐색을 익힌다.
 * 실습 대상: https://playwright.dev
 */

test.describe('기본 네비게이션', () => {
  test('페이지 제목 확인', async ({ page }) => {
    // 1. 페이지 이동
    await page.goto('https://playwright.dev');

    // 2. 브라우저 탭 제목 확인
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('특정 URL로 이동', async ({ page }) => {
    await page.goto('https://playwright.dev/docs/intro');

    // 현재 URL에 특정 경로가 포함되어 있는지 확인
    await expect(page).toHaveURL(/\/docs\/intro/);
  });

  test('링크 클릭 후 페이지 이동 확인', async ({ page }) => {
    await page.goto('https://playwright.dev');

    // "Get started" 링크 클릭
    await page.getByRole('link', { name: 'Get started' }).click();

    // 이동한 페이지 URL 확인
    await expect(page).toHaveURL(/\/docs\/intro/);
  });

  test('앞으로/뒤로 이동', async ({ page }) => {
    await page.goto('https://playwright.dev');
    await page.goto('https://playwright.dev/docs/intro');

    // 뒤로 이동
    await page.goBack();
    await expect(page).toHaveURL('https://playwright.dev/');

    // 앞으로 이동
    await page.goForward();
    await expect(page).toHaveURL(/\/docs\/intro/);
  });

  test('페이지 새로고침', async ({ page }) => {
    await page.goto('https://playwright.dev');

    // 새로고침
    await page.reload();

    // 새로고침 후에도 동일 페이지
    await expect(page).toHaveTitle(/Playwright/);
  });
});
