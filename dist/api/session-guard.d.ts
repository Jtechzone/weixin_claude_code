export declare const SESSION_EXPIRED_ERRCODE = -14;
export declare function pauseSession(accountId: string): void;
export declare function isSessionPaused(accountId: string): boolean;
export declare function resetSession(accountId: string): void;
export declare function assertSessionActive(accountId: string): void;
