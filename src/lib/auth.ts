import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { safeLog } from "./safe-logger";

const INSECURE_DEFAULT_SECRETS = [
  "jansahaya-v2-production-jwt-signing-secret-gov-jharkhand",
  "jansahaya-super-secret-jwt-key-sih-2024-gov-jharkhand",
  "generate-a-secure-random-32-character-secret-in-production",
  "secret",
  "default",
  "123456",
];

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim() || "";
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    const isBuildPhase =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.npm_lifecycle_event === "build" ||
      (typeof process.argv !== "undefined" && process.argv.some((a) => a.includes("build")));

    const isInsecure =
      !secret ||
      secret.length < 32 ||
      INSECURE_DEFAULT_SECRETS.some((insecure) => secret.toLowerCase().includes(insecure.toLowerCase()));

    if (isInsecure) {
      if (isBuildPhase) {
        return "jansahaya-build-phase-placeholder-secret-not-for-runtime-use-32chars";
      }
      const msg = "FATAL SECURITY ERROR: In production, a secure 32+ character random JWT_SECRET is required at runtime.";
      safeLog.error(msg);
      throw new Error(msg);
    }
    return secret;
  }

  // Development / Test mode fallback
  if (!secret) {
    return "jansahaya-dev-local-only-jwt-secret-key-32chars";
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  organization?: string;
  district?: string;
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  if (!plainText || !hashed) return false;
  return bcrypt.compare(plainText, hashed);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    }) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("jansahaya_token")?.value;
    if (!token) return null;
    return decodeToken(token);
  } catch {
    return null;
  }
}

export async function getUserFromRequest(request: Request): Promise<TokenPayload | null> {
  try {
    // 1. Check Authorization header
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const decoded = decodeToken(token);
      if (decoded) return decoded;
    }

    // 2. Check cookies
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/jansahaya_token=([^;]+)/);
      if (match && match[1]) {
        return decodeToken(decodeURIComponent(match[1].trim()));
      }
    }

    return null;
  } catch {
    return null;
  }
}
