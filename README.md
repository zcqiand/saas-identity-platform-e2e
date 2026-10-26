# SaaS身份平台前端E2E一致性

同一套 Playwright 用例，参数化三个前端地址（react/vue/nextjs）——验证三端交互、状态与异常路径对用户不可区分（ADR-0030）。

本仓为《（书稿信息待补）》案例（待补）的可运行配套工程，是书稿代码块的 **source of truth**。

## 快速开始

```bash
# 前置：node + npm（依赖一律走 npmmirror）
npm install --registry=https://registry.npmmirror.com           # 安装依赖
npx --no tsc --noEmit          # L3 类型
npx --no playwright test       # L4 e2e parity suite（react/vue/nextjs 参数化）
```

## 功能特性

按特性分点描述核心功能（见 `docs/functions/function-tree.md`）。

## 技术栈

| 技术 | 版本 |
| :--- | :--- |
| Playwright / TypeScript | ^1.63.0 / ^7.0.2（package.json 钉版） |

> 依赖版本与 `version-lock.json` 的 `version_lock` 一致，不引入 lock 外的库。

## 配套书籍及章节映射

| 章 | 主题 | 对应源文件 |
| :--- | :--- | :--- |
| （待补） | | |

## 快速链接

- [CLAUDE.md](CLAUDE.md) — 开发约定与编码规范
- [系统架构.md](docs/ARCHITECTURE.md) — 结构 / 边界 / 数据流 / 决策
- [功能规格.md](docs/functions/function-tree.md) — 功能名称、描述与验收标准
- [未来开发计划](PLAN.md) — 待办与迭代方向
- [更新日志](CHANGELOG.md) — 版本变更记录
