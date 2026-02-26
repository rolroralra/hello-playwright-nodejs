import { test, expect } from '@playwright/test';

/**
 * 03. 액션 (Actions)
 *
 * 목표: 클릭, 입력, 키보드, 마우스 등 다양한 액션을 익힌다.
 * 실습 대상: https://demo.playwright.dev/todomvc
 *
 * TodoMVC DOM 구조 참고:
 * - .toggle-all: "전체 완료" 체크박스 (개별 항목 체크박스와 별개)
 * - .todo-list li: 개별 할 일 항목 (필터 네비게이션 li와 구분)
 * - .toggle: 개별 항목의 체크박스
 * - .editing .edit: 편집 모드의 텍스트 입력 필드
 */

test.describe('TodoMVC 액션 실습', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
  });

  test('fill - 입력 필드에 텍스트 입력', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');

    // fill: 기존 내용을 지우고 새 텍스트 입력
    await input.fill('Playwright 공부하기');
    await page.keyboard.press('Enter');

    await expect(page.getByText('Playwright 공부하기')).toBeVisible();
  });

  test('click - 체크박스 클릭으로 완료 처리', async ({ page }) => {
    // 할 일 추가
    await page.getByPlaceholder('What needs to be done?').fill('완료할 항목');
    await page.keyboard.press('Enter');

    // .toggle: 개별 항목 체크박스 (.toggle-all은 전체 완료 버튼으로 별개)
    const checkbox = page.locator('.todo-list li .toggle');
    await checkbox.click();

    // 완료된 항목 확인 (CSS 클래스 변경)
    const completedItem = page.locator('.completed');
    await expect(completedItem).toBeVisible();
  });

  test('dblclick - 더블클릭으로 편집 모드 진입', async ({ page }) => {
    // 할 일 추가
    await page.getByPlaceholder('What needs to be done?').fill('수정할 항목');
    await page.keyboard.press('Enter');

    // 더블클릭으로 편집 모드 진입
    const todoLabel = page.getByText('수정할 항목');
    await todoLabel.dblclick();

    // 편집 입력 필드 확인 (.editing .edit: 체크박스 input과 구분)
    const editInput = page.locator('.editing .edit');
    await expect(editInput).toBeVisible();

    // 내용 수정
    await editInput.fill('수정된 항목');
    await page.keyboard.press('Enter');

    await expect(page.getByText('수정된 항목')).toBeVisible();
  });

  test('keyboard - 키보드 단축키 사용', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');

    // Tab 키 이동
    await input.fill('키보드 테스트');

    // Enter로 추가
    await page.keyboard.press('Enter');

    // Escape로 편집 취소
    await page.getByText('키보드 테스트').dblclick();
    // .editing .edit: 편집 입력 필드만 정확하게 선택
    await page.locator('.editing .edit').fill('변경 시도');
    await page.keyboard.press('Escape');

    // Escape 후 원래 텍스트 유지 확인
    await expect(page.getByText('키보드 테스트')).toBeVisible();
  });

  test('삭제 버튼 hover 후 클릭', async ({ page }) => {
    // 할 일 추가
    await page.getByPlaceholder('What needs to be done?').fill('삭제할 항목');
    await page.keyboard.press('Enter');

    // .todo-list li: 할 일 항목 (필터 네비게이션 li 제외)
    const todoItem = page.locator('.todo-list li');
    await todoItem.hover();

    // 삭제 버튼 클릭
    await todoItem.locator('.destroy').click();

    // 항목이 삭제되었는지 확인
    await expect(page.getByText('삭제할 항목')).not.toBeVisible();
  });

  test('여러 할 일 추가 후 "Clear completed" 클릭', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');

    // 여러 할 일 추가
    await input.fill('완료 항목 1');
    await page.keyboard.press('Enter');
    await input.fill('완료 항목 2');
    await page.keyboard.press('Enter');
    await input.fill('미완료 항목');
    await page.keyboard.press('Enter');

    // 개별 항목 체크박스만 선택 (.toggle-all 전체 완료 체크박스 제외)
    const checkboxes = page.locator('.todo-list li .toggle');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // "Clear completed" 버튼 클릭
    await page.getByRole('button', { name: 'Clear completed' }).click();

    // 완료된 항목들은 사라지고 미완료 항목만 남음
    await expect(page.getByText('미완료 항목')).toBeVisible();
    await expect(page.getByText('완료 항목 1')).not.toBeVisible();
  });
});
