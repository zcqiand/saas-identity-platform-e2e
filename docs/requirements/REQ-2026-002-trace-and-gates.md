# REQ-2026-002 trace 映射器 + L 门 + CI 接线（基建收口）

| 项 | 值 |
|---|---|
| 提出人 | 项目所有者 |
| 提出日期 | 2026-09-11 |
| 优先级 | P0 |
| 状态 | 已验收 |
| 关联 ADR | suite `docs/adr/0030-e2e-parity-repo.md` |

## 1. 需求描述

> **用户原话（2026-09-11）**：
> 「按铺开顺序执行」——铺开前的依赖链第一步：T-4 trace 映射器先行（没有它覆盖进度永远手算），
> T-5（L 门 + tag/nightly CI）跟上。

**我的理解**：把 REQ-2026-001 遗留的 T-4/T-5 收口——Playwright 结果机器化进 `.state/trace.json`，
stack.json 挂 L3/L4，CI 按 ADR-0030 Decision 7 编排四被测进程。

## 2. 验收标准

| 编号 | 场景（给定） | 操作（当） | 预期（则） |
|---|---|---|---|
| AC-1 | 一次 `npm run e2e` 结束 | 查看 `.state/trace.json` | schema=1；仓相对路径；fns 只含 M95.*；inert 条目 fns 空 |
| AC-2 | suite 根目录 | `python scripts/gate.py -p saas-identity-platform-e2e` | L0/L0.5/L3/L4/L5 全绿 |
| AC-3 | tag push / nightly / 手动 | GitHub Actions | 起 4 被测进程 + healthcheck + playwright + 产物上传 |

## 3. 任务拆解

| 任务 ID | 任务描述 | 类型 | 状态 |
|---|---|---|---|
| T-1 | `src/trace-reporter.ts`（Playwright 自定义 reporter；M95 命名空间过滤） | 基建 | 完成 |
| T-2 | `tsconfig.json` + L3 tsc + L4 playwright 进 stack.json | 基建 | 完成 |
| T-3 | `.github/workflows/ci.yml`（tag/nightly/dispatch；sibling checkout + healthcheck） | 基建 | 完成（本地无法验证 Actions，首跑待观察） |

## 4. 功能影响

| 功能 ID | 功能名称 | 影响类型 | 说明 | 关联任务 |
|---|---|---|---|---|
| M95.F03.I01 | Playwright→trace.json 映射器 | 变更 | 规划→已上线；retries Map 去重、inert fns 空、路径仓相对 | T-1 |
| M95.F01.I02 | CI 编排（tag/nightly） | 新增 | sibling checkout 4 仓 + env 生成 + healthcheck + 产物上传 | T-3 |

> 设计取舍：trace.fns 只收 M95.*。BASE ID（如密码登录子项）保留在用例标题文本——
> L5 base_ids 豁免目前仅 `-contract-test` 后缀仓（suite `_alignment.py` 2026-09-10 工作未含 e2e）；
> e2e 进 BASE 覆盖矩阵维度属 suite 扩展，待人裁决，不为本仓门变绿改 suite。

## 5. 流程影响

无。

## 6. 风险与回滚

| 风险 | 缓解 | 回滚 |
|---|---|---|
| CI 首跑失败（本地无法验证 Actions 语义） | 编排 mirror contract-test ci.yml 已验证模式；失败看 .runtime-logs 产物 | 删 ci.yml |
| trace_cmd 与 L4 双跑 playwright | ADR-0017-amend：L5 复用 30min 内 trace.json，不二次跑 | — |
