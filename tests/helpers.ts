// E2E 公共流程助手。选择器只锚 data-fn 与可观察行为（ADR-0030 Decision 4）。
import { expect, type Page } from "@playwright/test";
import { requireE2eEnv } from "../src/env";

/** UI 密码登录（B 方案：env 兜底 clientId = saas-console），落在 /tenants。 */
export async function loginViaUi(page: Page): Promise<void> {
  await page.goto("/login");
  await page.locator("#username").fill(requireE2eEnv("E2E_TEST_USERNAME"));
  await page.locator("#password").fill(requireE2eEnv("E2E_TEST_PASSWORD"));
  await page.locator('[data-fn="M01.F04.I03"]').click();
  await page.waitForURL(/\/tenants/, { timeout: 20_000 });
  await expect(page.locator("main, nav, aside, [data-fn]").first()).toBeVisible();
}

/** 本测试内唯一的业务 code（msw 无持久化，撞 seed/前次唯一约束只会来自并发自身）。 */
export function uniqueCode(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
