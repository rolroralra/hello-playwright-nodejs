# 06. 페이지 오브젝트 모델 (Page Object Model)

페이지 오브젝트 모델(POM)은 UI 테스트에서 가장 널리 사용되는 패턴입니다. 페이지의 상호작용 로직을 클래스로 캡슐화하여 테스트 코드를 깔끔하게 유지합니다.

> 실습 파일:
> - [`pages/TodoPage.ts`](../pages/TodoPage.ts) (페이지 오브젝트)
> - [`tests/05-page-objects/todo.spec.ts`](../tests/05-page-objects/todo.spec.ts) (테스트)

## POM이 필요한 이유

### POM 없이 작성한 테스트 (중복 코드 문제)

```typescript
test('할 일 완료 처리', async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc');
  await page.getByPlaceholder('What needs to be done?').fill('항목');
  await page.keyboard.press('Enter');
  await page.getByRole('checkbox').click();
  // ... 반복되는 코드
});

test('할 일 삭제', async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc');
  await page.getByPlaceholder('What needs to be done?').fill('항목');
  await page.keyboard.press('Enter');
  // UI가 바뀌면 모든 테스트를 수정해야 함
});
```

### POM을 사용한 테스트 (가독성 + 유지보수성)

```typescript
test('할 일 완료 처리', async ({ page }) => {
  const todoPage = new TodoPage(page);
  await todoPage.goto();
  await todoPage.addTodo('항목');
  await todoPage.completeTodo('항목');
  // UI가 바뀌면 TodoPage.ts만 수정
});
```

## POM 구현 예시

```typescript
// pages/TodoPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class TodoPage {
  readonly page: Page;
  readonly newTodoInput: Locator;

  constructor(page: Page) {
    this.page = page;
    // 로케이터를 생성자에서 초기화
    this.newTodoInput = page.getByPlaceholder('What needs to be done?');
  }

  // 페이지 이동
  async goto() {
    await this.page.goto('https://demo.playwright.dev/todomvc');
  }

  // 할 일 추가
  async addTodo(text: string) {
    await this.newTodoInput.fill(text);
    await this.page.keyboard.press('Enter');
  }

  // 검증 메서드도 포함 가능
  async expectTodoCount(count: number) {
    // ⚠️ getByRole('listitem')은 필터 네비게이션 <li>도 매칭되므로
    // CSS 선택자로 할 일 목록만 정확히 타겟팅
    await expect(this.page.locator('.todo-list li')).toHaveCount(count);
  }
}
```

> 전체 코드: [`pages/TodoPage.ts`](../pages/TodoPage.ts)

## POM 설계 원칙

### 1. 로케이터는 생성자에서 초기화

```typescript
constructor(page: Page) {
  this.page = page;
  // ✅ 생성자에서 초기화 (지연 평가, 변경 시 한 곳만 수정)
  this.submitButton = page.getByRole('button', { name: '제출' });
  this.emailInput = page.getByLabel('이메일');
}
```

### 2. 메서드는 사용자 행동을 표현

```typescript
// ✅ 좋은 메서드명 (사용자 관점)
async login(email: string, password: string) { ... }
async addItemToCart(productId: string) { ... }
async placeOrder() { ... }

// ❌ 나쁜 메서드명 (구현 관점)
async clickSubmitButton() { ... }
async fillEmailInput() { ... }
```

### 3. 검증은 선택적으로 포함

```typescript
// 간단한 검증은 페이지 오브젝트에 포함 가능
async expectLoginSuccess() {
  await expect(this.page).toHaveURL(/\/dashboard/);
  await expect(this.welcomeMessage).toBeVisible();
}

// 복잡한 검증은 테스트 코드에서 직접 수행
test('로그인 후 사용자 이름 표시', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('user@example.com', 'password');

  // 페이지 오브젝트에 없는 세부 검증
  await expect(page.getByText('환영합니다, 홍길동')).toBeVisible();
});
```

## 실제 서비스를 위한 POM 예시

서버 개발자가 자신의 서비스를 테스트할 때 만들 수 있는 페이지 오브젝트 예시입니다.

```typescript
// pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('이메일');
    this.passwordInput = page.getByLabel('비밀번호');
    this.loginButton = page.getByRole('button', { name: '로그인' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectLoginError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}

// pages/OrderPage.ts
export class OrderPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/orders');
  }

  async getOrderById(orderId: string) {
    return this.page.getByTestId(`order-${orderId}`);
  }

  async expectOrderStatus(orderId: string, status: string) {
    const order = await this.getOrderById(orderId);
    await expect(order.getByTestId('status')).toHaveText(status);
  }
}
```

## 테스트에서 POM 사용

```typescript
// tests/05-page-objects/todo.spec.ts
import { test, expect } from '@playwright/test';
import { TodoPage } from '../../pages/TodoPage';

test.describe('TodoMVC - Page Object Model 활용', () => {
  let todoPage: TodoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('전체 시나리오', async () => {
    await todoPage.addTodos(['API 개발', '테스트 작성', '코드 리뷰']);
    await todoPage.completeTodo('API 개발');
    await todoPage.expectCounterText('2');
    await todoPage.clearCompleted();
    await todoPage.expectTodoCount(2);
  });
});
```

> 전체 코드: [`tests/05-page-objects/todo.spec.ts`](../tests/05-page-objects/todo.spec.ts)

## 실습 코드 실행

```bash
# POM 실습 테스트 실행
npm run test:page-objects

# UI 모드로 실행
npx playwright test tests/05-page-objects --ui
```

---

| | |
|---|---|
| 이전 문서 | [← 05. 액션과 어서션](./05-actions-assertions.md) |
| 다음 문서 | [07. API 테스트 →](./07-api-testing.md) |
