import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders } from "@db/schema";
import { requireCustomer } from "./auth";

/**
 * 支付模块（预留接口）。
 *
 * 按 SRS 第 6.2 节要求：初期使用「标记已付款 / 线下付款」，
 * 本模块预留第三方在线支付的接入点。接入时：
 * 1. 在环境变量中配置支付平台密钥（见 .env.example 中 PAYMENT_* 变量）；
 * 2. 在 createCheckout 中调用支付平台 SDK 创建支付单，返回跳转参数；
 * 3. 支付平台异步回调打到 /api/payment/callback（Hono 路由，见 api/boot.ts 注释），
 *    验签通过后调用本模块的 handlePaid(orderNo) 完成入账。
 */
export async function handlePaid(orderNo: string, transactionId?: string) {
  const db = getDb();
  const order = await db.query.orders.findFirst({ where: eq(orders.orderNo, orderNo) });
  if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
  if (order.paymentStatus === "unpaid") {
    await db
      .update(orders)
      .set({ paymentStatus: "paid", paidAt: new Date() })
      .where(eq(orders.id, order.id));
  }
  return { ok: true, transactionId };
}

export const paymentRouter = createRouter({
  /**
   * 创建支付会话（占位实现）。
   * 当前返回 mode: "manual"，前端引导顾客使用「标记已付款」；
   * 接入真实支付平台后，此处返回支付跳转 URL / 小程序参数即可。
   */
  createCheckout: publicQuery
    .input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const user = await requireCustomer(ctx);
      const order = await getDb().query.orders.findFirst({ where: eq(orders.id, input.orderId) });
      if (!order || order.userId !== user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
      }
      if (order.paymentStatus !== "unpaid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "该订单无需付款" });
      }
      // TODO: 接入线上支付平台 —— 在此调用平台 SDK 并返回 { mode: "redirect", payUrl }
      return {
        mode: "manual" as const,
        orderNo: order.orderNo,
        amount: order.totalAmount,
        message: "当前为线下付款模式：请线下转账后在订单详情点击「我已完成付款」。",
      };
    }),
});
