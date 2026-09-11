// 跑测结束后把 msw fixtures 还原到启动快照：
// e2e 自产自销的行（如 e2e-xxx 租户）即使断言失败/重试泄漏，也不会残留在
// 开发者的 msw 内存里污染手动浏览。与 globalSetup 的 reset 成对。
export default async function globalTeardown(): Promise<void> {
  await fetch("http://localhost:5100/api/v1/__e2e/reset", { method: "POST" }).catch(() => {
    // msw 没起（环境错误）时静默：setup 已报过更明确的错
  });
}
