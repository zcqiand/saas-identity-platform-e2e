# REQ-2026-001 三端密码登录 E2E 主流程（首条）

| 项 | 值 |
|---|---|
| 提出人 | 项目所有者 |
| 提出日期 | 2026-09-11 |
| 优先级 | P0 |
| 状态 | 已评审 |
| 关联 ADR | suite `docs/adr/0030-e2e-parity-repo.md` |

## 1. 需求描述

> **用户原话（2026-09-11）**：
> 「密码登录 UI 已收口，/req 第一条主流程」
>
> 语境（经 ADR-0030 建仓时确认）：saas-identity-platform-e2e 第一条 E2E 主流程——
> 三端（react/vue/nextjs）密码登录 UI（BASE 树「认证」模块的密码登录子项，
> 下称**密码登录 UI**；其 ID 字面按 contract-test 先例不进本仓文档，只进测试代码）→
> 登录成功进入工作区。按 ADR-0030 Decision 8：先跑通一条主流程，
> Playwright 同一套用例参数化三个 baseURL，后端默认 saas-msw，选择器锚 `data-fn`。

**我的理解**：

- 本仓第一条端到端用例，覆盖「打开 /login → 提交凭据 → 落 /tenants」主流程，
  三端跑**同一份 spec**（用例分叉即 parity 失效，ADR-0030 Decision 2）。
- 同时把四件基建调通（ADR-0030 Decision 8「三端启动/参数化/trace 链路」）：
  Playwright 三 project 配置、`data-fn` 锚点约定、trace 映射器、msw 目标接线。
- 三端登录后落点已查实一致：`/tenants`
  （react `navigate("/tenants")` / vue `router.push("/tenants")` / nextjs `router.push("/tenants")`）。
- 登录页的 OAuth 跳板分支（`?redirect_uri=&state=&client_id=` 的 RFC 6749 流）
  **不在本条范围**——那是 SSO 流程，留给后续需求。

### 澄清记录

| 疑问 | 澄清结论 | 澄清人 | 日期 |
|---|---|---|---|
| Q1：用户称密码登录 UI「已收口」，但三前端仓 function-tree 该子项声明仍为`规划`（代码入口已存在）。是否先在三前端仓走 `/tree-change` 翻`已上线`？ | **先翻已上线**：三前端仓各自的 tree-change 流程处理，翻完再跑 T-3（E2E 只测已上线功能） | 项目所有者 | 2026-09-11 |
| Q2：错误凭据分支（停留 /login + 错误提示）是否进首条用例？我建议进（feature-parity §3 异常路径属必须一致项），代价是首条复杂度略增 | **进首条**：AC-3 转正为验收标准 | 项目所有者 | 2026-09-11 |
| Q3：本仓文档按 contract-test 先例只用**名称**指 BASE 子项（L5 无跨仓感知，ID 字面会报悬空）。字面只进测试代码。是否要为 e2e 仓向 suite 申请扩展豁免机制（如「跨仓引用段」heading），还是长期遵循名称引用先例？ | **待澄清**（不阻断本 REQ；当前按先例执行） | | |
| Q4：三端登录行为分歧——vue 要求 clientId（且 LoginRequest 契约 required），react/nextjs 未实现。按哪个对齐？ | **B 方案（SSO-first）**：三端统一要求 clientId。clientId = `?client_id=` ?? env `LOGIN_CLIENT_ID`（值 = seed 新增的 saas-console 自身应用 `…1114`）；缺则 toast 拒绝不出网。连带修复：react 死桩 authLogin→sessionsLogin、nextjs env 动态 key 不内联、三端登录页自挂 Toaster | 项目所有者 | 2026-09-11 |

## 2. 验收标准

> 前置：saas-msw（:5100）与三前端 dev server（nextjs :5101 / react :5102 / vue :5103）在跑，
> 三前端 API base 指向 msw。凭据机制已查实（2026-09-11）：msw 登录确定性——
> `users` fixture 用户名（alice/bob/carol…）+ 家族统一 DEMO_PASSWORD；
> E2E 经 `E2E_TEST_USERNAME`/`E2E_TEST_PASSWORD` env 注入（fail-fast 禁兜底，
> 值只进 `.env.local` 不进断言/注释）。

| 编号 | 场景（给定） | 操作（当） | 预期（则） |
|---|---|---|---|
| AC-1 | 任一端 dev server 在跑 | 打开 `/login` | 登录表单渲染，提交按钮挂密码登录 UI 的 `data-fn` 锚点（锚 ID 与 shared 树该子项一致，字面见测试代码） |
| AC-2 | 表单已渲染（clientId 走 env 兜底 = saas-console） | 输入 msw seed 有效凭据并提交 | 请求体 clientId = saas-console；落 `/tenants`，工作区内容渲染 |
| AC-3 | 表单已渲染 | 输入错误凭据并提交 | 停留 `/login`，出现错误提示，不跳转 |
| AC-4 | 同一份 spec 文件 | 三 project（react/vue/nextjs）各跑一遍 | 三遍结果一致（同绿或同红且同因）；spec 内无 per-端 分支代码 |
| AC-5 | 一次完整运行结束 | 查看 `.state/trace.json` | 由 trace_cmd 产出；登录用例挂对应 M95 ID；skip 用例 fns 为空 |

## 3. 任务拆解

| 任务 ID | 任务描述 | 类型 | 负责人 | 预估 | 状态 |
|---|---|---|---|---|---|
| T-1 | `playwright.config.ts`：三 project × baseURL（env fail-fast：`E2E_NEXTJS_URL`/`E2E_REACT_URL`/`E2E_VUE_URL`，写 `.env.example`） | 基建 | — | 0.5d | 待开始 |
| T-2 | msw 目标接线：起 saas-msw 的方式与三前端 API base 指向约定（文档 + 本仓 globalSetup 或说明） | 基建 | — | 0.5d | 待开始 |
| T-3 | 登录主流程 spec（AC-1/2/3），选择器只锚 `data-fn` 与可观察行为 | 用例 | — | 1d | 待开始 |
| T-4 | trace 映射器：Playwright 结果 → `.state/trace.json`（skip fns 空；完整任务树） | 基建 | — | 1d | 待开始 |
| T-5 | `.harness/stack.json` 接 L 门（Playwright 命令 + trace_cmd；tag/nightly 触发约定落 CI） | 基建 | — | 0.5d | 待开始 |

## 4. 功能影响（需求与功能对齐唯一位置）

| 功能 ID | 功能名称 | 影响类型 | 说明 | 关联任务 |
|---|---|---|---|---|
| M95.F01.I01 | Playwright 三端 project 配置 | 新增 | 同一 spec × 三 baseURL；env fail-fast | T-1 |
| M95.F02.I01 | 密码登录主流程用例 | 新增 | 密码登录 UI 的 data-fn 锚点 + 落 /tenants + 错误凭据 | T-3 |
| M95.F03.I01 | Playwright→trace.json 映射器 | 新增 | 产 `.state/trace.json`；skip fns 空 | T-4 |
| M95.F04.I01 | msw 默认目标接线 | 新增 | 三前端 API base → :5100；无 Key/无 Docker/无网全绿 | T-2 |

> 被测业务面「密码登录 UI」登记在
> `../saas-identity-platform-shared/docs/functions/function-tree.md`（BASE 树，认证模块）；
> 本仓功能面只认 `M95.*`。跨仓子项按 contract-test 先例以名称指称，
> ID 字面只出现在测试代码（`data-fn` 锚点即机读真相）。

## 5. 流程影响

本仓 `docs/design/flow-function-map.md` 仍是 init 空壳。首条流程锚点（E2E-01 登录）
随 T-3 落地时登记，本 REQ 不预写。

## 6. 风险与回滚

| 风险 | 影响面 | 缓解 | 回滚方式 |
|---|---|---|---|
| 浏览器 E2E flaky（dev server 未起/慢） | CI 误红 | 用例前置显式 waitFor；失败重试 1 次；tag/nightly 触发不进每 commit 门 | 删 spec 文件即回滚，无副作用 |
| 三前端 dev server 同时起，本机端口占用/内存 | 本地跑 | 端口分段 5101-5103 已规划；CI 按需串行起 | — |
| msw seed 凭据轮换 | 用例脆 | 凭据走 env 注入不硬编码；禁 demo 密码出现在断言（家族铁律） | — |
| 登录页改版（SSO 分支挤压表单） | AC-1 失效 | 用例锚 data-fn 不锚 DOM；改版须保 data-fn（三端铁律已有） | — |
