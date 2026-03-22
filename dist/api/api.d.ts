import type { BaseInfo, GetUploadUrlReq, GetUploadUrlResp, GetUpdatesReq, GetUpdatesResp, SendMessageReq, SendTypingReq, GetConfigResp } from "./types.js";
export type WeixinApiOptions = {
    baseUrl: string;
    token?: string;
    timeoutMs?: number;
    /** Long-poll timeout for getUpdates (server may hold the request up to this). */
    longPollTimeoutMs?: number;
};
/** Build the `base_info` payload included in every API request. */
export declare function buildBaseInfo(): BaseInfo;
/**
 * Long-poll getUpdates. Server should hold the request until new messages or timeout.
 *
 * On client-side timeout (no server response within timeoutMs), returns an empty response
 * with ret=0 so the caller can simply retry. This is normal for long-poll.
 */
export declare function getUpdates(params: GetUpdatesReq & {
    baseUrl: string;
    token?: string;
    timeoutMs?: number;
}): Promise<GetUpdatesResp>;
/** Get a pre-signed CDN upload URL for a file. */
export declare function getUploadUrl(params: GetUploadUrlReq & WeixinApiOptions): Promise<GetUploadUrlResp>;
/** Send a single message downstream. */
export declare function sendMessage(params: WeixinApiOptions & {
    body: SendMessageReq;
}): Promise<void>;
/** Fetch bot config (includes typing_ticket) for a given user. */
export declare function getConfig(params: WeixinApiOptions & {
    ilinkUserId: string;
    contextToken?: string;
}): Promise<GetConfigResp>;
/** Send a typing indicator to a user. */
export declare function sendTyping(params: WeixinApiOptions & {
    body: SendTypingReq;
}): Promise<void>;
