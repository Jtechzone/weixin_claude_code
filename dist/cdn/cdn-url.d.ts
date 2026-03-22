/**
 * Unified CDN URL construction for Weixin CDN upload/download.
 */
/** Build a CDN download URL from encrypt_query_param. */
export declare function buildCdnDownloadUrl(encryptedQueryParam: string, cdnBaseUrl: string): string;
/** Build a CDN upload URL from upload_param and filekey. */
export declare function buildCdnUploadUrl(params: {
    cdnBaseUrl: string;
    uploadParam: string;
    filekey: string;
}): string;
