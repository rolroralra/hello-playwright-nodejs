import { test, expect } from "@playwright/test";

/**
 * 02. 로케이터 (Locators)
 *
 * 목표: Playwright의 다양한 로케이터 전략을 익힌다.
 * 실습 대상: https://demo.playwright.dev/todomvc
 *
 * 로케이터 우선순위 (권장 순서):
 * 1. getByRole()     - 접근성 역할 기반 (가장 권장)
 * 2. getByText()     - 텍스트 기반
 * 3. getByLabel()    - 레이블 기반 (폼 입력)
 * 4. getByPlaceholder() - placeholder 텍스트 기반
 * 5. getByTestId()   - data-testid 속성 기반
 * 6. locator()       - CSS/XPath (최후 수단)
 */

test.describe("로케이터 전략", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://demo.playwright.dev/todomvc");
  });

  test("getByRole - 역할 기반 로케이터", async ({ page }) => {
    // heading 역할의 "todos" 텍스트 엘리먼트
    const heading = page.getByRole("heading", { name: "todos" });
    await expect(heading).toBeVisible();
  });

  test("getByPlaceholder - placeholder 기반 로케이터", async ({ page }) => {
    // placeholder 텍스트로 입력 필드 찾기
    const input = page.getByPlaceholder("What needs to be done?");
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test("getByText - 텍스트 기반 로케이터", async ({ page }) => {
    // 할 일 추가 후 텍스트로 요소 찾기
    await page.getByPlaceholder("What needs to be done?").fill("테스트 할 일");
    await page.keyboard.press("Enter");

    // 방금 추가한 텍스트로 요소 찾기
    const todoItem = page.getByText("테스트 할 일");
    await expect(todoItem).toBeVisible();
  });

  test("locator - CSS 선택자 기반 (최후 수단)", async ({ page }) => {
    // CSS 선택자: 역할 기반 로케이터가 없을 때 사용
    const newTodoInput = page.locator(".new-todo");
    await expect(newTodoInput).toBeVisible();
  });

  test("필터 링크 - 여러 요소 중 특정 요소 선택", async ({ page }) => {
    // 할 일 추가
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("첫 번째 할 일");
    await page.keyboard.press("Enter");

    // 모든 할 일 필터 링크 중 "All" 링크
    const allFilter = page.getByRole("link", { name: "All" });
    await expect(allFilter).toBeVisible();
  });

  test("nth - 여러 요소 중 n번째 선택", async ({ page }) => {
    // 할 일 여러 개 추가
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("첫 번째");
    await page.keyboard.press("Enter");
    await input.fill("두 번째");
    await page.keyboard.press("Enter");
    await input.fill("세 번째");
    await page.keyboard.press("Enter");

    // .todo-list li: 할 일 목록 li만 선택 후 두 번째 항목 (0-indexed)
    const secondItem = page.locator(".todo-list li").nth(1);
    await expect(secondItem).toContainText("두 번째");
  });

  test("filter - 조건으로 요소 필터링", async ({ page }) => {
    // 할 일 추가
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("완료할 항목");
    await page.keyboard.press("Enter");
    await input.fill("미완료 항목");
    await page.keyboard.press("Enter");

    // 특정 텍스트를 포함한 listitem 필터링
    const targetItem = page
      .getByRole("listitem")
      .filter({ hasText: "완료할 항목" });
    await expect(targetItem).toBeVisible();
  });
});
