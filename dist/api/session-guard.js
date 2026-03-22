import { logger } from "../util/logger.js";
export const SESSION_EXPIRED_ERRCODE = -14;
const pausedAccounts = new Set();
export function pauseSession(accountId) {
    pausedAccounts.add(accountId);
    logger.info(`session-guard: paused accountId=${accountId}, waiting for manual re-login`);
}
export function isSessionPaused(accountId) {
    return pausedAccounts.has(accountId);
}
export function resetSession(accountId) {
    pausedAccounts.delete(accountId);
    logger.info(`session-guard: reset accountId=${accountId}`);
}
export function assertSessionActive(accountId) {
    if (isSessionPaused(accountId)) {
        throw new Error(`session paused for accountId=${accountId}, please re-login`);
    }
}
//# sourceMappingURL=session-guard.js.map