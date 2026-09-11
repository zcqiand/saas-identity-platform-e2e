// M95.F02.I08 — 三端 UI 结构指纹（2026-09-11 审计报告延伸）。
// 用户裁定：列表列、表单字段、按钮、搜索条件在三端必须一致。
// 同一份 spec × 三 project：任一端表头/主按钮漂移即红 —— 端间 parity 的结构层。
// 基准 = 家族约定（saas-identity-platform-shared 功能树 + 各页 PageHeader）。
// 待裁决分歧不进断言（见各页注释）：
//  - apps 表头列集（nextjs/react App 风格 vs vue OAuthClient 风格）→ ADR-0029 系待裁决
//  - roles 行内「菜单授权」按钮（vue 直达 vs nextjs/react 角色下钻路由）→ 待裁决
import { expect, test } from "@playwright/test";
import { loginViaUi } from "./helpers";

interface PageManifest {
  fnId: string;
  /** 表头列文本（全等断言；DISPUTED 页用 subset 标记走包含断言） */
  headers: string[];
  headersSubset?: boolean;
  /** 必须存在的主按钮（包含断言） */
  buttons: string[];
}

const PAGES: PageManifest[] = [
  {
    fnId: "M00.F01.I01",
    headers: ["Code", "名称", "状态", "操作"],
    buttons: ["新建租户", "编辑", "删除"],
  },
  {
    fnId: "M00.F05.I01",
    headers: ["应用名称", "Client ID", "状态", "到期时间", "操作"],
    buttons: ["订阅应用", "编辑", "取消订阅"],
  },
  {
    fnId: "M00.F02.I01",
    headers: ["用户名", "邮箱", "状态", "角色", "操作"],
    buttons: ["邀请用户", "分配角色", "编辑", "删除"],
  },
  {
    fnId: "M00.F03.I01",
    headers: ["Code", "名称", "操作"],
    buttons: ["新建角色", "编辑", "删除"],
  },
  {
    // DISPUTED：列集分歧（Scopes/一方/排序 vs Grant Types/Access Token Validity）→
    // 先断言共同子集，全等断言待 ADR 裁决后启用
    fnId: "M04.F01.I01",
    headers: ["Code / ClientID", "名称", "状态", "操作"],
    headersSubset: true,
    buttons: ["新建应用"],
  },
  {
    fnId: "M04.F04.I01",
    headers: ["名称", "类型", "状态", "操作"],
    buttons: ["新建菜单", "移动", "编辑", "删除"],
  },
];

for (const page of PAGES) {
  test(`[${page.fnId}] 表头列与主按钮三端一致 M95.F02.I08`, async ({ page: p }) => {
    await loginViaUi(p);
    await p.locator(`[data-testid="sidebar-nav-item-${page.fnId}"]`).click();
    await p.waitForLoadState("networkidle");

    // 表头列
    const headers = (await p.locator("thead th").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    if (page.headersSubset) {
      for (const h of page.headers) {
        expect(headers, `[${page.fnId}] 表头应包含「${h}」（实际：${headers.join(" | ")}）`).toContain(h);
      }
    } else {
      expect(
        headers,
        `[${page.fnId}] 表头列漂移（期望：${page.headers.join(" | ")}；实际：${headers.join(" | ")}）`,
      ).toEqual(page.headers);
    }

    // 主按钮（页面级 + 行级去重集合）
    const buttons = [...new Set((await p.locator("main button").allInnerTexts()).map((t) => t.trim()).filter(Boolean))];
    for (const b of page.buttons) {
      expect(
        buttons,
        `[${page.fnId}] 缺少按钮「${b}」（实际集合：${buttons.join(" | ")}）`,
      ).toContain(b);
    }
  });
}

test(`[M00.F02.I01] 搜索/筛选控件占位符三端一致 M95.F02.I08`, async ({ page }) => {
  // 当前家族页面无搜索框 —— 断言保持为空集；任何一端新增搜索条件时
  // 此用例红，强制把占位符登记进期望清单（防单端悄悄加搜索条件）。
  await loginViaUi(page);
  await page.locator('[data-testid="sidebar-nav-item-M00.F01.I01"]').click();
  await page.waitForLoadState("networkidle");
  const inputs = await page.locator("main input[placeholder]").count();
  expect(inputs, "租户列表页出现未登记的搜索控件（三端需同步登记）").toBe(0);
});
