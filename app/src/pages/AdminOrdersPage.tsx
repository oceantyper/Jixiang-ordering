import { useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { FULFILLMENT, ORDER_STATUS, PAYMENT_STATUS, formatPrice, formatTime } from "@/lib/constants";
import { AdminLayout } from "@/components/AdminLayout";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AdminOrder = {
  id: number;
  orderNo: string;
  fulfillment: "delivery" | "pickup";
  status: keyof typeof ORDER_STATUS;
  paymentStatus: keyof typeof PAYMENT_STATUS;
  totalAmount: string;
  remark: string | null;
  createdAt: Date;
  paidAt: Date | null;
  items: { id: number; dishName: string; quantity: number; unitPrice: string; subtotal: string }[];
  address: {
    contactName: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    detail: string;
  } | null;
  user: { email: string; name: string | null; phone: string | null } | null;
};

/** 下一步可执行的状态操作 */
function nextActions(order: AdminOrder): { status: keyof typeof ORDER_STATUS; label: string; variant: "default" | "outline" | "destructive" }[] {
  switch (order.status) {
    case "pending":
      return [
        { status: "preparing", label: "确认接单", variant: "default" },
        { status: "cancelled", label: "取消订单", variant: "destructive" },
      ];
    case "preparing":
      return order.fulfillment === "pickup"
        ? [
            { status: "awaiting_pickup", label: "备餐完成，待自取", variant: "default" },
            { status: "cancelled", label: "取消订单", variant: "destructive" },
          ]
        : [
            { status: "delivering", label: "开始配送", variant: "default" },
            { status: "cancelled", label: "取消订单", variant: "destructive" },
          ];
    case "awaiting_pickup":
      return [{ status: "completed", label: "顾客已取餐，完成订单", variant: "default" }];
    case "delivering":
      return [{ status: "completed", label: "送达，完成订单", variant: "default" }];
    default:
      return [];
  }
}

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [payFilter, setPayFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    order: AdminOrder;
    status: keyof typeof ORDER_STATUS;
    label: string;
  } | null>(null);

  const utils = trpc.useUtils();
  const orders = trpc.order.adminList.useQuery(
    {
      status: statusFilter === "all" ? undefined : (statusFilter as keyof typeof ORDER_STATUS),
      paymentStatus: payFilter === "all" ? undefined : (payFilter as keyof typeof PAYMENT_STATUS),
    },
    { refetchInterval: 10_000 },
  );

  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("订单状态已更新");
      utils.order.adminList.invalidate();
      setPendingAction(null);
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });
  const updatePayment = trpc.order.updatePayment.useMutation({
    onSuccess: () => {
      toast.success("付款状态已更新");
      utils.order.adminList.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const list = (orders.data ?? []) as unknown as AdminOrder[];
  const newCount = useMemo(() => list.filter((o) => o.status === "pending").length, [list]);

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-black tracking-wide">订单管理</h1>
        {newCount > 0 && (
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            {newCount} 个新订单待确认
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="订单状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {Object.entries(ORDER_STATUS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={payFilter} onValueChange={setPayFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="付款状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部付款状态</SelectItem>
              {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {orders.isLoading ? (
        <p className="mt-16 text-center text-muted-foreground">加载中…</p>
      ) : list.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">暂无符合条件的订单</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((o) => (
            <li
              key={o.id}
              className={`rounded-2xl border bg-card p-4 sm:p-5 ${
                o.status === "pending" ? "border-primary/50" : "border-border/60"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-medium">#{o.orderNo}</span>
                <OrderStatusBadge status={o.status} />
                <PaymentStatusBadge status={o.paymentStatus} />
                <span className="text-xs text-muted-foreground">
                  {FULFILLMENT[o.fulfillment]} · {formatTime(o.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm">
                <span className="text-muted-foreground">顾客：</span>
                {o.user?.name || o.user?.email || "—"}
                {o.user?.phone ? `（${o.user.phone}）` : ""}
              </p>
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                {o.items.map((i) => `${i.dishName}×${i.quantity}`).join("、")}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="mr-auto font-display text-lg font-bold text-primary">
                  {formatPrice(o.totalAmount)}
                </span>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setSelected(o)}>
                  详情
                </Button>
                {o.paymentStatus === "unpaid" && o.status !== "cancelled" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => updatePayment.mutate({ id: o.id, paymentStatus: "paid" })}
                  >
                    标记已收款
                  </Button>
                )}
                {nextActions(o).map((a) => (
                  <Button
                    key={a.status}
                    size="sm"
                    variant={a.variant}
                    className="rounded-full"
                    onClick={() => setPendingAction({ order: o, status: a.status, label: a.label })}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 订单详情 */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">订单 #{selected.orderNo}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <OrderStatusBadge status={selected.status} />
                  <PaymentStatusBadge status={selected.paymentStatus} />
                  <span className="text-muted-foreground">{FULFILLMENT[selected.fulfillment]}</span>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3">
                  <p className="font-medium">顾客信息</p>
                  <p className="mt-1 text-muted-foreground">
                    {selected.user?.name || "—"} · {selected.user?.email}
                    {selected.user?.phone ? ` · ${selected.user.phone}` : ""}
                  </p>
                </div>
                <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
                  {selected.items.map((i) => (
                    <li key={i.id} className="flex justify-between px-3 py-2">
                      <span>
                        {i.dishName} <span className="text-muted-foreground">×{i.quantity}</span>
                      </span>
                      <span>{formatPrice(i.subtotal)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between px-3 py-2 font-bold">
                    <span>合计</span>
                    <span className="text-primary">{formatPrice(selected.totalAmount)}</span>
                  </li>
                </ul>
                {selected.address && (
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <p className="font-medium">配送地址</p>
                    <p className="mt-1 text-muted-foreground">
                      {selected.address.province}
                      {selected.address.city}
                      {selected.address.district}
                      {selected.address.detail}
                    </p>
                    <p className="text-muted-foreground">
                      {selected.address.contactName} · {selected.address.phone}
                    </p>
                  </div>
                )}
                {selected.remark && <p className="text-muted-foreground">备注：{selected.remark}</p>}
                <p className="text-xs text-muted-foreground">
                  下单：{formatTime(selected.createdAt)}
                  {selected.paidAt && ` · 付款：${formatTime(selected.paidAt)}`}
                </p>

                {/* 付款状态管理 */}
                <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
                  <span className="w-full text-xs font-medium text-muted-foreground">付款状态管理：</span>
                  {selected.paymentStatus !== "paid" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => updatePayment.mutate({ id: selected.id, paymentStatus: "paid" })}
                    >
                      标记已付款
                    </Button>
                  )}
                  {selected.paymentStatus === "paid" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => updatePayment.mutate({ id: selected.id, paymentStatus: "unpaid" })}
                      >
                        退回待付款
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-destructive"
                        onClick={() => updatePayment.mutate({ id: selected.id, paymentStatus: "refunded" })}
                      >
                        标记已退款
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 状态变更确认 */}
      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          {pendingAction && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>确认操作</AlertDialogTitle>
                <AlertDialogDescription>
                  确定对订单 #{pendingAction.order.orderNo} 执行「{pendingAction.label}」吗？
                  {pendingAction.status === "delivering" && pendingAction.order.address && (
                    <span className="mt-2 block">
                      配送地址：{pendingAction.order.address.province}
                      {pendingAction.order.address.city}
                      {pendingAction.order.address.district}
                      {pendingAction.order.address.detail}（{pendingAction.order.address.contactName} {pendingAction.order.address.phone}）
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  disabled={updateStatus.isPending}
                  onClick={() =>
                    updateStatus.mutate({ id: pendingAction.order.id, status: pendingAction.status })
                  }
                >
                  确认
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
