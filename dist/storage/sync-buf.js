import fs from "node:fs";
import path from "node:path";
import os from "node:os";
function resolveSyncDir() {
    return path.join(os.homedir(), ".claude", "channels", "wechat", "sync");
}
export function getSyncBufFilePath(accountId) {
    return path.join(resolveSyncDir(), `${accountId}.sync.json`);
}
export function loadGetUpdatesBuf(filePath) {
    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(raw);
        if (typeof data.get_updates_buf === "string") {
            return data.get_updates_buf;
        }
    }
    catch {
        // file not found or invalid
    }
    return undefined;
}
export function saveGetUpdatesBuf(filePath, getUpdatesBuf) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify({ get_updates_buf: getUpdatesBuf }, null, 0), "utf-8");
}
//# sourceMappingURL=sync-buf.js.map