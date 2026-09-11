# REQ-2026-006 OAuth SSO 跳板 302 全链（铺开④）

| 项 | 值 |
|---|---|
| 提出人 | 项目所有者 |
| 提出日期 | 2026-09-11 |
| 优先级 | P0 |
| 状态 | 已验收（6/6 三端绿） |
| 关联 ADR | ADR-0030；ADR-0015（此层正是它留给 E2E 的洞） |

## 需求描述
> 用户原话：「③+ ④」——④ OAuth SSO 跳板 302 全链。

## 功能影响
| 功能 ID | 名称 | 影响类型 | 说明 |
|---|---|---|---|
| M95.F02.I06 | OAuth 跳板全链用例 | 新增 | 2 AC × 3 端 |

## 验收
- AC-1 /login?client_id&redirect_uri&state → 登录 → authorize 领 code → 浏览器真实跳 RP callback
  （code 非空=真签发 + state 原样透传；本地无真实 RP，用 page.route fulfill 充当虚拟 callback）
- AC-2 非法 redirect_uri → authorize 400 → 停留登录页不跳非白名单域

## 战果（真问题，全部已修）
1. **nextjs 缺 onSubmit 跳板分支**：带跳板参数登录后落 /tenants 而非回 RP（react/vue 均有）。
2. **nextjs RequireAuth 守卫豁免不认跳板范式**：抢先 replace(/tenants) 吞掉跳板与 400 停留语义。
3. **react authorize 走 barrel 死桩**（假 code 跳 RP——测试若只断 URL 形状根本测不出）→ 真源。
4. **三端 authorize payload 带契约外 tenantId**（契约无此字段；msw 校验也过严要求它）→ 双侧对齐契约，
   code 改绑认证身份（Bearer tenant claim）。
5. E2E 技术沉淀：虚拟 RP（route fulfill）+ expect.poll 容忍双导航竞争（waitForURL 会 ERR_ABORTED）。

## 风险与回滚
删 spec 即回滚；守卫/跳板分支修复各自独立 commit。
