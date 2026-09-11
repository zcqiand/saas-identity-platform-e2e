// 一次性探针：nextjs 租户建+删全流程（用后即删）
import { chromium } from "@playwright/test";
import { requireE2eEnv } from "./src/env.ts";

const browser = await chromium.launch();
const page = await browser.newPage({ baseURL: requireE2eEnv("E2E_REACT_URL") });
page.on("console", (m) => m.type() === "error" && console.log("[console.err]", m.text().slice(0, 200)));
page.on("response", (r) => {
  if (r.url().includes("5100")) console.log("[resp]", r.status(), r.request().method(), r.url().slice(0, 100));
});
await page.goto("/login");
await page.locator("#username").fill("alice");
await page.locator("#password").fill(requireE2eEnv("E2E_TEST_PASSWORD"));
await page.locator('[data-fn="M01.F04.I03"]').click();
await page.waitForURL(/\/tenants/, { timeout: 20_000 });
await page.goto("/tenants");
await page.waitForTimeout(2000);
console.log("[rows after load]", await page.locator("tr[data-testid='tenant-row']").count());

const code = "probe-del-1";
await page.locator('[data-fn="M00.F01.I02"]').click();
const dlg = page.locator('[role="dialog"]');
await dlg.waitFor();
await dlg.locator("#crud-field-tenantKey").fill(code);
await dlg.locator("#crud-field-name").fill("Probe del");
await dlg.locator('[data-fn="crud.submit"]').click();
await page.waitForTimeout(2500);
console.log("[rows after create]", await page.locator("tr[data-testid='tenant-row']").count());
console.log("[toast]", await page.locator("[data-sonner-toast]").allTextContents());

try {
  const row = page.locator("tr", { hasText: code }).first();
  console.log("[row visible]", await row.isVisible());
  await row.locator('[data-fn="M00.F01.I05"]').click();
  console.log("[del btn clicked]");
  const confirm = page.getByRole("alertdialog").getByRole("button", { name: "删除" });
  await confirm.waitFor({ timeout: 5000 });
  console.log("[confirm visible]");
  await confirm.click();
  await page.waitForTimeout(2500);
} catch (e) {
  console.log("[delete step ERROR]", String(e).slice(0, 300));
  console.log("[dialogs]", await page.locator("[role=alertdialog], [role=dialog]").count());
}
console.log("[rows after delete]", await page.locator("tr[data-testid='tenant-row']").count());
console.log("[toast2]", await page.locator("[data-sonner-toast]").allTextContents());
await browser.close();
