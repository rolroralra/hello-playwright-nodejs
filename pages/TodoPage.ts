import { Page, Locator, expect } from "@playwright/test";

/**
 * TodoPage - Page Object Model 구현 예시
 *
 * 페이지 오브젝트 모델(POM) 패턴:
 * - UI 상호작용 로직을 클래스로 캡슐화
 * - 테스트 코드에서 세부 구현 숨기기
 * - 페이지 변경 시 한 곳만 수정
 */
export class TodoPage {
  readonly page: Page;
  readonly newTodoInput: Locator;
  readonly todoList: Locator;
  readonly todoCount: Locator;
  readonly clearCompletedButton: Locator;
  readonly filterAll: Locator;
  readonly filterActive: Locator;
  readonly filterCompleted: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newTodoInput = page.getByPlaceholder("What needs to be done?");
    this.todoList = page
      .getByRole("list")
      .filter({ has: page.locator(".todo-list") });
    this.todoCount = page.locator(".todo-count");
    this.clearCompletedButton = page.getByRole("button", {
      name: "Clear completed",
    });
    this.filterAll = page.getByRole("link", { name: "All" });
    this.filterActive = page.getByRole("link", { name: "Active" });
    this.filterCompleted = page.getByRole("link", { name: "Completed" });
  }

  /** 페이지로 이동 */
  async goto() {
    await this.page.goto("https://demo.playwright.dev/todomvc");
  }

  /** 할 일 추가 */
  async addTodo(text: string) {
    await this.newTodoInput.fill(text);
    await this.page.keyboard.press("Enter");
  }

  /** 여러 할 일 한 번에 추가 */
  async addTodos(texts: string[]) {
    for (const text of texts) {
      await this.addTodo(text);
    }
  }

  /** 특정 텍스트의 할 일 완료 처리 */
  async completeTodo(text: string) {
    // has + getByText(exact:true): 텍스트가 부분 일치로 다른 항목을 잡지 않도록 정확한 매칭
    const item = this.page.locator(".todo-list li").filter({
      has: this.page.getByText(text, { exact: true }),
    });
    await item.locator(".toggle").click();
  }

  /** 특정 텍스트의 할 일 삭제 */
  async deleteTodo(text: string) {
    const item = this.page.locator(".todo-list li").filter({
      has: this.page.getByText(text, { exact: true }),
    });
    await item.hover();
    await item.locator(".destroy").click();
  }

  /** 특정 텍스트의 할 일 수정 */
  async editTodo(oldText: string, newText: string) {
    const item = this.page.locator(".todo-list li").filter({
      has: this.page.getByText(oldText, { exact: true }),
    });
    await item.getByText(oldText, { exact: true }).dblclick();
    // .editing .edit: 편집 모드의 텍스트 입력 필드 (체크박스 input과 구분)
    const editInput = this.page.locator(".editing .edit");
    await editInput.fill(newText);
    await this.page.keyboard.press("Enter");
  }

  /** 할 일 개수 확인 */
  async expectTodoCount(count: number) {
    // .todo-list li: 할 일 목록의 li만 선택 (필터 네비게이션 li 제외)
    await expect(this.page.locator(".todo-list li")).toHaveCount(count);
  }

  /** 특정 할 일 텍스트 존재 확인 */
  async expectTodoVisible(text: string) {
    await expect(this.page.getByText(text, { exact: true })).toBeVisible();
  }

  /** 특정 할 일 텍스트 없음 확인 */
  async expectTodoNotVisible(text: string) {
    await expect(this.page.getByText(text, { exact: true })).not.toBeVisible();
  }

  /** 남은 항목 수 텍스트 확인 */
  async expectCounterText(expectedText: string) {
    await expect(this.todoCount).toContainText(expectedText);
  }

  /** Active 필터 적용 */
  async filterByActive() {
    await this.filterActive.click();
  }

  /** Completed 필터 적용 */
  async filterByCompleted() {
    await this.filterCompleted.click();
  }

  /** 완료된 항목 전체 삭제 */
  async clearCompleted() {
    await this.clearCompletedButton.click();
  }
}
