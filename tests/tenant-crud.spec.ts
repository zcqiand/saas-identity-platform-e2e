// M95.F02.I02 租户管理 CRUD（REQ-2026-003；覆盖 BASE M00.F01 列表/创建/更新/删除）
// 三端公共锚（已查实同构）：#crud-field-tenantKey/#crud-field-name、[data-fn=crud.submit]、
// TableRow 行容器、确认按钮「删除」、toast [data-sonner-toast]。
// 写操作自产自销：每个用例先建自己的行，删/改互不依赖执行顺序。
import { test, expect } from "@playwright/test";
import { loginViaUi, uniqueCode } from "./helpers";

test.beforeEach(async ({ page }) => {
  await loginViaUi(page);
  await page.goto("/tenants");
});

test("AC-1 租户列表渲染 seed 三行 M95.F02.I02 覆盖 M00.F01.I01", async ({ page }) => {
  await expect(page.locator('[data-fn="M00.F01.I02"]')).toBeVisible();
  for (const code of ["acme", "globex", "initech"]) {
    await expect(page.locator("tr", { hasText: code }).first()).toBeVisible({ timeout: 10_000 });
  }
});

async function createTenant(page: import("@playwright/test").Page, code: string, name: string) {
  await page.locator('[data-fn="M00.F01.I02"]').click();
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  await dialog.locator("#crud-field-tenantKey").fill(code);
  await dialog.locator("#crud-field-name").fill(name);
  await dialog.locator('[data-fn="crud.submit"]').click();
  await expect(dialog).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator("tr", { hasText: code }).first()).toBeVisible({ timeout: 10_000 });
}

test("AC-2 创建租户：行出现且 toast 提示 M95.F02.I02 覆盖 M00.F01.I02", async ({ page }) => {
  const code = uniqueCode("e2e-tn");
  await createTenant(page, code, "E2E 测试租户");
  await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({ timeout: 10_000 });
});

test("AC-3 更新租户：名称变更落行 M95.F02.I02 覆盖 M00.F01.I04", async ({ page }) => {
  const code = uniqueCode("e2e-tn");
  await createTenant(page, code, "E2E 旧名");
  const row = page.locator("tr", { hasText: code }).first();
  await row.locator('[data-fn="M00.F01.I04"]').click();
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  await dialog.locator("#crud-field-name").fill("E2E 新名");
  await dialog.locator('[data-fn="crud.submit"]').click();
  await expect(dialog).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator("tr", { hasText: "E2E 新名" }).first()).toBeVisible({ timeout: 10_000 });
});

test("AC-4 删除租户：确认后行消失 M95.F02.I02 覆盖 M00.F01.I05", async ({ page }) => {
  const code = uniqueCode("e2e-tn");
  await createTenant(page, code, "E2E 待删");
  const row = page.locator("tr", { hasText: code }).first();
  await row.locator('[data-fn="M00.F01.I05"]').click();
  const confirm = page.getByRole("alertdialog").getByRole("button", { name: "删除" });
  await expect(confirm).toBeVisible();
  await confirm.click();
  await expect(page.locator("tr", { hasText: code })).toHaveCount(0, { timeout: 10_000 });
});
