let currentLevel = process.env.LOG_LEVEL || "info";
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
function shouldLog(level) {
    return LEVELS[level] >= LEVELS[currentLevel];
}
function log(level, msg) {
    if (!shouldLog(level))
        return;
    const ts = new Date().toISOString();
    process.stderr.write(`[${ts}] [${level.toUpperCase()}] ${msg}\n`);
}
export const logger = {
    debug: (msg) => log("debug", msg),
    info: (msg) => log("info", msg),
    warn: (msg) => log("warn", msg),
    error: (msg) => log("error", msg),
    setLevel: (level) => { currentLevel = level; },
    withAccount: (accountId) => ({
        debug: (msg) => log("debug", `[${accountId}] ${msg}`),
        info: (msg) => log("info", `[${accountId}] ${msg}`),
        warn: (msg) => log("warn", `[${accountId}] ${msg}`),
        error: (msg) => log("error", `[${accountId}] ${msg}`),
        getLogFilePath: () => "stderr",
    }),
};
//# sourceMappingURL=logger.js.map