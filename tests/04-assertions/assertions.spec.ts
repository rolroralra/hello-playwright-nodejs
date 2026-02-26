import { test, expect } from "@playwright/test";

/**
 * 04. 어서션 (Assertions)
 *
 * 목표: Playwright의 다양한 어서션 메서드를 익힌다.
 * 실습 대상: https://demo.playwright.dev/todomvc
 *
 * 어서션 종류:
 * - 자동 재시도 어서션: expect(locator).toBeVisible() 등 - 조건이 충족될 때까지 재시도
 * - 즉시 평가 어서션: expect(value).toBe() 등 - 즉시 평가
 */

test.describe("어서션 실습", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://demo.playwright.dev/todomvc");
  });

  // --- 가시성(Visibility) 어서션 ---

  test("toBeVisible / toBeHidden", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");

    // 요소가 보이는지
    await expect(input).toBeVisible();

    // "Clear completed" 버튼은 완료 항목이 없으면 hidden
    // (toBeHidden은 DOM에서 숨겨진 경우)
    await expect(
      page.getByRole("button", { name: "Clear completed" }),
    ).toBeHidden();
  });

  // --- 텍스트(Text) 어서션 ---

  test("toHaveText / toContainText", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "todos" });

    // 정확히 일치
    await expect(heading).toHaveText("todos");

    // 부분 포함
    await expect(heading).toContainText("todo");
  });

  test("할 일 개수 텍스트 확인 - toContainText", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");

    await input.fill("항목 1");
    await page.keyboard.press("Enter");
    await input.fill("항목 2");
    await page.keyboard.press("Enter");

    // "2 items left" 또는 "2 items left!" 형태의 텍스트 확인
    const counter = page.locator(".todo-count");
    await expect(counter).toContainText("2");
  });

  // --- 값(Value) 어서션 ---

  test("toHaveValue - 입력 필드 값 확인", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("테스트 값");

    // 입력 필드의 현재 값 확인
    await expect(input).toHaveValue("테스트 값");
  });

  // --- 속성(Attribute) 어서션 ---

  test("toHaveAttribute - 요소 속성 확인", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");

    // autofocus 속성 확인
    await expect(input).toHaveAttribute("class", "new-todo");
  });

  // --- 상태(State) 어서션 ---

  test("toBeEnabled / toBeDisabled", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");

    // 입력 필드 활성화 여부
    await expect(input).toBeEnabled();
  });

  test("toBeChecked / not.toBeChecked - 체크박스 상태", async ({ page }) => {
    await page.getByPlaceholder("What needs to be done?").fill("체크 테스트");
    await page.keyboard.press("Enter");

    // .toggle: 개별 항목 체크박스 (.toggle-all 전체 완료 체크박스와 구분)
    const checkbox = page.locator(".todo-list li .toggle");

    // 처음엔 미체크
    await expect(checkbox).not.toBeChecked();

    // 클릭 후 체크
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  // --- 개수(Count) 어서션 ---

  test("toHaveCount - 요소 개수 확인", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");

    await input.fill("할 일 1");
    await page.keyboard.press("Enter");
    await input.fill("할 일 2");
    await page.keyboard.press("Enter");
    await input.fill("할 일 3");
    await page.keyboard.press("Enter");

    // .todo-list li: 할 일 항목만 선택 (필터 네비게이션 li 제외)
    await expect(page.locator(".todo-list li")).toHaveCount(3);
  });

  // --- URL / Title 어서션 ---

  test("toHaveURL / toHaveTitle", async ({ page }) => {
    await expect(page).toHaveURL(/todomvc/);
    // 앱에 제목이 없을 수 있으므로 URL만 확인
  });

  // --- 소프트 어서션: 실패해도 테스트를 계속 실행 ---

  test("soft assertions - 실패해도 계속 진행", async ({ page }) => {
    const input = page.getByPlaceholder("What needs to be done?");
    await input.fill("소프트 어서션 테스트");
    await page.keyboard.press("Enter");

    // soft assertion: 실패해도 다음 줄 계속 실행
    await expect.soft(page.getByText("소프트 어서션 테스트")).toBeVisible();
    await expect.soft(page.locator(".todo-count")).toContainText("1");

    // 일반 assertion: 실패 시 즉시 중단
    await expect(page.locator(".todo-list li")).toHaveCount(1);
  });
});
