// M95.F02.I05 角色菜单授权（REQ-2026-005 ③b；覆盖 BASE 菜单授权的保存/清空/查询入口）
// 契约字段 SysMenu{title/path}；按 client 分组的勾选矩阵。
// acme admin 的 seed grant = 27 项（seed-db.mjs fixture 43 + 补齐 27）。
//
// 5.124② 状态纪律重写：三 project 串行共享一份 saas_dev（playwright workers:1），
// 写路径用例（AC-2 翻转保存 / AC-3 清空保存）对 DB 的改变跨用例/跨 project 存续。
// 修前 AC-3 清空留 0 不复原 + AC-2 重试勾选态反转 → 后续 project AC-1 撞假红
// （2026-11-01 两轮 full-run 实证）。现在 beforeAll 经 API 登录取授权基线，
// beforeEach PUT 归位——每个用例（含 retry）都从确定的基线出发，UI 只做纯断言。
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect, type APIRequestContext } from "@playwright/test";
import { loginViaUi } from "./helpers";
import { requireE2eEnv } from "../src/env";

const ACME_ID = "00000000-0000-0000-0000-000000000001";
// acmeAdmin 角色 id（roles fixture 首条）
const ACME_ADMIN_ROLE = "00000000-0000-0000-0000-a00000000001";
const MENUS_URL = `/api/v1/tenants/${ACME_ID}/roles/${ACME_ADMIN_ROLE}/menus`;

/** 基线授权集（globalSetup 种库后取定、test-results 临时文件交接；seed=27 项）。
 *  不能在 beforeAll GET：那时前序 project 的写路径用例可能已把 DB 清过（脏基线）。 */
const baselineMenuIds: string[] = JSON.parse(
  readFileSync(resolve(__dirname, "../test-results/grant-baseline.json"), "utf-8"),
).menuIds;
if (!Array.isArray(baselineMenuIds) || baselineMenuIds.length === 0) {
  throw new Error("[role-menu-grant] 基线为空——globalSetup captureGrantBaseline 未生效");
}

/** API 登录上下文（直打被测 saas-nextjs :5101，与 project baseURL 无关）。 */
async function apiLogin(request: APIRequestContext): Promise<string> {
  const res = await request.post("/api/v1/auth/login", {
    data: {
      username: requireE2eEnv("E2E_TEST_USERNAME"),
      password: requireE2eEnv("E2E_TEST_PASSWORD"),
      clientId: requireE2eEnv("E2E_TEST_CLIENT_ID"),
    },
  });
  if (!res.ok()) throw new Error(`[role-menu-grant] API 登录失败 ${res.status()}`);
  const body = (await res.json()) as { accessToken?: string };
  if (!body.accessToken) throw new Error("[role-menu-grant] 登录响应无 accessToken");
  return body.accessToken;
}

test.beforeEach(async ({ page, playwright }) => {
  // 归位：把授权集 PUT 回基线（DB 跨用例持久化；retry 也从基线出发）
  const ctx = await playwright.request.newContext({
    baseURL: requireE2eEnv("E2E_NEXTJS_URL"),
  });
  const token = await apiLogin(ctx);
  const res = await ctx.put(MENUS_URL, {
    headers: { authorization: `Bearer ${token}` },
    data: { menuIds: baselineMenuIds },
  });
  if (!res.ok()) throw new Error(`[role-menu-grant] 归位 PUT 失败 ${res.status()}`);
  await ctx.dispose();

  await loginViaUi(page);
  await page.goto(`/tenants/${ACME_ID}/roles/${ACME_ADMIN_ROLE}/menus`);
});

test("AC-1 渲染按 client 分组的菜单矩阵 M95.F02.I05 覆盖菜单列表", async ({ page }) => {
  const rows = page.locator('[data-testid="menu-grant-row"]');
  await expect(rows.first()).toBeVisible({ timeout: 10_000 });
  // 归位后计数 = 基线长度（seed=27）
  await expect(page.locator('[data-fn="M00.F04.I03"]')).toContainText(
    `保存 (${baselineMenuIds.length})`,
  );
});

test("AC-2 勾选+保存：调 set API 且计数更新 M95.F02.I05 覆盖整批设置", async ({ page }) => {
  const setReq = page.waitForRequest(
    (r) => r.url().includes("/roles/") && r.url().includes("/menus") && r.method() === "PUT",
  );
  await page.locator('[data-testid="menu-grant-row"]').first().waitFor({ timeout: 10_000 });
  const counter = page.locator('[data-fn="M00.F04.I03"]');
  // 基线出发 → 勾掉第一项（N → N-1）；恢复交给 beforeEach 归位（自产自销上移到夹具）
  const firstCheckbox = page.locator('[data-testid="menu-grant-row"] input[type="checkbox"]').first();
  await firstCheckbox.click();
  await expect(counter).toContainText(`保存 (${baselineMenuIds.length - 1})`);
  await counter.click();
  await setReq;
  await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({ timeout: 10_000 });
});

test("AC-3 清空：计数归零后保存空集 M95.F02.I05 覆盖清空", async ({ page }) => {
  const counter = page.locator('[data-fn="M00.F04.I03"]');
  await page.locator('[data-testid="menu-grant-row"]').first().waitFor({ timeout: 10_000 });
  await page.locator('[data-fn="M00.F04.I04"]').click();
  await expect(counter).toContainText("保存 (0)");
  await counter.click();
  await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({ timeout: 10_000 });
  // 恢复交给 beforeEach 归位（修前留 0 不复原，后续 project AC-1 全撞假红）
});
