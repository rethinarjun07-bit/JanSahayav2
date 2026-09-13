import { NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory token store with periodic automatic cleanup
const store = new Map<string, RateLimitRecord>();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  keyPrefix: string;
  limit: number;
  windowMs: number; // e.g. 60 * 1000 (1 minute)
}

const IPV4_REGEX = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
const IPV6_REGEX = /^[0-9a-fA-F:]+$/;

export function getClientIp(request: Request): string {
  // Trust proxy order: Cloudflare -> True-Client-IP -> X-Real-IP -> X-Forwarded-For
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp && (IPV4_REGEX.test(cfIp) || IPV6_REGEX.test(cfIp))) return cfIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && (IPV4_REGEX.test(realIp) || IPV6_REGEX.test(realIp))) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const candidate = forwarded.split(",")[0].trim();
    if (IPV4_REGEX.test(candidate) || IPV6_REGEX.test(candidate)) {
      return candidate;
    }
  }

  return "127.0.0.1";
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const key = `${options.keyPrefix}:${identifier}`;
  const record = store.get(key);

  if (!record || now > record.resetTime) {
    store.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: Math.ceil((now + options.windowMs) / 1000),
    };
  }

  if (record.count >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: Math.ceil(record.resetTime / 1000),
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.count,
    reset: Math.ceil(record.resetTime / 1000),
  };
}

export function createRateLimitResponse(resetEpochSec: number, customMessage?: string): NextResponse {
  const retryAfter = Math.max(1, resetEpochSec - Math.floor(Date.now() / 1000));
  return NextResponse.json(
    {
      error: customMessage || "Too many requests. Please slow down and try again later.",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(resetEpochSec),
      },
    }
  );
}

// Preset configurations for sensitive application surfaces
export const RATE_LIMIT_BUCKETS = {
  // Auth: 10 attempts per 15 minutes
  AUTH: { keyPrefix: "rl:auth", limit: 10, windowMs: 15 * 60 * 1000 },
  // AI Copilot & Voice: 20 calls/min authenticated, 10 calls/min unauthenticated
  AI_AUTHED: { keyPrefix: "rl:ai:auth", limit: 20, windowMs: 60 * 1000 },
  AI_ANON: { keyPrefix: "rl:ai:anon", limit: 10, windowMs: 60 * 1000 },
  // File Upload: 10 uploads per 10 minutes
  UPLOAD: { keyPrefix: "rl:upload", limit: 10, windowMs: 10 * 60 * 1000 },
  // Report Submission: 10 submissions per 10 minutes
  CHALLENGE_CREATE: { keyPrefix: "rl:ch_create", limit: 10, windowMs: 10 * 60 * 1000 },
  // Social Interactions (Comments & Upvotes): 30 per minute
  INTERACTION: { keyPrefix: "rl:social", limit: 30, windowMs: 60 * 1000 },
  // Duplicate Search: 30 queries per minute
  SEARCH: { keyPrefix: "rl:search", limit: 30, windowMs: 60 * 1000 },
};
