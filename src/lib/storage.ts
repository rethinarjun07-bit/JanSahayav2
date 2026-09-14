import fs from "fs";
import path from "path";
import crypto from "crypto";
import { safeLog } from "./safe-logger";

export interface StorageUploadResult {
  url: string;
  filename: string;
  provider: "local" | "s3" | "vercel-blob" | "ephemeral-tmp";
  sizeBytes: number;
}

export interface StorageProvider {
  save(buffer: Buffer, safeFilename: string, mimeType: string): Promise<StorageUploadResult>;
}

// ---------------------------------------------------------------------------
// 1. Local Filesystem Provider (Local development default)
// ---------------------------------------------------------------------------
class LocalDiskStorageProvider implements StorageProvider {
  async save(buffer: Buffer, safeFilename: string, _mimeType: string): Promise<StorageUploadResult> {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    // On Vercel / serverless runtimes, public/ is read-only.
    // Use /tmp as an ephemeral fallback if cloud credentials are not yet supplied.
    const baseDir = isServerless
      ? path.resolve("/tmp", "jansahaya-uploads")
      : path.resolve(process.cwd(), "public", "uploads");

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    const targetPath = path.resolve(baseDir, safeFilename);

    // Strict path traversal containment check
    if (!targetPath.startsWith(baseDir)) {
      throw new Error("Security Error: Path traversal attempt detected.");
    }

    fs.writeFileSync(targetPath, buffer);

    // If writing to local public/uploads, serve via /uploads/<filename>
    // If running in ephemeral serverless fallback without S3, note provider
    const url = isServerless
      ? `/api/upload/file?file=${encodeURIComponent(safeFilename)}`
      : `/uploads/${safeFilename}`;

    return {
      url,
      filename: safeFilename,
      provider: isServerless ? "ephemeral-tmp" : "local",
      sizeBytes: buffer.length,
    };
  }
}

// ---------------------------------------------------------------------------
// 2. S3-Compatible Object Storage Provider (AWS S3, Cloudflare R2, Supabase)
// Implements AWS Signature Version 4 without requiring heavy aws-sdk packages
// ---------------------------------------------------------------------------
class S3CompatibleStorageProvider implements StorageProvider {
  private endpoint: string;
  private bucket: string;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private publicUrlBase: string;

  constructor() {
    this.endpoint = (process.env.S3_ENDPOINT || "").trim().replace(/\/$/, "");
    this.bucket = (process.env.S3_BUCKET || "").trim();
    this.region = (process.env.S3_REGION || "us-east-1").trim();
    this.accessKeyId = (process.env.S3_ACCESS_KEY_ID || "").trim();
    this.secretAccessKey = (process.env.S3_SECRET_ACCESS_KEY || "").trim();
    this.publicUrlBase = (process.env.S3_PUBLIC_URL || "").trim().replace(/\/$/, "");
  }

  private hmac(key: Buffer | string, data: string): Buffer {
    return crypto.createHmac("sha256", key).update(data, "utf8").digest();
  }

  private hash(data: Buffer | string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  async save(buffer: Buffer, safeFilename: string, mimeType: string): Promise<StorageUploadResult> {
    if (!this.bucket || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error(
        "S3 Storage is selected but S3_BUCKET, S3_ACCESS_KEY_ID, or S3_SECRET_ACCESS_KEY is missing."
      );
    }

    const date = new Date();
    const dateStamp = date.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 8); // YYYYMMDD
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, ""); // YYYYMMDDTHHMMSSZ

    // Construct target URL
    const host = this.endpoint
      ? new URL(this.endpoint).host
      : `${this.bucket}.s3.${this.region}.amazonaws.com`;

    const requestUrl = this.endpoint
      ? `${this.endpoint}/${this.bucket}/${safeFilename}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${safeFilename}`;

    const canonicalUri = this.endpoint ? `/${this.bucket}/${safeFilename}` : `/${safeFilename}`;
    const payloadHash = this.hash(buffer);

    const canonicalHeaders =
      `content-type:${mimeType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;

    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest = [
      "PUT",
      canonicalUri,
      "", // Query string
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      this.hash(canonicalRequest),
    ].join("\n");

    // Calculate signature
    const kDate = this.hmac(`AWS4${this.secretAccessKey}`, dateStamp);
    const kRegion = this.hmac(kDate, this.region);
    const kService = this.hmac(kRegion, "s3");
    const kSigning = this.hmac(kService, "aws4_request");
    const signature = crypto.createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(requestUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        Authorization: authorization,
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`S3 Object Storage Upload failed (${response.status}): ${errorText.slice(0, 200)}`);
    }

    const publicUrl = this.publicUrlBase
      ? `${this.publicUrlBase}/${safeFilename}`
      : requestUrl;

    return {
      url: publicUrl,
      filename: safeFilename,
      provider: "s3",
      sizeBytes: buffer.length,
    };
  }
}

// ---------------------------------------------------------------------------
// 3. Vercel Blob Storage Provider
// Works when BLOB_READ_WRITE_TOKEN is configured in Vercel project settings
// ---------------------------------------------------------------------------
class VercelBlobStorageProvider implements StorageProvider {
  private token: string;

  constructor() {
    this.token = (process.env.BLOB_READ_WRITE_TOKEN || "").trim();
  }

  async save(buffer: Buffer, safeFilename: string, mimeType: string): Promise<StorageUploadResult> {
    if (!this.token) {
      throw new Error("Vercel Blob is selected but BLOB_READ_WRITE_TOKEN is not configured.");
    }

    // Direct HTTP call to Vercel Blob API
    const response = await fetch(`https://blob.vercel-storage.com/${safeFilename}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "x-api-version": "7",
        "x-content-type": mimeType,
        "x-add-random-suffix": "false",
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      throw new Error(`Vercel Blob upload failed (${response.status}): ${err}`);
    }

    const data = (await response.json()) as { url: string };

    return {
      url: data.url,
      filename: safeFilename,
      provider: "vercel-blob",
      sizeBytes: buffer.length,
    };
  }
}

// ---------------------------------------------------------------------------
// Storage Factory & Dispatcher
// ---------------------------------------------------------------------------
export function getStorageProvider(): StorageProvider {
  const configuredProvider = (process.env.STORAGE_PROVIDER || "").toLowerCase().trim();

  if (configuredProvider === "s3" || process.env.S3_BUCKET) {
    return new S3CompatibleStorageProvider();
  }

  if (
    configuredProvider === "blob" ||
    configuredProvider === "vercel-blob" ||
    process.env.BLOB_READ_WRITE_TOKEN
  ) {
    return new VercelBlobStorageProvider();
  }

  // Default to local filesystem provider (with serverless /tmp fallback)
  return new LocalDiskStorageProvider();
}

/**
 * High-level helper to securely persist an uploaded file.
 */
export async function saveUploadedFile(
  buffer: Buffer,
  safeFilename: string,
  mimeType: string
): Promise<StorageUploadResult> {
  const provider = getStorageProvider();
  try {
    return await provider.save(buffer, safeFilename, mimeType);
  } catch (error) {
    safeLog.error("Storage Provider Upload Error:", error);
    throw error;
  }
}
