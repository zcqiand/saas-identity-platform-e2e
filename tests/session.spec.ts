// M95.F02.I03 会话：登出 + 切换当前租户（REQ-2026-004）
// 覆盖 BASE 登出（本地清理）+ 切换当前租户（POST /me/tenants/:id/switch 链路）。
// 三端公共锚：登出按钮 data-fn、切换器 data-testid=tenant-switcher + data-fn。
// alice 在 fixture 中双租户成员（acme + globex，tenant_member.json …0006）。
import { test, expect } from "@playwright/test";
import { loginViaUi } from "./helpers";

const GLOBEX_ID = "00000000-0000-0000-0000-000000000002";

test.beforeEach(async ({ page }) => {
  await loginViaUi(page);
});

test("AC-1 登出：session 清理落回登录页 M95.F02.I03 覆盖 M01.F04.I06", async ({ page }) => {
  await page.locator('[data-fn="M01.F04.I06"]').click();
  await page.waitForURL(/\/login/, { timeout: 10_000 });
  await expect(page.locator("#username")).toBeVisible();
  // 登出后再访问工作区应被踢回登录（本地 session 已清）
  await page.goto("/tenants");
  await page.waitForURL(/\/login/, { timeout: 10_000 });
});

test("AC-2 切换租户：调 switch API + 切换器显示新租户 M95.F02.I03 覆盖 M01.F03.I02", async ({ page }) => {
  const switchReq = page.waitForRequest(
    (r) => r.url().includes("/me/tenants/") && r.url().includes("/switch") && r.method() === "POST",
  );
  await page.locator('[data-testid="tenant-switcher"]').click();
  const globexItem = page.getByRole("menuitem").filter({ hasText: "Globex Industries" });
  await expect(globexItem).toBeVisible({ timeout: 10_000 });
  await globexItem.click();
  await switchReq;
  // 切换器按钮显示新租户名；URL 进入该租户工作区（路由实现三端允许不同，锚 tenantId）
  await expect(page.locator('[data-testid="tenant-switcher"]')).toContainText("Globex Industries", {
    timeout: 10_000,
  });
  await page.waitForURL(new RegExp(GLOBEX_ID), { timeout: 10_000 });
});
