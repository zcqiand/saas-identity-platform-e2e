// M95.F02.I06 OAuth SSO 跳板 302 全链（REQ-2026-006 ④；覆盖 BASE 授权码签发+令牌交换的浏览器侧）
// 这是 ADR-0015 明确留给 E2E 的洞：authorize 领 code → 浏览器真实跳转 redirect_uri?code&state。
// lab-management 的 redirectUri 白名单含 http://localhost:5201/callback。
// clientId 用 ADR-0032 D4 的 code 形（oauth_client.client_id 字符串）——旧的
// `1111…111` 是 app 行 id 不是 clientId，authorize 必 INVALID_CLIENT。
import { test, expect } from "@playwright/test";
import { requireE2eEnv } from "../src/env";

const LAB_CLIENT_ID = "lab-management";
const CALLBACK = "http://localhost:5201/callback";
const USERNAME = requireE2eEnv("E2E_TEST_USERNAME");
const PASSWORD = requireE2eEnv("E2E_TEST_PASSWORD");

async function jumpLogin(page: import("@playwright/test").Page, query: string) {
  await page.goto(`/login?${query}`);
  await page.locator("#username").fill(USERNAME);
  await page.locator("#password").fill(PASSWORD);
  await page.locator('[data-fn="M01.F04.I03"]').click();
}

test("AC-1 跳板登录全链：authorize 领 code 回跳 RP（code+state 原样透传）M95.F02.I06", async ({ page }) => {
  // 虚拟 RP callback：本地 5201 无真实服务，route fulfill 让导航可完成（否则 load 永不触发）
  await page.route(`${CALLBACK}**`, (route) =>
    route.fulfill({ contentType: "text/html", body: "<html>RP callback</html>" }),
  );
  const authorizeReq = page.waitForRequest(
    (r) => r.url().includes("/oauth/authorize") && r.method() === "POST",
  );
  await jumpLogin(page, `client_id=${LAB_CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK)}&state=e2e-st-1`);
  await authorizeReq;
  // 浏览器真实跳转到 RP callback（无需 RP 在监听——断言最终 URL 参数）
  // expect.poll 轮询 URL：已登录 useEffect 与 onSubmit 双跳板分支会发起两次导航，
  // waitForURL 会被竞争瞬断（ERR_ABORTED）；轮询对最终状态断言即可
  await expect
    .poll(async () => {
      try {
        const u = new URL(page.url());
        return u.origin + u.pathname === CALLBACK;
      } catch {
        return false;
      }
    }, { timeout: 20_000 })
    .toBeTruthy();
  const code = new URL(page.url()).searchParams.get("code");
  const state = new URL(page.url()).searchParams.get("state");
  expect(code, "code 非空（真 authorize 签发，非死桩假 code）").toBeTruthy();
  expect(state).toBe("e2e-st-1");
});

test("AC-2 非法 redirect_uri：authorize 拒绝，停留登录页 M95.F02.I06", async ({ page }) => {
  await jumpLogin(page, `client_id=${LAB_CLIENT_ID}&redirect_uri=${encodeURIComponent("http://evil.example.com/cb")}&state=e2e-st-2`);
  // authorize 400 INVALID_REDIRECT_URI → 停留 /login（不跳 evil 域）
  await page.waitForTimeout(2500);
  const final = new URL(page.url());
  expect(final.pathname).toContain("/login");
  expect(final.hostname, "不得跳到非白名单域").toBe("localhost");
});
