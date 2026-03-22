/**
 * Upload one buffer to the Weixin CDN with AES-128-ECB encryption.
 * Returns the download encrypted_query_param from the CDN response.
 * Retries up to UPLOAD_MAX_RETRIES times on server errors; client errors (4xx) abort immediately.
 */
export declare function uploadBufferToCdn(params: {
    buf: Buffer;
    uploadParam: string;
    filekey: string;
    cdnBaseUrl: string;
    label: string;
    aeskey: Buffer;
}): Promise<{
    downloadParam: string;
}>;
