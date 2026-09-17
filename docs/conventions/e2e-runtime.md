# E2E 运行时约定（M95.F04.I01）

> 什么时候读我：本仓跑 `npm run e2e` 前，或 CI 接 Playwright（T-5）时。
> 决策依据：suite ADR-0030（e2e 仓不自起被测服务；tag/nightly 触发）。

## 1. 谁起服务：外部起，本仓不自起

本仓 **没有** globalSetup/webServer 自动起服。四个被测进程由运行环境（本机终端或
CI 脚本）事先起好；没起 → Playwright 报 connection refused，**这是环境错误，
不是用例失败**，修环境而不是改用例。

理由：ADR-0030 Decision 7（tag/nightly 触发，CI 脚本负责起服）；本仓保持
mock-friendly 语义（不起服时门禁照常可跑，E2E 用例仅在显式执行时需要服务）。

## 2. 起服清单（顺序即依赖序）

| 序 | 仓 | 端口 | 命令（仓根） | 前置 |
|---|---|---|---|---|
| 1 | saas-identity-platform-nextjs | 5101 | `npm run dev` | PG 库在位（migrate + seed，见 §3.5） |
| 2 | saas-identity-platform-react | 5102 | `npm run dev` | nextjs 在跑 |
| 3 | saas-identity-platform-vue | 5103 | `npm run dev` | nextjs 在跑 |

健康检查：nextjs `GET :5101/api/health` 返回 200。API 后端 = 真 saas-nextjs
（2026-09-17 msw 仓已删，剔除设计 Phase 4 提前；同款 `/api/v1/auth/login` 契约）。

## 3. 前端 API base：跑 E2E 前须确认

三前端 API base 必须指向被测 saas-nextjs :5101：

- react / vue：`VITE_API_BASE_URL=http://localhost:5101`
- nextjs：`NEXT_PUBLIC_SAAS_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL=http://localhost:5101`
  （API 走同源本仓 /api/v1 时可留空）

CI 已内置这些覆盖（ci.yml envs）；本机 `.env.local` 若指过其它后端（5104/5105），
跑 E2E 前改回。CORS：saas-nextjs `SAAS_CORS_ALLOWED_ORIGINS` 白名单含
5101/5102/5103（multi-repo-family §6）。

## 3.5 数据生命周期（2026-09-11 建；2026-09-17 切真后端后语义更新）

真后端 DB 持久化——跨运行累积会撑爆分页首屏（flaky 实伤过 AC-4）。
本仓 `globalSetup` 在每轮跑测前跑 shared `scripts/seed-db.mjs` **upsert 重灌**
（`E2E_DATABASE_URL` 指向被测 saas-nextjs 实际连的库），把写路径用例翻转过的
种子行还原；自产行靠唯一 code（`uniqueCode`），不依赖删除式清理。
`globalTeardown` 同款再灌一次，防失败泄漏残留污染开发者手动浏览。
CI 用一次性 `saas_e2e` scratch 库（见 ci.yml postgres service），
本机默认打 saas_dev——介意污染可给 saas-nextjs 换 scratch 库再跑。

## 4. 本仓 env

见 `.env.example`（fail-fast，禁兜底）。真值进 `.env.local`（gitignored）；
登录凭据 = saas seeds 用户 + 家族 DEMO_PASSWORD（dev 种子 `plain:` 前缀口径），**不进断言/注释**。

## 5. live 模式（未建）

对真实后端（5104/5105）的 live 运行参照 contract-test ADR-0016 模式另行接入，
不进默认运行；接入时须在本文件登记 env key 与起服差异。
