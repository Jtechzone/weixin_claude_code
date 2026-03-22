import type { MessageItem } from "../api/types.js";
export type InboundMediaResult = {
    decryptedPicPath?: string;
    decryptedVoicePath?: string;
    voiceMediaType?: string;
    decryptedFilePath?: string;
    fileMediaType?: string;
    decryptedVideoPath?: string;
};
/**
 * Download and decrypt media from a single MessageItem.
 * Returns the populated InboundMediaResult fields; empty object on unsupported type or failure.
 */
export declare function downloadMediaFromItem(item: MessageItem, deps: {
    cdnBaseUrl: string;
    log: (msg: string) => void;
    errLog: (msg: string) => void;
    label: string;
}): Promise<InboundMediaResult>;
/** 清理超过 24 小时的临时媒体文件 */
export declare function cleanupTempMedia(): Promise<void>;
