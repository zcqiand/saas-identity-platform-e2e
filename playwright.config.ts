// M95.F01.I01：三端参数化运行（ADR-0030 Decision 2）。
// 同一套 spec × 三个 project（nextjs/react/vue）；用例分叉即 parity 失效。
// 前置（M95.F04.I01）：saas-nextjs :5101（真 API 后端）与三前端 dev server 由外部起好，本仓不自起 ——
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
  // 5.124②（2026-11-01）：三 project 共享一份后端 DB（本机=saas_dev），写路径用例
  // 即使自产自销也存在瞬态窗口——并行 worker 下 A 项目的读断言会撞 B 项目的写中途态
  // （实证：vue role-menu AC-2 保存 26 瞬态 + AC-3 清空留 0，nextjs AC-1 撞假红）。
  // 串行化是一致性验收的正确姿态；时长代价可接受（单轮 ~2-5min）。
  workers: 1,
  globalSetup: "./src/global-setup.ts",
  globalTeardown: "./src/global-teardown.ts",
  timeout: 30_000,
  retries: 1, // 浏览器 E2E flaky 缓解（REQ-2026-001 风险表）
  reporter: [["list"], ["./src/trace-reporter.ts"]],
  // ADR-0030 Decision 2：projects 顺序即 parity 报告呈现顺序，勿随意调整。
  projects: TARGETS.map((t) => ({
    name: t.name,
    use: { ...devices["Desktop Chrome"], baseURL: requireE2eEnv(t.urlEnv) },
  })),
});
