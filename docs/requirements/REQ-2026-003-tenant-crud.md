# REQ-2026-003 租户管理 CRUD（铺开第 ① 站）

| 项 | 值 |
|---|---|
| 提出人 | 项目所有者 |
| 提出日期 | 2026-09-11 |
| 优先级 | P0 |
| 状态 | 已验收 |
| 关联 ADR | ADR-0030；前置 REQ-2026-002（trace/L 门） |

## 1. 需求描述

> **用户原话（2026-09-11）**：「按铺开顺序执行」——①租户管理 CRUD。

**我的理解**：登录主流程之后铺开到租户管理（列表/创建/更新/删除 × 三端），
断言锚 `data-fn`（BASE 租户管理的列表/创建/更新/删除子项）与可观察行为（行出现/消失、toast、确认弹窗）。

### 澄清记录

| 疑问 | 结论 | 澄清人 | 日期 |
|---|---|---|---|
| 发现契约字段 `Tenant.tenantKey`（shared SSOT）三方漂移（msw 返回 code、react 读 code、vue 表单发 code、contract-test drop 清单掩盖） | 按 SSOT 对齐全链：msw fixture/handler、react/vue 表单与展示、contract-test 断言去掩盖（后续 REQ） | 项目所有者（SSOT 原则） | 2026-09-11 |
| TenantStatus 契约只有 active/suspended，三端表单残留 archived 选项 | 删除 archived 选项（契约外选项=parity bug） | 同上 | 2026-09-11 |
| msw seeds 与 DB 不对齐（5 个死域文件、旧 parity 守门静默 skip） | 用户裁定：与 DB 对齐，DB 没有的删除清理；parity 升严格镜像 | 项目所有者 | 2026-09-11 |
| 前端对 msw 的 npm file: 依赖（node_modules 拷贝漂移→假绿） | 用户确认 Mock Server 模式不需要包依赖 → 三仓卸载，fixtures 相对路径直连源仓 | 项目所有者 | 2026-09-11 |

## 2. 验收标准

| 编号 | 场景 | 操作 | 预期 |
|---|---|---|---|
| AC-1 | 已登录 | 打开 /tenants | seed 三行（acme/globex/initech）渲染 |
| AC-2 | 列表页 | 新建（tenantKey+name）→ 保存 | 行出现 + toast |
| AC-3 | 已建行 | 编辑改名 → 保存 | 行文本更新 |
| AC-4 | 已建行 | 删除 → alertdialog「删除」确认 | 行消失 |

## 3. 功能影响

| 功能 ID | 名称 | 影响类型 | 说明 |
|---|---|---|---|
| M95.F02.I02 | 租户管理 CRUD 用例 | 新增 | 4 AC × 3 端；写操作自产自销 uniqueCode；覆盖 BASE 租户管理四子项（字面见 spec，跨仓 ID 不入本文档） |

## 4. 战果（E2E 第 2 轮抓到的真问题，全部已修）

1. **react/nextjs `endpoints.ts` barrel 死桩 shadow**：`export *` 真 orval 产物后被同名
   死桩（`Promise.resolve` 假数据）覆盖——**两仓除登录外所有列表页对真实用户恒空白**，
   单测 mock 掉该模块从未暴露。页面切真源 import。
2. **契约字段三方漂移**（tenantKey vs code，见澄清记录）。
3. **vue ConfirmDialog 竞态**：reka AlertDialogAction 自动关闭先于 @confirm，
   调用方清 target 后 confirmDelete 静默早退——删除永不发请求。确认键改普通 button。
4. **msw seeds 5 个死域文件**（api-keys/audit×2/permissions×2）+ 旧 parity 守门
   对照物消失后静默 skip——守门重建为 msw↔nextjs 严格镜像。
5. **前端 file: 依赖拷贝漂移**（假绿）——根除为零依赖 + 相对路径直连。
6. msw `.env` 缺失（JWT_* fail-fast，裸 `npm run dev` 即炸）——.env.example 模板化 + CI 补。

## 5. 风险与回滚

删 spec 文件即回滚；msw/前端的修复各自独立成 commit 可单独 revert。
