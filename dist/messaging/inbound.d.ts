import type { MessageItem } from "../api/types.js";
/** Store a context token for a given chat (user). */
export declare function setContextToken(chatId: string, token: string): void;
/** Retrieve the cached context token for a given chat (user). */
export declare function getContextToken(chatId: string): string | undefined;
/** Returns true if the message item is a media type (image, video, file, or voice). */
export declare function isMediaItem(item: MessageItem): boolean;
/**
 * Extract the text body from a message's item_list.
 * Handles text items, quoted references, and voice-to-text fallback.
 */
export declare function bodyFromItemList(itemList?: MessageItem[]): string;
