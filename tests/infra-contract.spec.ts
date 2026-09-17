// 基建件契约测试：CI 编排（M95.F01.I02）/ trace 映射器（M95.F03.I01）/ 后端接线（M95.F04.I01）。
// 这三个子项不是浏览器交互，断言对象是仓内基建文件与映射器行为本身 —— 与
// env-contract.spec.ts 读 playwright.config.ts 同款模式：锚仓内契约，不锚 DOM。
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";
import type { FullResult, TestCase, TestResult } from "@playwright/test/reporter";
import cfg from "../playwright.config";
import TraceReporter from "../src/trace-reporter";

const root = process.cwd();

test("CI 编排：tag/nightly 触发 + sibling checkout + healthcheck + 产物上传 M95.F01.I02", () => {
  const ci = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf-8");
  // 触发面：tag + nightly + 手动；不进每 commit（ADR-0030 Decision 7）
  expect(ci).toContain('tags: ["v*"]');
  expect(ci).toContain("schedule:");
  expect(ci).toContain("workflow_dispatch");
  // shared（种子/迁移权威源）+ 3 个被测仓 sibling checkout，一个不少
  // （2026-09-17 msw 仓已删，API 后端切真 saas-nextjs :5101）
  const siblings = new Set(ci.match(/saas-identity-platform-(shared|react|vue|nextjs)/g) ?? []);
  expect([...siblings].sort()).toEqual([
    "saas-identity-platform-nextjs",
    "saas-identity-platform-react",
    "saas-identity-platform-shared",
    "saas-identity-platform-vue",
  ]);
  // scratch 库 migrate + seed 在起服前完成
  expect(ci).toContain("Migrate + seed scratch DB");
  // 起服 → healthcheck → 跑测 → 产物，链条完整
  expect(ci).toContain("healthcheck nextjs");
  expect(ci).toContain("npm run e2e");
  expect(ci).toContain("actions/upload-artifact");
  // 凭据走 secret，不落明文（ADR-0019 精神）
  expect(ci).toContain("secrets.E2E_TEST_PASSWORD");
});

test("trace 映射器已接入 playwright.config（onEnd 落盘 .state/trace.json） M95.F03.I01", () => {
  const reporters = ((cfg as { reporter?: unknown }).reporter ?? []) as string[][];
  expect(reporters.some((r) => String(r[0]).includes("trace-reporter"))).toBe(true);
});

test("trace 映射器行为：收 M95.*、滤 BASE、inert 清空、retries 去重；跑完还原产物 M95.F03.I01", () => {
  const tracePath = resolve(root, ".state", "trace.json");
  const original = readFileSync(tracePath, "utf-8");
  try {
    const reporter = new TraceReporter();
    const fakeTest = (title: string) =>
      ({
        title,
        location: { file: resolve(root, "tests", "fake.spec.ts") },
      }) as unknown as TestCase;
    const passed = { status: "passed" } as unknown as TestResult;
    const skipped = { status: "skipped" } as unknown as TestResult;

    reporter.onTestEnd(fakeTest("AC-1 密码登录 M95.F02.I01 覆盖 M01.F04.I03"), passed);
    reporter.onTestEnd(fakeTest("AC-1 密码登录 M95.F02.I01 覆盖 M01.F04.I03"), passed); // retries 去重
    reporter.onTestEnd(fakeTest("skip 的用例 M95.F02.I02"), skipped); // inert

    reporter.onEnd({ status: "passed" } as unknown as FullResult);
    const artifact = JSON.parse(readFileSync(tracePath, "utf-8")) as {
      schema: number;
      tests: { test: string; fns: string[]; inert: boolean }[];
    };
    expect(artifact.schema).toBe(1);
    const fake = artifact.tests.filter((t) => t.test.startsWith("tests/fake.spec.ts::"));
    expect(fake).toHaveLength(2); // 同名两条去重成 1 + skip 一条
    const deduped = fake.find((t) => t.test.includes("AC-1"));
    const inertOne = fake.find((t) => t.test.includes("skip"));
    expect(deduped?.fns).toEqual(["M95.F02.I01"]); // BASE ID M01.F04.I03 被滤掉
    expect(deduped?.inert).toBe(false);
    expect(inertOne?.fns).toEqual([]); // inert 的 fns 必空（假绿防线）
    expect(inertOne?.inert).toBe(true);
  } finally {
    writeFileSync(tracePath, original); // 还原真产物，fake 条目不外泄；真实 onEnd 随后整体覆盖
  }
});

test("后端目标接线：三端端口 5101-5103 + 真 API 后端 saas-nextjs :5101（e2e-runtime §2/§3） M95.F04.I01", () => {
  const envExample = readFileSync(resolve(root, ".env.example"), "utf-8");
  // 三端 URL 与起服清单端口一致（e2e-runtime.md §2：5101/5102/5103）
  expect(envExample).toContain("E2E_NEXTJS_URL=http://localhost:5101");
  expect(envExample).toContain("E2E_REACT_URL=http://localhost:5102");
  expect(envExample).toContain("E2E_VUE_URL=http://localhost:5103");
  // 2026-09-17 msw 仓已删：API 后端切真 saas-nextjs :5101，接线约定登记在案
  const runtime = readFileSync(resolve(root, "docs/conventions/e2e-runtime.md"), "utf-8");
  expect(runtime).toContain("M95.F04.I01");
  expect(runtime).toContain("http://localhost:5101");
});
