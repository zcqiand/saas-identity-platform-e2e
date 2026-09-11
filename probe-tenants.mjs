// 一次性探针：react /tenants 列表查询诊断（用后即删）
import { chromium } from "@playwright/test";
import { requireE2eEnv } from "./src/env.ts";

const browser = await chromium.launch();
const page = await browser.newPage({ baseURL: requireE2eEnv("E2E_REACT_URL") });
page.on("console", (m) => console.log("[console]", m.type(), m.text().slice(0, 160)));
page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 200)));
page.on("requestfailed", (r) => console.log("[reqfail]", r.method(), r.url().slice(0, 120), r.failure()?.errorText));
page.on("response", (r) => {
  if (r.url().includes("5100")) console.log("[resp]", r.status(), r.request().method(), r.url().slice(0, 110));
});
await page.goto("/login");
await page.locator("#username").fill("alice");
await page.locator("#password").fill(requireE2eEnv("E2E_TEST_PASSWORD"));
await page.locator('[data-fn="M01.F04.I03"]').click();
await page.waitForURL(/\/tenants/, { timeout: 20_000 });
await page.goto("/tenants");
await page.waitForTimeout(5000);
const body = await page.locator("main").innerText();
console.log("[main text]", body.replace(/\n/g, " | ").slice(0, 400));
await browser.close();
