/** Default `bot_type` for ilink get_bot_qrcode / get_qrcode_status (this channel build). */
export declare const DEFAULT_ILINK_BOT_TYPE = "3";
export type WeixinQrStartResult = {
    qrcodeUrl?: string;
    message: string;
    sessionKey: string;
};
export type WeixinQrWaitResult = {
    connected: boolean;
    botToken?: string;
    accountId?: string;
    baseUrl?: string;
    /** The user ID of the person who scanned the QR code; add to allowFrom. */
    userId?: string;
    message: string;
};
export declare function startWeixinLoginWithQr(opts: {
    verbose?: boolean;
    timeoutMs?: number;
    force?: boolean;
    accountId?: string;
    apiBaseUrl: string;
    botType?: string;
}): Promise<WeixinQrStartResult>;
export declare function waitForWeixinLogin(opts: {
    timeoutMs?: number;
    verbose?: boolean;
    sessionKey: string;
    apiBaseUrl: string;
    botType?: string;
}): Promise<WeixinQrWaitResult>;
