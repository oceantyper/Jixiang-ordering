/** 订单状态 / 付款状态 / 履约方式 的中文标签与配色（全局统一） */

export const ORDER_STATUS = {
  pending: { label: "待确认", color: "#B45309", bg: "#FEF3C7" },
  preparing: { label: "备餐中", color: "#1D4ED8", bg: "#DBEAFE" },
  awaiting_pickup: { label: "待自取", color: "#6D28D9", bg: "#EDE9FE" },
  delivering: { label: "配送中", color: "#0E7490", bg: "#CFFAFE" },
  completed: { label: "已完成", color: "#15803D", bg: "#DCFCE7" },
  cancelled: { label: "已取消", color: "#6B7280", bg: "#F3F4F6" },
} as const;

export const PAYMENT_STATUS = {
  unpaid: { label: "待付款", color: "#B45309", bg: "#FEF3C7" },
  paid: { label: "已付款", color: "#15803D", bg: "#DCFCE7" },
  refunded: { label: "已退款", color: "#B91C1C", bg: "#FEE2E2" },
} as const;

export const FULFILLMENT = {
  delivery: "外卖送上门",
  pickup: "到店自取",
} as const;

export type OrderStatusKey = keyof typeof ORDER_STATUS;
export type PaymentStatusKey = keyof typeof PAYMENT_STATUS;

export function formatPrice(v: string | number): string {
  return `¥${Number(v).toFixed(2)}`;
}

export function formatTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
