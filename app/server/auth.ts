import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { eq, and, gt } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { sessions, users, admins, type User, type Admin } from "@db/schema";
import type { TrpcContext } from "./context";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

/** 密码哈希（scrypt，格式：salt:hash） */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** 创建会话，返回明文 token（客户端保存于本地） */
export async function createSession(userType: "customer" | "admin", userId: number) {
  const token = randomBytes(32).toString("hex");
  await getDb().insert(sessions).values({
    token: sha256(token),
    userType,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export async function destroySession(token: string) {
  await getDb().delete(sessions).where(eq(sessions.token, sha256(token)));
}

function extractToken(ctx: TrpcContext): string {
  const header = ctx.req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "请先登录" });
  }
  return token;
}

async function findSession(ctx: TrpcContext) {
  const token = extractToken(ctx);
  const session = await getDb().query.sessions.findFirst({
    where: and(eq(sessions.token, sha256(token)), gt(sessions.expiresAt, new Date())),
  });
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "登录已过期，请重新登录" });
  }
  return { session, token };
}

/** 要求顾客登录 */
export async function requireCustomer(ctx: TrpcContext): Promise<User> {
  const { session } = await findSession(ctx);
  if (session.userType !== "customer") {
    throw new TRPCError({ code: "FORBIDDEN", message: "请使用顾客账号登录" });
  }
  const user = await getDb().query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!user || user.status !== "active") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "账号不可用" });
  }
  return user;
}

/** 要求管理员登录 */
export async function requireAdmin(ctx: TrpcContext): Promise<Admin> {
  const { session } = await findSession(ctx);
  if (session.userType !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理员权限" });
  }
  const admin = await getDb().query.admins.findFirst({ where: eq(admins.id, session.userId) });
  if (!admin) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "管理员账号不存在" });
  }
  return admin;
}

/** 退出登录 */
export async function logout(ctx: TrpcContext) {
  try {
    const { token } = await findSession(ctx);
    await destroySession(token);
  } catch {
    // 已失效的会话直接忽略
  }
  return { ok: true };
}
