import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
export type PollLoopOpts = {
    server: Server;
    baseUrl: string;
    cdnBaseUrl: string;
    token?: string;
    accountId: string;
    /** 仅接受此 userId 的消息 */
    allowedUserId: string;
    abortSignal?: AbortSignal;
};
export declare function startPollLoop(opts: PollLoopOpts): Promise<void>;
