// M95.F02.I01 密码登录主流程（REQ-2026-001 AC-1/2/3，2026-09-11 B 方案修订）
// 选择器只锚 data-fn 与可观察行为（ADR-0030 Decision 4）。
// 三端公共锚：#username/#password、data-fn=M01.F04.I03 提交按钮、
// 登录落点 /tenants、错误提示 sonner toast（三端同库家族）。
// B 方案：clientId = ?client_id= ?? env LOGIN_CLIENT_ID（saas-console 自身应用 …1114）；
// E2E 走 env 兜底路径（直接打开 /login，不带 query）。
import { test, expect } from "@playwright/test";
import { requireE2eEnv } from "../src/env";

const LOGIN_ANCHOR = '[data-fn="M01.F04.I03"]';
const USERNAME = requireE2eEnv("E2E_TEST_USERNAME");
const PASSWORD = requireE2eEnv("E2E_TEST_PASSWORD");
const CLIENT_ID = requireE2eEnv("E2E_TEST_CLIENT_ID");

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
});

test("AC-1 登录表单渲染且提交按钮挂密码登录 data-fn 锚点 M95.F02.I01 覆盖 M01.F04.I03", async ({ page }) => {
  await expect(page.locator("#username")).toBeVisible();
  await expect(page.locator("#password")).toBeVisible();
  const submit = page.locator(LOGIN_ANCHOR);
  await expect(submit).toBeVisible();
  await expect(submit).toBeEnabled();
});

test("AC-2 有效凭据登录落 /tenants 且请求体携带 saas-console clientId M95.F02.I01 覆盖 M01.F04.I03", async ({ page }) => {
  const loginReq = page.waitForRequest(
    (r) => r.url().includes("/auth/login") && r.method() === "POST",
  );
  await page.locator("#username").fill(USERNAME);
  await page.locator("#password").fill(PASSWORD);
  await page.locator(LOGIN_ANCHOR).click();
  // B 方案：请求体 clientId = env 兜底（saas-console 自身应用）
  const req = await loginReq;
  expect((req.postDataJSON() as { clientId?: string }).clientId).toBe(CLIENT_ID);
  // 登录后三端统一 push /tenants（可能继续跳 /tenants/:id，锚前缀）
  await page.waitForURL(/\/tenants/, { timeout: 20_000 });
  await expect(page.locator("main, nav, aside, [data-fn]").first()).toBeVisible();
});

test("AC-3 错误凭据停留 /login 并出错误提示 M95.F02.I01 覆盖 M01.F04.I03", async ({ page }) => {
  await page.locator("#username").fill(USERNAME);
  await page.locator("#password").fill("e2e-wrong-password");
  await page.locator(LOGIN_ANCHOR).click();
  await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/\/login/);
});
