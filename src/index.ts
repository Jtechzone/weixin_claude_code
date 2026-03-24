import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createMcpServer, setOnLoginSuccess, setPollLoopRunning, setPollAbortController } from "./mcp-server.js";
import { startPollLoop } from "./poll-loop.js";
import { listIndexedWeixinAccountIds, resolveWeixinAccount } from "./auth/accounts.js";
import { logger } from "./util/logger.js";
import { cleanupTempMedia } from "./media/media-download.js";

async function main() {
  logger.info("weixin-claude-code channel starting...");

  // 清理过期临时文件
  await cleanupTempMedia().catch((err: unknown) =>
    logger.warn(`temp cleanup failed: ${String(err)}`),
  );

  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("MCP server connected via stdio");

  const abortController = new AbortController();
  let shuttingDown = false;

  function shutdown(): void {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("shutting down...");
    abortController.abort();
    process.exit(0);
  }

  process.stdin.on("end", shutdown);
  process.stdin.on("close", shutdown);
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // ---------------------------------------------------------------------------
  // 已知局限：channel 模式检测
  //
  // 当前 MCP 协议不提供任何机制让 server 检测自身是否运行在 channel 模式
  // （即 Claude Code 是否以 --channels 启动）。非 channel 模式下：
  //   - poll-loop 仍会运行并消费 getUpdates 中的消息
  //   - notifications/claude/channel 会被 Claude Code 静默丢弃
  //   - 这会导致后续以 channel 模式启动的会话丢失已被消费的消息
  //
  // 此问题属于 Claude Code 核心架构缺陷，社区已有反馈：
  //   - https://github.com/anthropics/claude-code/issues/36964
  //
  // 在官方提供 channel 模式检测信号之前，此处暂无法区分两种模式，
  // 只能无条件启动 poll-loop，建议只在需要的会话中启动此 MCP Server。
  // ---------------------------------------------------------------------------

  // 启动 poll-loop 的函数，返回是否成功启动
  function launchPollLoop(accountId: string): boolean {
    const account = resolveWeixinAccount(accountId);
    if (!account.configured) {
      logger.warn(`account ${accountId} not configured, skipping poll-loop`);
      return false;
    }
    if (!account.userId) {
      logger.warn(`account ${accountId} has no userId, skipping poll-loop`);
      return false;
    }
    // pollAbort: logout 时停止当前 poll-loop
    // AbortSignal.any: 全局退出 (SIGINT/SIGTERM) 或 logout 都能停止
    const pollAbort = new AbortController();
    setPollAbortController(pollAbort);
    const combinedSignal = AbortSignal.any([abortController.signal, pollAbort.signal]);
    startPollLoop({
      server,
      baseUrl: account.baseUrl,
      cdnBaseUrl: account.cdnBaseUrl,
      token: account.token,
      accountId: account.accountId,
      allowedUserId: account.userId,
      abortSignal: combinedSignal,
    }).catch((err) => {
      if (!combinedSignal.aborted) {
        logger.error(`poll-loop crashed: ${String(err)}`);
        setPollLoopRunning(false);
      }
    });
    return true;
  }

  // 登录成功后的回调
  setOnLoginSuccess((accountId) => {
    logger.info(`login success callback, launching poll-loop for ${accountId}`);
    launchPollLoop(accountId);
  });

  // 检查已有凭证
  const accountIds = listIndexedWeixinAccountIds();
  const launched = accountIds.length > 0 && launchPollLoop(accountIds[0]);
  if (!launched) {
    logger.info("no accounts found, sending login prompt notification");
    // 延迟发送，确保 MCP 连接就绪
    setTimeout(async () => {
      try {
        await server.notification({
          method: "notifications/claude/channel",
          params: {
            content: "微信 Channel 已启动，但尚未登录。请调用 login 工具扫码连接微信。",
            meta: { type: "login_required" },
          },
        });
      } catch (err) {
        logger.warn(`failed to send login prompt: ${String(err)}`);
      }
    }, 1000);
  }
}

main().catch((err) => {
  logger.error(`fatal: ${String(err)}`);
  process.exit(1);
});
