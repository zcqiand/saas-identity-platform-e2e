// M95.F01.I01：三端参数化运行（ADR-0030 Decision 2）。
// 同一套 spec × 三个 project（nextjs/react/vue）；用例分叉即 parity 失效。
// 前置（M95.F04.I01）：saas-msw :5100 与三前端 dev server 由外部起好，本仓不自起 ——
// 起服约定见 docs/conventions/e2e-runtime.md。env 缺失在此处 fail-fast。
import { defineConfig, devices } from "@playwright/test";
import { requireE2eEnv } from "./src/env";

const TARGETS = [
  { name: "nextjs", urlEnv: "E2E_NEXTJS_URL" },
  { name: "react", urlEnv: "E2E_REACT_URL" },
  { name: "vue", urlEnv: "E2E_VUE_URL" },
] as const;

export default defineConfig({
  testDir: "tests",
  timeout: 30_000,
  retries: 1, // 浏览器 E2E flaky 缓解（REQ-2026-001 风险表）
  reporter: [["list"]],
  // ADR-0030 Decision 2：projects 顺序即 parity 报告呈现顺序，勿随意调整。
  projects: TARGETS.map((t) => ({
    name: t.name,
    use: { ...devices["Desktop Chrome"], baseURL: requireE2eEnv(t.urlEnv) },
  })),
});
