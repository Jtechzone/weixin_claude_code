/**
 * Try to transcode a SILK audio buffer to WAV using silk-wasm.
 * silk-wasm's decode() returns { data: Uint8Array (pcm_s16le), duration: number }.
 *
 * Returns a WAV Buffer on success, or null if silk-wasm is unavailable or decoding fails.
 * Callers should fall back to passing the raw SILK file when null is returned.
 */
export declare function silkToWav(silkBuf: Buffer): Promise<Buffer | null>;
