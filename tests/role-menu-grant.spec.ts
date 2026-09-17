// M95.F02.I05 角色菜单授权（REQ-2026-005 ③b；覆盖 BASE 菜单授权的保存/清空/查询入口）
// 契约字段 SysMenu{title/path}；按 client 分组的勾选矩阵。
// acme admin 的 seed grant = 4 项（role-menu-grants fixture）。
import { test, expect } from "@playwright/test";
import { loginViaUi } from "./helpers";

const ACME_ID = "00000000-0000-0000-0000-000000000001";
// acmeAdmin 角色 id（roles fixture 首条）
const ACME_ADMIN_ROLE = "00000000-0000-0000-0000-a00000000001";

test.beforeEach(async ({ page }) => {
  await loginViaUi(page);
  await page.goto(`/tenants/${ACME_ID}/roles/${ACME_ADMIN_ROLE}/menus`);
});

test("AC-1 渲染按 client 分组的菜单矩阵 M95.F02.I05 覆盖菜单列表", async ({ page }) => {
  const rows = page.locator('[data-testid="menu-grant-row"]');
  await expect(rows.first()).toBeVisible({ timeout: 10_000 });
  // acme admin seed grant = lab 全量 27 项（sys_role_menu fixture）→ 初始计数 27
  await expect(page.locator('[data-fn="M00.F04.I03"]')).toContainText("保存 (27)");
});

test("AC-2 勾选+保存：调 set API 且计数更新 M95.F02.I05 覆盖整批设置", async ({ page }) => {
  const setReq = page.waitForRequest(
    (r) => r.url().includes("/roles/") && r.url().includes("/menus") && r.method() === "PUT",
  );
  await page.locator('[data-testid="menu-grant-row"]').first().waitFor({ timeout: 10_000 });
  // 勾掉第一项（27 → 26）
  const firstCheckbox = page.locator('[data-testid="menu-grant-row"] input[type="checkbox"]').first();
  await firstCheckbox.click();
  await expect(page.locator('[data-fn="M00.F04.I03"]')).toContainText("保存 (26)");
  await page.locator('[data-fn="M00.F04.I03"]').click();
  await setReq;
  await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({ timeout: 10_000 });
  // 还原（后端 DB 持久化且跨用例共享——写操作必须自产自销，勿污染后续读断言）
  await firstCheckbox.click();
  const restoreReq = page.waitForRequest(
    (r) => r.url().includes("/roles/") && r.url().includes("/menus") && r.method() === "PUT",
  );
  await page.locator('[data-fn="M00.F04.I03"]').click();
  await restoreReq;
});

test("AC-3 清空：计数归零后保存空集 M95.F02.I05 覆盖清空", async ({ page }) => {
  await page.locator('[data-testid="menu-grant-row"]').first().waitFor({ timeout: 10_000 });
  await page.locator('[data-fn="M00.F04.I04"]').click();
  await expect(page.locator('[data-fn="M00.F04.I03"]')).toContainText("保存 (0)");
});
