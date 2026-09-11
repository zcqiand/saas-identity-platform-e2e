// M95.F02.I07 — nav 冒烟遍历（2026-09-11 审计报告方案 A）。
// 背景：连串 bug（成员/应用/菜单页空白、faker 假数据、nav 死链 404）在单测/
// 契约测试全绿的情况下到达用户浏览器 —— 缺口是「没有任何一层验证页面真的出数据」。
// 本用例登录后遍历侧边栏全部导航项，对每个页面断言：
//   1. 无 404/501/5xx API 响应（死链、msw NOT_MOCKED、后端异常）
//   2. 无 console error / pageerror
//   3. 有列表的页面行数 > 0（空数据即红 —— 直击死桩/faker 两类假绿）
// 断言锚 data-testid 行与用户可观察行为，不锚 DOM 结构（ADR-0030 Decision 4）。
import { expect, type Page, test } from "@playwright/test";
import { loginViaUi } from "./helpers";

/** 侧边栏导航项 → 页面主列表行 testid（无列表的页面不填）。 */
const NAV_ITEMS: Array<{ fnId: string; rowTestId?: string; emptyText?: RegExp }> = [
  { fnId: "M00.F01.I01", rowTestId: "tenant-row" },
  { fnId: "M00.F05.I01", rowTestId: "tenant-app-row" },
  { fnId: "M00.F02.I01", rowTestId: "user-row" },
  { fnId: "M00.F03.I01", rowTestId: "role-row" },
  { fnId: "M04.F01.I01", rowTestId: "app-row" },
  // 菜单管理是树形页，无统一行 testid —— 只断言无错误响应
  { fnId: "M04.F04.I01" },
];

/** 挂上错误采集器，返回「取走当前累计错误」的函数。 */
function tapErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 200)}`);
  });
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) {
      errors.push(`api ${r.status()} ${new URL(r.url()).pathname}`);
    }
  });
  return () => errors.splice(0);
}

test("AC-1 nav 冒烟遍历：全部页面可达、有数据、无错误 M95.F02.I07", async ({ page }) => {
  await loginViaUi(page);
  const takeErrors = tapErrors(page);

  for (const item of NAV_ITEMS) {
    const link = page.locator(`[data-testid="sidebar-nav-item-${item.fnId}"]`);
    await expect(link).toBeVisible();
    const errorsBefore = takeErrors();
    await link.click();
    await page.waitForLoadState("networkidle");

    // 1+2. 该页面无 API 错误、无脚本错误（死链 404 / msw 501 / 后端 5xx 全在此暴露）
    const errors = takeErrors().filter((e) => !errorsBefore.includes(e));
    expect(errors, `页面 ${item.fnId} 出现错误：\n${errors.join("\n")}`).toEqual([]);

    // 3. 有列表的页面：行数 > 0（空数据 = 死桩/faker 类假绿的直接信号）
    if (item.rowTestId) {
      const rows = page.locator(`[data-testid="${item.rowTestId}"]`);
      await expect(
        rows.first(),
        `页面 ${item.fnId} 主列表应为空但至少 1 行（testid=${item.rowTestId}）`,
      ).toBeVisible();
      expect(await rows.count()).toBeGreaterThan(0);
    }
  }
});

test("AC-2 直接访问侧边栏全部路由无 404 M95.F02.I07", async ({ page }) => {
  await loginViaUi(page);
  const bad: string[] = [];
  page.on("response", (r) => {
    // 文档级 404（Next/SPA fallback 拦不住的路由）与 API 404/501 都算
    if (r.status() === 404 || r.status() === 501) {
      bad.push(`${r.status()} ${r.url()}`);
    }
  });
  for (const item of NAV_ITEMS) {
    await page.locator(`[data-testid="sidebar-nav-item-${item.fnId}"]`).click();
    await page.waitForLoadState("networkidle");
  }
  expect(bad, `发现死链/未 mock 端点：\n${bad.join("\n")}`).toEqual([]);
});

test("AC-3 编辑菜单弹窗：类型/父菜单/状态必须回填行数据 M95.F02.I07", async ({ page }) => {
  // 编辑弹窗字段回显缺口（类型/父菜单/状态为空）曾多次直达用户 —— 专项断言。
  await loginViaUi(page);
  await page.locator('[data-testid="sidebar-nav-item-M04.F04.I01"]').click();
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "编辑" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // 每个 select 都必须有值（空值 = 显示「请选择」占位符 = 回填失败）
  await expect(
    dialog.getByText("请选择"),
    "编辑弹窗存在未回填的下拉字段（类型/父菜单/状态）",
  ).toHaveCount(0);

  // 类型 = 契约词之一（目录/页面/按钮）；状态 = 启用/停用 之一
  const dialogText = await dialog.innerText();
  expect(/目录|页面|按钮/.test(dialogText), "类型下拉应回填契约词（目录/页面/按钮）").toBe(true);
  expect(/启用|停用/.test(dialogText), "状态下拉应回填 启用/停用").toBe(true);
});
