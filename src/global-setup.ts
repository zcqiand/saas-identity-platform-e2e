// M95.F04.I01 配套：跑测前把 msw fixtures 还原到启动快照（根除跨运行累积 flaky）。
// msw 是外部起的独立进程（e2e-runtime.md §1），这里只发一次 HTTP 调用，不起服务。
// msw 地址 = 家族端口表固定 :5100（suite docs/conventions/env.md），不走 env。
export default async function globalSetup(): Promise<void> {
  const resetUrl = "http://localhost:5100/api/v1/__e2e/reset";
  const res = await fetch(resetUrl, { method: "POST" }).catch((e: unknown) => {
    throw new Error(
      `[e2e globalSetup] msw reset 失败（${resetUrl}）：${String(e)}。` +
        `确认 saas-msw 在跑（:5100/healthz）；起服约定见 docs/conventions/e2e-runtime.md。`,
    );
  });
  if (!res.ok) {
    throw new Error(`[e2e globalSetup] msw reset 返回 ${res.status}`);
  }
}
