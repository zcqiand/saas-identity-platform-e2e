# REQ-2026-005 角色管理 + 菜单授权（铺开③，本批 ③a 角色 CRUD）

| 项 | 值 |
|---|---|
| 提出人 | 项目所有者 |
| 提出日期 | 2026-09-11 |
| 优先级 | P0 |
| 状态 | ③a 已验收；③b（BASE 菜单授权的保存/清空子项）待下批（menus fixture 契约对齐先行） |
| 关联 ADR | ADR-0030 |

## 需求描述
> 用户原话：「按铺开顺序执行」——③角色/菜单授权。

## 功能影响
| 功能 ID | 名称 | 影响类型 | 说明 |
|---|---|---|---|
| M95.F02.I04 | 角色 CRUD 用例 | 新增 | 4 AC × 3 端（12/12 绿） |

## 战果（真问题，全部已修）
1. **react/nextjs 角色页 barrel 死桩**（同租户页病灶）→ 切真源 tenant-roles tag；vue 本已真源。
2. **契约字段三方漂移**：SysRole = roleCode/roleName/clientId/isPreset/status（9/7 pivot），
   三端页面用 code/name、fixture 也是旧字段、三端创建缺契约必填 clientId（全 400）。
   对齐：页面字段、sys_role fixture（两仓+seed-db 读键）、创建归并 clientId="saas-console"
   （管理台自建角色归属自身 client；表单不暴露，语义记 ui-interaction-spec）。
3. **BASE「权限矩阵绑定」子项的 react 死按钮**（调已废弃 PUT permissions 端点）删除，对齐 vue/nextjs
   （权限面由菜单授权承接）。BASE 树该子项状态待 tree-change 裁决。
4. react/nextjs 删除死「权限」列（SysRole 无 permissionIds）。

## 遗留（③b）
- sys_menu fixture 契约对齐（appId/code/name → clientId/title 等，41 条 + 引用链 + 多消费方）
- 菜单授权页 E2E（BASE 菜单授权模块的保存/清空/查询入口三子项；跨仓 ID 字面见 spec）
