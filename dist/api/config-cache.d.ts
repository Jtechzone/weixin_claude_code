/** Subset of getConfig fields that we actually need; add new fields here as needed. */
export interface CachedConfig {
    typingTicket: string;
}
/**
 * Per-user getConfig cache with periodic random refresh (within 24h) and
 * exponential-backoff retry (up to 1h) on failure.
 */
export declare class WeixinConfigManager {
    private apiOpts;
    private log;
    private cache;
    constructor(apiOpts: {
        baseUrl: string;
        token?: string;
    }, log: (msg: string) => void);
    getForUser(userId: string, contextToken?: string): Promise<CachedConfig>;
}
