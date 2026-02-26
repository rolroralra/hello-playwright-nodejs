import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

/**
 * 07. 인증 처리 (Authentication)
 *
 * 목표: 로그인이 필요한 서비스를 테스트하는 다양한 방법을 익힌다.
 *
 * 전략 1: storageState - 로그인 상태를 파일로 저장하여 재사용 (권장)
 * 전략 2: 각 테스트마다 로그인 수행 (느리지만 단순)
 * 전략 3: API로 로그인 토큰 발급 후 쿠키/헤더 설정
 *
 * 실습 대상: https://the-internet.herokuapp.com/login
 */

const STORAGE_STATE_PATH = path.join(process.cwd(), ".auth", "user.json");

/**
 * [중요] storageState 파일 생성 - playwright 픽스처로 직접 브라우저 실행
 *
 * 왜 browser 픽스처를 쓰면 안 되는가?
 * fullyParallel: true 환경에서 test.use({ storageState })가 같은 스코프의
 * beforeAll 내 browser.newContext()에도 적용되어, 아직 없는 파일을 읽으려다
 * ENOENT 에러가 발생한다.
 *
 * 해결: playwright.chromium.launch()로 픽스처 시스템 밖에서 브라우저를 직접
 * 실행하면 test.use() 설정의 영향을 받지 않는다.
 */
test.beforeAll(async ({ playwright }) => {
  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });

  // 픽스처 시스템 외부에서 직접 브라우저 실행 → test.use() 영향 없음
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://the-internet.herokuapp.com/login");
  await page.getByLabel("Username").fill("tomsmith");
  await page.getByLabel("Password").fill("SuperSecretPassword!");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.locator(".flash.success")).toBeVisible();

  // 인증 상태 파일로 저장
  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
});

/**
 * 전략 1: storageState를 활용한 세션 재사용
 *
 * 개념:
 * - 최초 로그인 시 브라우저의 쿠키/localStorage 상태를 파일로 저장
 * - 이후 테스트에서는 저장된 상태를 로드하여 로그인 과정 스킵
 * - CI/CD에서 매우 효과적 (로그인 비용 1회만 지불)
 */
test.describe("전략 1: storageState로 세션 재사용", () => {
  // 파일 레벨 beforeAll이 먼저 실행되어 파일이 존재하므로 안전하게 참조 가능
  test.use({ storageState: STORAGE_STATE_PATH });

  test("로그인 상태에서 보안 페이지 접근", async ({ page }) => {
    // storageState로 이미 로그인된 상태 - 로그인 코드 없어도 됨
    await page.goto("https://the-internet.herokuapp.com/secure");

    // .flash.success는 로그인 직후 리다이렉트 시에만 표시됨
    // storageState로 직접 접근 시에는 Secure Area 콘텐츠로 확인
    await expect(page.locator("h2")).toContainText("Secure Area");
    await expect(page.getByRole("link", { name: "Logout" })).toBeVisible();
  });

  test("로그인 상태 유지 - 여러 페이지 이동", async ({ page }) => {
    await page.goto("https://the-internet.herokuapp.com/secure");
    await expect(page.locator("h2")).toContainText("Secure Area");

    // 다른 페이지 이동 후 돌아와도 세션 유지
    await page.goto("https://the-internet.herokuapp.com");
    await page.goto("https://the-internet.herokuapp.com/secure");
    await expect(page.locator("h2")).toContainText("Secure Area");
  });
});

/**
 * 전략 2: 각 테스트마다 직접 로그인
 *
 * 단점: 테스트마다 로그인 요청 발생 → 느림
 * 장점: 각 테스트가 완전히 독립적
 */
test.describe("전략 2: 각 테스트마다 로그인", () => {
  test("로그인 후 보안 페이지 접근", async ({ page }) => {
    await page.goto("https://the-internet.herokuapp.com/login");
    await page.getByLabel("Username").fill("tomsmith");
    await page.getByLabel("Password").fill("SuperSecretPassword!");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.locator(".flash.success")).toBeVisible();
    await expect(page).toHaveURL(/\/secure/);
  });

  test("잘못된 자격증명으로 로그인 실패", async ({ page }) => {
    await page.goto("https://the-internet.herokuapp.com/login");
    await page.getByLabel("Username").fill("wronguser");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.locator(".flash.error")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("로그아웃", async ({ page }) => {
    await page.goto("https://the-internet.herokuapp.com/login");
    await page.getByLabel("Username").fill("tomsmith");
    await page.getByLabel("Password").fill("SuperSecretPassword!");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/secure/);

    await page.getByRole("link", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

/**
 * 전략 3: API를 통한 인증 토큰 설정
 *
 * Bearer 토큰 기반 API를 테스트할 때 유용
 * 실제 서비스에서는 이 패턴을 많이 사용
 */
test.describe("전략 3: API 토큰으로 인증 (개념 예시)", () => {
  test("API 요청에 Authorization 헤더 설정", async ({ request }) => {
    const token = "Bearer example-jwt-token";

    const response = await request.get(
      "https://jsonplaceholder.typicode.com/posts/1",
      {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      },
    );

    expect(response.status()).toBe(200);
  });
});
