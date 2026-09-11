// M95.F02.I04 角色 CRUD（REQ-2026-005 ③a；覆盖 BASE 角色管理列表/创建/更新/删除）
// 契约字段 roleCode/roleName（SysRole）；创建提交归并 clientId=saas-console（契约必填）。
import { test, expect } from "@playwright/test";
import { loginViaUi, uniqueCode } from "./helpers";

const ACME_ID = "00000000-0000-0000-0000-000000000001";

test.beforeEach(async ({ page }) => {
  await loginViaUi(page);
  await page.goto(`/tenants/${ACME_ID}/roles`);
});

test("AC-1 角色列表渲染 seed 行 M95.F02.I04 覆盖角色列表", async ({ page }) => {
  await expect(page.locator('[data-fn="M00.F03.I02"]')).toBeVisible();
  await expect(page.locator('[data-testid="role-row"]', { hasText: "admin" }).first()).toBeVisible({ timeout: 10_000 });
});

async function createRole(page: import("@playwright/test").Page, code: string, name: string) {
  await page.locator('[data-fn="M00.F03.I02"]').click();
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  await dialog.locator("#crud-field-roleCode").fill(code);
  await dialog.locator("#crud-field-roleName").fill(name);
  await dialog.locator('[data-fn="crud.submit"]').click();
  await expect(dialog).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-testid="role-row"]', { hasText: code }).first()).toBeVisible({ timeout: 10_000 });
}

test("AC-2 创建角色：行出现 M95.F02.I04 覆盖创建", async ({ page }) => {
  const code = uniqueCode("e2e-role");
  await createRole(page, code, "E2E 角色");
  await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({ timeout: 10_000 });
});

test("AC-3 更新角色：名称落行 M95.F02.I04 覆盖更新", async ({ page }) => {
  const code = uniqueCode("e2e-role");
  await createRole(page, code, "E2E 旧名");
  const row = page.locator('[data-testid="role-row"]', { hasText: code }).first();
  await row.locator('[data-fn="M00.F03.I04"]').click();
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  await dialog.locator("#crud-field-roleName").fill("E2E 新名");
  await dialog.locator('[data-fn="crud.submit"]').click();
  await expect(dialog).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-testid="role-row"]', { hasText: "E2E 新名" }).first()).toBeVisible({ timeout: 10_000 });
});

test("AC-4 删除角色：确认后行消失 M95.F02.I04 覆盖删除", async ({ page }) => {
  const code = uniqueCode("e2e-role");
  await createRole(page, code, "E2E 待删");
  const row = page.locator('[data-testid="role-row"]', { hasText: code }).first();
  await row.locator('[data-fn="M00.F03.I05"]').click();
  const confirm = page.getByRole("alertdialog").getByRole("button", { name: "删除" });
  await expect(confirm).toBeVisible();
  await confirm.click();
  await expect(page.locator('[data-testid="role-row"]', { hasText: code })).toHaveCount(0, { timeout: 10_000 });
});
