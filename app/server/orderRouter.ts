import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, orderItems, addresses, dishes, type Order } from "@db/schema";
import { requireCustomer, requireAdmin } from "./auth";

const orderStatusEnum = z.enum([
  "pending",
  "preparing",
  "awaiting_pickup",
  "delivering",
  "completed",
  "cancelled",
]);

function genOrderNo(): string {
  const now = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `JX${stamp}${rand}`;
}

/** 合法状态流转（管理员操作） */
const ALLOWED_TRANSITIONS: Record<Order["status"], Order["status"][]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["awaiting_pickup", "delivering", "cancelled"],
  awaiting_pickup: ["completed", "cancelled"],
  delivering: ["completed"],
  completed: [],
  cancelled: [],
};

async function loadOrderDetail(orderId: number) {
  const db = getDb();
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true, address: true, user: true },
  });
  if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
  const { user, ...rest } = order;
  return {
    ...rest,
    customer: user
      ? { id: user.id, email: user.email, name: user.name, phone: user.phone }
      : null,
  };
}

export const orderRouter = createRouter({
  /** 顾客下单（服务端按当前菜价计算金额，已下单订单不受改价影响） */
  create: publicQuery
    .input(
      z.object({
        fulfillment: z.enum(["delivery", "pickup"]),
        remark: z.string().max(500).optional(),
        items: z
          .array(
            z.object({
              dishId: z.number().int().positive(),
              quantity: z.number().int().min(1).max(99),
            }),
          )
          .min(1, "购物车不能为空"),
        address: z
          .object({
            contactName: z.string().min(1, "请填写联系人").max(64),
            phone: z.string().min(1, "请填写联系电话").max(32),
            province: z.string().min(1, "请填写省份").max(64),
            city: z.string().min(1, "请填写城市").max(64),
            district: z.string().min(1, "请填写区/县").max(64),
            detail: z.string().min(1, "请填写详细地址").max(255),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await requireCustomer(ctx);
      if (input.fulfillment === "delivery" && !input.address) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "外卖订单需填写配送地址" });
      }
      const db = getDb();

      // 校验菜品并按数据库当前价格计算
      const lines: { dishId: number; name: string; quantity: number; unitPrice: number }[] = [];
      for (const item of input.items) {
        const dish = await db.query.dishes.findFirst({ where: eq(dishes.id, item.dishId) });
        if (!dish || !dish.isAvailable) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "部分菜品已下架，请刷新菜单" });
        }
        lines.push({
          dishId: dish.id,
          name: dish.name,
          quantity: item.quantity,
          unitPrice: Number(dish.price),
        });
      }
      const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

      const orderId = await db.transaction(async (tx) => {
        const [{ id }] = await tx
          .insert(orders)
          .values({
            orderNo: genOrderNo(),
            userId: user.id,
            fulfillment: input.fulfillment,
            status: "pending",
            paymentStatus: "unpaid",
            totalAmount: total.toFixed(2),
            remark: input.remark ?? null,
          })
          .$returningId();
        await tx.insert(orderItems).values(
          lines.map((l) => ({
            orderId: id,
            dishId: l.dishId,
            dishName: l.name,
            quantity: l.quantity,
            unitPrice: l.unitPrice.toFixed(2),
            subtotal: (l.unitPrice * l.quantity).toFixed(2),
          })),
        );
        if (input.fulfillment === "delivery" && input.address) {
          await tx.insert(addresses).values({ orderId: id, ...input.address });
        }
        return id;
      });

      const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
      return { id: orderId, orderNo: order!.orderNo, totalAmount: order!.totalAmount };
    }),

  /** 顾客：我的订单列表 */
  mine: publicQuery.query(async ({ ctx }) => {
    const user = await requireCustomer(ctx);
    const db = getDb();
    const rows = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      orderBy: [desc(orders.createdAt)],
      with: { items: true, address: true },
    });
    return rows;
  }),

  /** 顾客：订单详情（仅限本人） */
  detail: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const user = await requireCustomer(ctx);
      const detail = await loadOrderDetail(input.id);
      if (detail.userId !== user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "无权查看该订单" });
      }
      return detail;
    }),

  /** 顾客：标记已付款（初期线下付款方式，后续可接第三方支付回调） */
  markPaid: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const user = await requireCustomer(ctx);
      const db = getDb();
      const order = await db.query.orders.findFirst({ where: eq(orders.id, input.id) });
      if (!order || order.userId !== user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
      }
      if (order.paymentStatus !== "unpaid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "该订单已付款或已退款" });
      }
      if (order.status === "cancelled") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "订单已取消，无法付款" });
      }
      await db
        .update(orders)
        .set({ paymentStatus: "paid", paidAt: new Date() })
        .where(eq(orders.id, order.id));
      return { ok: true };
    }),

  // ---------- 管理员 ----------

  /** 管理员：订单列表（按状态/付款状态筛选） */
  adminList: publicQuery
    .input(
      z
        .object({
          status: orderStatusEnum.optional(),
          paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      await requireAdmin(ctx);
      const db = getDb();
      const conditions = [];
      if (input?.status) conditions.push(eq(orders.status, input.status));
      if (input?.paymentStatus) conditions.push(eq(orders.paymentStatus, input.paymentStatus));
      return db.query.orders.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(orders.createdAt)],
        with: { items: true, address: true, user: true },
      });
    }),

  /** 管理员：更新订单状态（校验流转合法性） */
  updateStatus: publicQuery
    .input(z.object({ id: z.number().int().positive(), status: orderStatusEnum }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx);
      const db = getDb();
      const order = await db.query.orders.findFirst({ where: eq(orders.id, input.id) });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
      const allowed = ALLOWED_TRANSITIONS[order.status];
      if (!allowed.includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `订单当前状态不允许变更为该状态`,
        });
      }
      // 自取订单不能进入「配送中」，外卖订单不能进入「待自取」
      if (input.status === "delivering" && order.fulfillment !== "delivery") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "自取订单无需配送" });
      }
      if (input.status === "awaiting_pickup" && order.fulfillment !== "pickup") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "外卖订单请更新为「配送中」" });
      }
      await db.update(orders).set({ status: input.status }).where(eq(orders.id, order.id));
      return { ok: true };
    }),

  /** 管理员：付款状态管理（标记已付款 / 退回待付款 / 标记退款） */
  updatePayment: publicQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        paymentStatus: z.enum(["unpaid", "paid", "refunded"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx);
      const db = getDb();
      const order = await db.query.orders.findFirst({ where: eq(orders.id, input.id) });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
      await db
        .update(orders)
        .set({
          paymentStatus: input.paymentStatus,
          paidAt: input.paymentStatus === "paid" ? (order.paidAt ?? new Date()) : null,
        })
        .where(eq(orders.id, order.id));
      return { ok: true };
    }),
});
