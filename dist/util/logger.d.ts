type LogLevel = "debug" | "info" | "warn" | "error";
export declare const logger: {
    debug: (msg: string) => void;
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
    setLevel: (level: LogLevel) => void;
    withAccount: (accountId: string) => {
        debug: (msg: string) => void;
        info: (msg: string) => void;
        warn: (msg: string) => void;
        error: (msg: string) => void;
        getLogFilePath: () => string;
    };
};
export type Logger = ReturnType<typeof logger.withAccount>;
export {};
