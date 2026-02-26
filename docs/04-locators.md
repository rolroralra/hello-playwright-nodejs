# 04. 로케이터 (Locators)

로케이터는 Playwright에서 페이지의 특정 요소를 찾는 방법입니다. 올바른 로케이터 선택은 안정적인 테스트의 핵심입니다.

> 실습 파일: [`tests/02-locators/locators.spec.ts`](../tests/02-locators/locators.spec.ts)

## 로케이터 우선순위 (권장 순서)

```
우선순위 높음
    │
    ▼
1. getByRole()        - 접근성 역할 기반 (가장 권장)
2. getByLabel()       - 레이블 기반 (폼 입력 필드)
3. getByPlaceholder() - placeholder 텍스트 기반
4. getByText()        - 텍스트 기반
5. getByAltText()     - 이미지 alt 텍스트 기반
6. getByTestId()      - data-testid 속성 기반
7. locator()          - CSS/XPath (최후 수단)
    │
    ▼
우선순위 낮음
```

## 1. getByRole() - 접근성 역할 기반 (권장)

HTML 요소의 접근성 역할(ARIA role)로 요소를 찾습니다. 실제 사용자가 요소를 인식하는 방식과 가장 유사합니다.

```typescript
// 버튼
page.getByRole('button', { name: '로그인' })

// 링크
page.getByRole('link', { name: 'Home' })

// 제목
page.getByRole('heading', { name: '상품 목록' })

// 텍스트 입력
page.getByRole('textbox', { name: '이메일' })

// 체크박스
page.getByRole('checkbox')

// 라디오 버튼
page.getByRole('radio', { name: '남성' })

// 드롭다운 선택
page.getByRole('combobox', { name: '카테고리' })

// 목록 항목
page.getByRole('listitem')
```

### 주요 ARIA 역할

| HTML 요소 | 기본 역할 |
|-----------|----------|
| `<button>` | `button` |
| `<a href>` | `link` |
| `<h1>~<h6>` | `heading` |
| `<input type="text">` | `textbox` |
| `<input type="checkbox">` | `checkbox` |
| `<input type="radio">` | `radio` |
| `<select>` | `combobox` |
| `<li>` | `listitem` |
| `<table>` | `table` |
| `<img>` | `img` |

## 2. getByLabel() - 레이블 기반

`<label>` 태그와 연결된 폼 입력 필드를 찾습니다.

```typescript
// <label for="email">이메일</label>
// <input id="email" type="email" />
page.getByLabel('이메일')

// aria-label 속성도 지원
// <input aria-label="검색어 입력" />
page.getByLabel('검색어 입력')
```

## 3. getByPlaceholder() - placeholder 기반

`placeholder` 속성으로 입력 필드를 찾습니다.

```typescript
// <input placeholder="이메일을 입력하세요" />
page.getByPlaceholder('이메일을 입력하세요')
```

## 4. getByText() - 텍스트 기반

요소의 텍스트 내용으로 찾습니다. 정확히 일치하거나 정규식 사용 가능.

```typescript
// 정확히 일치
page.getByText('로그인')

// 부분 일치 (정규식)
page.getByText(/로그인/)

// 부분 문자열 포함 (exact: false)
page.getByText('로그', { exact: false })
```

## 5. getByTestId() - 테스트 ID 기반

`data-testid` 속성으로 찾습니다. UI 변경에 강하지만 테스트 전용 속성 추가가 필요합니다.

```typescript
// <button data-testid="submit-btn">제출</button>
page.getByTestId('submit-btn')
```

> 참고: `playwright.config.ts`에서 테스트 ID 속성명을 변경할 수 있습니다.
> ```typescript
> use: { testIdAttribute: 'data-cy' }
> ```

## 6. locator() - CSS/XPath (최후 수단)

다른 방법으로 찾을 수 없을 때만 사용합니다.

```typescript
// CSS 선택자
page.locator('.submit-button')
page.locator('#login-form input[type="email"]')

// XPath
page.locator('//button[contains(@class, "submit")]')

// 중첩 선택
page.locator('table').locator('tr').nth(2).locator('td').first()
```

## 로케이터 수정자

### nth() - n번째 요소

```typescript
// 목록의 첫 번째 항목 (0-indexed)
page.getByRole('listitem').first()
page.getByRole('listitem').nth(0)

// 마지막 항목
page.getByRole('listitem').last()

// 세 번째 항목
page.getByRole('listitem').nth(2)
```

### filter() - 조건으로 필터링

```typescript
// 특정 텍스트를 포함한 항목만
page.getByRole('listitem').filter({ hasText: '완료' })

// 특정 자식 요소를 포함한 항목만
page.getByRole('listitem').filter({ has: page.locator('.completed') })

// 반대 조건 (hasNot)
page.getByRole('listitem').filter({ hasNotText: '삭제됨' })
```

### and() / or() - 조건 결합

```typescript
// 두 조건 모두 만족
page.getByRole('button').and(page.getByText('제출'))

// 하나라도 만족
page.getByRole('button', { name: '확인' }).or(page.getByRole('button', { name: 'OK' }))
```

## 안정적인 로케이터 작성 팁

### ❌ 피해야 할 패턴

```typescript
// 1. 동적으로 변하는 ID나 클래스
page.locator('#app > div:nth-child(3) > button')

// 2. 내부 구현에 의존하는 선택자
page.locator('.MuiButton-root')

// 3. 위치에 의존하는 선택자
page.locator('div:first-child button')
```

### ✅ 권장 패턴

```typescript
// 1. 의미 있는 역할과 이름으로 찾기
page.getByRole('button', { name: '주문하기' })

// 2. 사용자가 보는 텍스트나 레이블 활용
page.getByLabel('배송 주소')

// 3. 팀과 합의한 테스트 ID 속성 사용
page.getByTestId('order-submit-btn')
```

## 실습 코드 실행

```bash
# 로케이터 실습 테스트 실행
npm run test:locators

# UI 모드로 실행 (각 로케이터가 어떤 요소를 찾는지 확인 가능)
npx playwright test tests/02-locators --ui
```

---

| | |
|---|---|
| 이전 문서 | [← 03. 첫 번째 테스트](./03-first-test.md) |
| 다음 문서 | [05. 액션과 어서션 →](./05-actions-assertions.md) |
