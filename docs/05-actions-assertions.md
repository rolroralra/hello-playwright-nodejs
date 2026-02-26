# 05. 액션과 어서션

## 액션 (Actions)

액션은 사용자가 브라우저에서 수행하는 상호작용을 코드로 표현합니다.

> 실습 파일: [`tests/03-actions/form-actions.spec.ts`](../tests/03-actions/form-actions.spec.ts)

### 클릭

```typescript
// 기본 클릭
await page.getByRole('button', { name: '로그인' }).click();

// 더블클릭
await page.getByText('항목 이름').dblclick();

// 우클릭 (컨텍스트 메뉴)
await page.getByRole('button').click({ button: 'right' });

// 특정 좌표 클릭
await page.getByRole('button').click({ position: { x: 10, y: 5 } });

// Ctrl+Click (멀티 선택 등)
await page.getByRole('listitem').click({ modifiers: ['Control'] });
```

### 텍스트 입력

```typescript
// fill: 기존 내용 지우고 새 내용 입력 (권장)
await page.getByLabel('이메일').fill('user@example.com');

// type: 실제 키보드 타이핑처럼 (느리지만 특수 케이스에 유용)
await page.getByLabel('이메일').pressSequentially('user@example.com');

// 입력 필드 내용 지우기
await page.getByLabel('이메일').clear();
```

### 키보드

```typescript
// 특수 키 누르기
await page.keyboard.press('Enter');
await page.keyboard.press('Tab');
await page.keyboard.press('Escape');
await page.keyboard.press('ArrowDown');

// 조합 키
await page.keyboard.press('Control+A');  // 전체 선택
await page.keyboard.press('Control+C');  // 복사
await page.keyboard.press('Meta+A');     // macOS 전체 선택

// 여러 키 동시에
await page.keyboard.press('Shift+Tab');
```

### 폼 요소

```typescript
// 체크박스 체크/해제
await page.getByRole('checkbox', { name: '약관 동의' }).check();
await page.getByRole('checkbox').uncheck();

// 라디오 버튼 선택
await page.getByRole('radio', { name: '남성' }).check();

// 드롭다운 선택 (select 요소)
await page.getByRole('combobox').selectOption('option-value');
await page.getByRole('combobox').selectOption({ label: '옵션 레이블' });
await page.getByRole('combobox').selectOption({ index: 2 });

// 파일 업로드
await page.getByLabel('파일 선택').setInputFiles('./test-file.pdf');

// 날짜 입력
await page.getByLabel('날짜').fill('2024-01-15');
```

### 마우스 동작

```typescript
// Hover (마우스 올리기)
await page.getByRole('button').hover();

// 드래그 앤 드롭
await page.getByText('드래그 요소').dragTo(page.getByText('드롭 영역'));

// 스크롤
await page.getByRole('list').evaluate(el => el.scrollTop = 500);

// 화면 스크롤
await page.evaluate(() => window.scrollTo(0, 500));
// 또는
await page.mouse.wheel(0, 500);
```

### 대화상자 처리

```typescript
// alert, confirm, prompt 처리
page.on('dialog', async dialog => {
  console.log(dialog.message()); // 메시지 확인
  await dialog.accept();          // 확인 클릭
  // await dialog.dismiss();      // 취소 클릭
  // await dialog.accept('입력값'); // prompt에 입력
});

await page.getByRole('button', { name: '삭제' }).click();
```

---

## 어서션 (Assertions)

어서션은 테스트에서 기대하는 결과를 검증합니다.

> 실습 파일: [`tests/04-assertions/assertions.spec.ts`](../tests/04-assertions/assertions.spec.ts)

### 자동 재시도 어서션 vs 즉시 평가 어서션

```
자동 재시도 어서션 (Web-first Assertions)
└─ expect(locator).toBeVisible()
└─ expect(locator).toHaveText()
└─ 조건 충족될 때까지 재시도 (기본 5초)
└─ 비동기 UI 변화에 적합

즉시 평가 어서션 (Synchronous Assertions)
└─ expect(value).toBe()
└─ expect(array).toHaveLength()
└─ 즉시 평가, 재시도 없음
└─ 동기적 값 검증에 적합
```

### 가시성 어서션

```typescript
// 요소가 보이는지
await expect(locator).toBeVisible();
await expect(locator).toBeHidden();

// DOM에 존재하는지
await expect(locator).toBeAttached();
```

### 텍스트 어서션

```typescript
// 정확한 텍스트 일치
await expect(locator).toHaveText('정확한 텍스트');
await expect(locator).toHaveText(/정규식 패턴/);

// 텍스트 포함
await expect(locator).toContainText('포함될 텍스트');

// 여러 항목의 텍스트 동시 확인
await expect(page.getByRole('listitem')).toHaveText(['항목1', '항목2', '항목3']);
```

### 값 어서션

```typescript
// 입력 필드 값
await expect(page.getByLabel('이메일')).toHaveValue('user@example.com');

// 체크박스/라디오 상태
await expect(page.getByRole('checkbox')).toBeChecked();
await expect(page.getByRole('checkbox')).not.toBeChecked();
```

### 속성 어서션

```typescript
// 속성 값 확인
await expect(locator).toHaveAttribute('href', '/login');
await expect(locator).toHaveAttribute('disabled');

// CSS 클래스 확인
await expect(locator).toHaveClass('active');
await expect(locator).toHaveClass(/btn-primary/);

// CSS 속성 확인
await expect(locator).toHaveCSS('color', 'rgb(255, 0, 0)');
```

### 상태 어서션

```typescript
// 활성화/비활성화
await expect(locator).toBeEnabled();
await expect(locator).toBeDisabled();

// 편집 가능 여부
await expect(locator).toBeEditable();
```

### 개수 어서션

```typescript
// 요소 개수
await expect(page.getByRole('listitem')).toHaveCount(5);
```

### 페이지 어서션

```typescript
// URL 확인
await expect(page).toHaveURL('https://example.com/login');
await expect(page).toHaveURL(/\/login$/);

// 제목 확인
await expect(page).toHaveTitle('My App - 로그인');
await expect(page).toHaveTitle(/My App/);
```

### 부정 어서션

```typescript
// .not으로 반대 조건
await expect(locator).not.toBeVisible();
await expect(locator).not.toHaveText('오류');
await expect(locator).not.toBeChecked();
```

### 소프트 어서션 (Soft Assertions)

실패해도 테스트를 즉시 중단하지 않고 계속 진행합니다.

```typescript
test('소프트 어서션 예시', async ({ page }) => {
  await page.goto('/profile');

  // soft assertion: 실패해도 다음 줄 계속 실행
  await expect.soft(page.getByText('사용자 이름')).toBeVisible();
  await expect.soft(page.getByText('이메일')).toBeVisible();
  await expect.soft(page.getByText('가입일')).toBeVisible();

  // 마지막에 일반 assertion으로 종합 확인
  // (위에서 soft assertion이 하나라도 실패했으면 여기서 실패)
  await expect(page.getByRole('heading')).toContainText('내 프로필');
});
```

## 타임아웃 조정

```typescript
// 특정 어서션의 타임아웃 조정 (기본 5000ms)
await expect(locator).toBeVisible({ timeout: 10_000 });

// 느린 API 응답 대기
await expect(page.getByText('데이터 로딩 완료')).toBeVisible({ timeout: 30_000 });
```

## 실습 코드 실행

```bash
# 액션 실습 실행
npm run test:actions

# 어서션 실습 실행
npm run test:assertions
```

---

| | |
|---|---|
| 이전 문서 | [← 04. 로케이터](./04-locators.md) |
| 다음 문서 | [06. 페이지 오브젝트 모델 →](./06-page-object-model.md) |
