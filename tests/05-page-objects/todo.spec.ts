import { test, expect } from '@playwright/test';
import { TodoPage } from '../../pages/TodoPage';

/**
 * 05. 페이지 오브젝트 모델 (Page Object Model)
 *
 * 목표: POM 패턴으로 테스트 코드를 구조화하는 방법을 익힌다.
 *
 * POM 패턴의 장점:
 * - 테스트 코드 가독성 향상
 * - 페이지 변경 시 유지보수 용이 (한 곳만 수정)
 * - 코드 재사용성 극대화
 */

test.describe('TodoMVC - Page Object Model 활용', () => {
  let todoPage: TodoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('할 일 추가', async () => {
    await todoPage.addTodo('E2E 테스트 공부');

    await todoPage.expectTodoVisible('E2E 테스트 공부');
    await todoPage.expectTodoCount(1);
  });

  test('여러 할 일 추가', async () => {
    await todoPage.addTodos([
      'Playwright 설치',
      '로케이터 학습',
      '어서션 학습',
      'POM 패턴 적용',
    ]);

    await todoPage.expectTodoCount(4);
  });

  test('할 일 완료 처리', async () => {
    await todoPage.addTodos(['완료할 항목', '미완료 항목']);

    await todoPage.completeTodo('완료할 항목');

    await todoPage.expectCounterText('1');
  });

  test('할 일 삭제', async () => {
    await todoPage.addTodo('삭제할 항목');
    await todoPage.deleteTodo('삭제할 항목');

    await todoPage.expectTodoNotVisible('삭제할 항목');
  });

  test('할 일 수정', async () => {
    await todoPage.addTodo('수정 전 항목');
    await todoPage.editTodo('수정 전 항목', '수정 후 항목');

    await todoPage.expectTodoNotVisible('수정 전 항목');
    await todoPage.expectTodoVisible('수정 후 항목');
  });

  test('Active 필터 - 미완료 항목만 표시', async () => {
    await todoPage.addTodos(['완료 항목', '미완료 항목 1', '미완료 항목 2']);
    await todoPage.completeTodo('완료 항목');

    await todoPage.filterByActive();

    await todoPage.expectTodoNotVisible('완료 항목');
    await todoPage.expectTodoVisible('미완료 항목 1');
    await todoPage.expectTodoVisible('미완료 항목 2');
  });

  test('Completed 필터 - 완료 항목만 표시', async () => {
    await todoPage.addTodos(['완료 항목 1', '완료 항목 2', '미완료 항목']);
    await todoPage.completeTodo('완료 항목 1');
    await todoPage.completeTodo('완료 항목 2');

    await todoPage.filterByCompleted();

    await todoPage.expectTodoVisible('완료 항목 1');
    await todoPage.expectTodoVisible('완료 항목 2');
    await todoPage.expectTodoNotVisible('미완료 항목');
  });

  test('완료 항목 전체 삭제', async () => {
    await todoPage.addTodos(['완료 항목 1', '완료 항목 2', '남길 항목']);
    await todoPage.completeTodo('완료 항목 1');
    await todoPage.completeTodo('완료 항목 2');

    await todoPage.clearCompleted();

    await todoPage.expectTodoCount(1);
    await todoPage.expectTodoVisible('남길 항목');
  });

  test('전체 시나리오 - 할 일 관리 흐름', async () => {
    // 1. 할 일 추가
    await todoPage.addTodos([
      'API 개발',
      '단위 테스트 작성',
      'E2E 테스트 작성',
      '코드 리뷰',
    ]);
    await todoPage.expectTodoCount(4);

    // 2. 일부 완료 처리
    await todoPage.completeTodo('API 개발');
    await todoPage.completeTodo('단위 테스트 작성');

    // 3. 남은 항목 수 확인
    await todoPage.expectCounterText('2');

    // 4. 완료 항목 삭제
    await todoPage.clearCompleted();
    await todoPage.expectTodoCount(2);

    // 5. 항목 수정
    await todoPage.editTodo('코드 리뷰', '코드 리뷰 완료');
    await todoPage.expectTodoVisible('코드 리뷰 완료');
  });
});
