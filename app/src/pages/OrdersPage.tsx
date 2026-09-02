import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { getToken } from "@/lib/auth";
import { formatPrice, formatTime } from "@/lib/constants";
import { localizedFulfillment, useI18n } from "@/lib/i18n";
import { CustomerHeader } from "@/components/CustomerHeader";
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

type OrderRow = {
  id: number;
  orderNo: string;
  fulfillment: "delivery" | "pickup";
  status: string;
  paymentStatus: string;
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
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { lang, t } = useI18n();
  const hasToken = !!getToken();
  const orders = trpc.order.mine.useQuery(undefined, {
    enabled: hasToken,
    retry: false,
    refetchInterval: 15_000, // 准实时刷新订单状态
  });
  const utils = trpc.useUtils();
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [confirmPay, setConfirmPay] = useState<OrderRow | null>(null);

  const checkout = trpc.payment.createCheckout.useMutation();
  const markPaid = trpc.order.markPaid.useMutation({
    onSuccess: () => {
      toast.success(t("paidMarked"));
      utils.order.mine.invalidate();
      setConfirmPay(null);
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  if (!hasToken) {
    return (
      <div className="min-h-screen">
        <CustomerHeader />
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <p className="text-muted-foreground">{t("loginToView")}</p>
          <Button className="mt-4 rounded-full" onClick={() => navigate("/login")}>
            {t("goLogin")}
          </Button>
        </div>
      </div>
    );
  }

  const pay = (order: OrderRow) => {
    checkout.mutate(
      { orderId: order.id },
      {
        onSuccess: (res) => {
          if (res.mode === "manual") {
            setConfirmPay(order);
          }
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="min-h-screen">
      <CustomerHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-3xl font-black tracking-wide">{t("ordersTitle")}</h1>

        {orders.isLoading ? (
          <p className="mt-16 text-center text-muted-foreground">{t("loading")}</p>
        ) : (orders.data ?? []).length === 0 ? (
          <div className="mt-16 text-center text-muted-foreground">
            <p>{t("noOrders")}</p>
            <Button className="mt-4 rounded-full" asChild>
              <Link to="/">{t("goOrder")}</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {(orders.data as OrderRow[]).map((o) => (
              <li key={o.id} className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-medium">#{o.orderNo}</span>
                  <OrderStatusBadge status={o.status} />
                  <PaymentStatusBadge status={o.paymentStatus} />
                  <span className="text-xs text-muted-foreground">
                    {localizedFulfillment(o.fulfillment, lang)} · {formatTime(o.createdAt)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                  {o.items.map((i) => `${i.dishName}×${i.quantity}`).join("、")}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-primary">
                    {formatPrice(o.totalAmount)}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => setSelected(o)}>
                      {t("viewDetail")}
                    </Button>
                    {o.paymentStatus === "unpaid" && o.status !== "cancelled" && (
                      <Button size="sm" className="rounded-full" onClick={() => pay(o)}>
                        {t("goPay")}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* 订单详情 */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{t("orderNo")} #{selected.orderNo}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <OrderStatusBadge status={selected.status} />
                  <PaymentStatusBadge status={selected.paymentStatus} />
                  <span className="text-muted-foreground">{localizedFulfillment(selected.fulfillment, lang)}</span>
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
                    <span>{t("total")}</span>
                    <span className="text-primary">{formatPrice(selected.totalAmount)}</span>
                  </li>
                </ul>
                {selected.address && (
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <p className="font-medium">{t("addressTitle")}</p>
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
                {selected.remark && <p className="text-muted-foreground">{t("remarkLabel")}：{selected.remark}</p>}
                <p className="text-xs text-muted-foreground">
                  {t("orderedAt")}：{formatTime(selected.createdAt)}
                  {selected.paidAt && ` · ${t("paidAtLabel")}：${formatTime(selected.paidAt)}`}
                </p>
                {selected.paymentStatus === "unpaid" && selected.status !== "cancelled" && (
                  <Button className="w-full rounded-full" onClick={() => pay(selected)}>
                    {t("goPay")}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 线下付款确认 */}
      <AlertDialog open={!!confirmPay} onOpenChange={(open) => !open && setConfirmPay(null)}>
        <AlertDialogContent>
          {confirmPay && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("confirmPayTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("confirmPayDesc")}{" "}
                  <span className="font-bold text-primary">{formatPrice(confirmPay.totalAmount)}</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("thinkAgain")}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={markPaid.isPending}
                  onClick={() => markPaid.mutate({ id: confirmPay.id })}
                >
                  {t("iHavePaid")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
