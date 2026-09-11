# REQ-2026-004 会话：登出 + 切换当前租户（铺开②）

| 项 | 值 |
|---|---|
| 提出人 | 项目所有者 |
| 提出日期 | 2026-09-11 |
| 优先级 | P0 |
| 状态 | 已验收 |
| 关联 ADR | ADR-0030 |

## 需求描述
> 用户原话：「按铺开顺序执行」——②登出+切租户。

## 功能影响
| 功能 ID | 名称 | 影响类型 | 说明 |
|---|---|---|---|
| M95.F02.I03 | 会话用例 | 新增 | 2 AC × 3 端（6/6 绿） |

## 战果（真问题，全部已修）
1. **三端切换器是同一个 mock 壳**（写死 memberships + "mock-token-"，从不调 API）——三仓接真：
   me/tenants + me/switch + admin/tenants join（契约 TenantMember 无租户名，管理台 join 自身列表数据源）
2. **msw login 响应缺契约 required 字段**（user/availableTenants/clientId）→ 三端 currentTenantId 落空 →
   react 切换器条件渲染直接消失。补齐（user 按 SysUser 契约挑字段）。
3. **vue onLogout 未 await logout()**：push("/login") 时 isAuthenticated 仍 true 被路由守卫拦回。
4. fixture 补 alice→globex membership（…0006，切换场景）。
5. orval 产物 quirk：可选 query param 生成必填 params 类型（clientId）；且序列化进 URL query
   （E2E waitForRequest 的 endsWith 匹配被 ?clientId= 骗过——断言用 includes）。

## 风险与回滚
删 spec 即回滚；前端修复各自独立 commit。
