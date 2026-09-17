// M95.F04.I01 配套：跑测前把种子还原（根除跨运行累积 flaky）。
// 2026-09-17 msw 仓已删（剔除设计 Phase 4 提前）：「reset」语义从 msw 内存快照
// 还原改为 shared seed-db upsert（restore 种子行；自产行靠唯一 code 不依赖删除）。
// 被测服务都是外部起的独立进程（e2e-runtime.md §1），这里只发 DB 调用，不起服务。
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { requireE2eEnv } from "./env";

// Playwright 把 globalSetup 转译成 CJS（import.meta 不可用），用 __dirname 定位
// shared sibling（lab-e2e 同款先例）。
const SHARED = resolve(__dirname, "../../saas-identity-platform-shared");

/** shared seed-db upsert（幂等，restore 种子行被写路径用例翻转的字段）。
 *  E2E_DATABASE_URL 必须指向被测 saas-nextjs 实际连的库（CI=saas_e2e scratch，
 *  本机=saas-nextjs .env.local 的 DATABASE_URL）。失败即 throw——种子不可灌
 *  意味着环境错误，不是用例失败。 */
export function reseed(): void {
  if (!existsSync(resolve(SHARED, "scripts/seed-db.mjs"))) {
    throw new Error(
      `[e2e globalSetup] 找不到 ${SHARED}/scripts/seed-db.mjs——` +
        `确认 saas-identity-platform-shared sibling 在位（CI 见 ci.yml clone 步）。`,
    );
  }
  const r = spawnSync(
    process.execPath,
    ["scripts/seed-db.mjs"],
    {
      cwd: SHARED,
      stdio: "inherit",
      // 种库目标 = 被测 saas-nextjs 实际连的库（e2e 契约键 → shared 脚本键）
      env: { ...process.env, DATABASE_URL: requireE2eEnv("E2E_DATABASE_URL") },
    },
  );
  if (r.status !== 0) {
    throw new Error(
      `[e2e globalSetup] seed-db upsert 失败（exit ${r.status}）。` +
        `检查 E2E_DATABASE_URL 与库可达性。`,
    );
  }
}

export default async function globalSetup(): Promise<void> {
  // fail-fast：种库前先验 env 在位（seed-db.mjs 自己也 fail-fast）
  requireE2eEnv("E2E_DATABASE_URL");
  reseed();
}
