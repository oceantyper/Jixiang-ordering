import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, admins } from "@db/schema";
import {
  hashPassword,
  verifyPassword,
  createSession,
  requireCustomer,
  requireAdmin,
  logout,
} from "./auth";

const passwordSchema = z.string().min(6, "密码至少 6 位");

export const authRouter = createRouter({
  /** 顾客注册（邮箱 + 密码） */
  register: publicQuery
    .input(
      z.object({
        email: z.string().email("邮箱格式不正确"),
        password: passwordSchema,
        name: z.string().max(64).optional(),
        phone: z.string().max(32).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const email = input.email.trim().toLowerCase();
      const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "该邮箱已注册" });
      }
      const [{ id }] = await db
        .insert(users)
        .values({
          email,
          passwordHash: hashPassword(input.password),
          name: input.name || null,
          phone: input.phone || null,
        })
        .$returningId();
      const token = await createSession("customer", id);
      return { token, user: { id, email, name: input.name ?? null, phone: input.phone ?? null } };
    }),

  /** 顾客登录 */
  login: publicQuery
    .input(z.object({ email: z.string().email("邮箱格式不正确"), password: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const email = input.email.trim().toLowerCase();
      const user = await getDb().query.users.findFirst({ where: eq(users.email, email) });
      if (!user || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "邮箱或密码错误" });
      }
      if (user.status !== "active") {
        throw new TRPCError({ code: "FORBIDDEN", message: "账号已被禁用" });
      }
      const token = await createSession("customer", user.id);
      return {
        token,
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
      };
    }),

  /** 管理员登录（独立入口） */
  adminLogin: publicQuery
    .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const admin = await getDb().query.admins.findFirst({
        where: eq(admins.username, input.username.trim()),
      });
      if (!admin || !verifyPassword(input.password, admin.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "用户名或密码错误" });
      }
      const token = await createSession("admin", admin.id);
      return { token, admin: { id: admin.id, username: admin.username, role: admin.role } };
    }),

  /** 当前登录信息（顾客或管理员通用） */
  me: publicQuery.query(async ({ ctx }) => {
    try {
      const user = await requireCustomer(ctx);
      return { type: "customer" as const, id: user.id, email: user.email, name: user.name, phone: user.phone };
    } catch {
      const admin = await requireAdmin(ctx);
      return { type: "admin" as const, id: admin.id, username: admin.username, role: admin.role };
    }
  }),

  logout: publicQuery.mutation(({ ctx }) => logout(ctx)),
});
