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
| 1 | saas-identity-platform-msw | 5100 | `npm run dev` | 无（内存 fixture，无 DB） |
| 2 | saas-identity-platform-nextjs | 5101 | `npm run dev` | msw 在跑 |
| 3 | saas-identity-platform-react | 5102 | `npm run dev` | msw 在跑 |
| 4 | saas-identity-platform-vue | 5103 | `npm run dev` | msw 在跑 |

健康检查：msw `GET :5100/healthz` 返回 `mode:'msw'`。

## 3. 前端 API base：默认即 msw，跑 E2E 前须确认

三前端仓 `.env.example` 的默认 API base **已指向 msw :5100**：

- react / vue：`VITE_API_BASE_URL=http://localhost:5100`
- nextjs：`NEXT_PUBLIC_SAAS_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL=http://localhost:5100`

若本机 `.env.local` 改指过真后端（5104/5105），跑 E2E 前改回 msw。
CORS 已就绪：msw `src/server.ts` 白名单含 5101/5102/5103（multi-repo-family §6）。

## 3.5 数据生命周期（2026-09-11）

msw 无持久化但 handlers 会写内存——跨运行累积会撑爆分页首屏（flaky 实伤过 AC-4）。
本仓 `globalSetup` 在每轮跑测前 POST `:5100/api/v1/__e2e/reset`（mock-server 专属调试端点，
不进 shared 契约），fixtures 还原到启动快照。CI 同理（globalSetup 自动生效）。

## 4. 本仓 env

见 `.env.example`（fail-fast，禁兜底）。真值进 `.env.local`（gitignored）；
登录凭据 = msw users fixture 用户名 + 家族 DEMO_PASSWORD，**不进断言/注释**。

## 5. live 模式（未建）

对真实后端（5104/5105）的 live 运行参照 contract-test ADR-0016 模式另行接入，
不进默认运行；接入时须在本文件登记 env key 与起服差异。
