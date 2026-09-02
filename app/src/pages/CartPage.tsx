import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Minus, Plus, Trash2, Bike, Store } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useCart } from "@/lib/cart";
import { getToken } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/constants";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [remark, setRemark] = useState("");
  const [address, setAddress] = useState({
    contactName: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    detail: "",
  });

  const createOrder = trpc.order.create.useMutation({
    onSuccess: (order) => {
      cart.clear();
      toast.success(`${t("orderSuccess")}：${order.orderNo}`);
      navigate("/orders");
    },
    onError: (e) => {
      if (e.data?.code === "UNAUTHORIZED") {
        toast.error(t("needLogin"));
        navigate("/login");
      } else {
        toast.error(e.message);
      }
    },
  });

  const submit = () => {
    if (!getToken()) {
      toast.error(t("needLogin"));
      navigate("/login");
      return;
    }
    if (cart.lines.length === 0) return;
    if (fulfillment === "delivery") {
      const missing = Object.entries(address).find(([, v]) => !v.trim());
      if (missing) {
        toast.error(t("fillAddress"));
        return;
      }
    }
    createOrder.mutate({
      fulfillment,
      remark: remark || undefined,
      items: cart.lines.map((l) => ({ dishId: l.dishId, quantity: l.quantity })),
      address: fulfillment === "delivery" ? address : undefined,
    });
  };

  return (
    <div className="min-h-screen">
      <CustomerHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-3xl font-black tracking-wide">{t("cartTitle")}</h1>

        {cart.lines.length === 0 ? (
          <div className="mt-16 text-center text-muted-foreground">
            <p>{t("cartEmpty")}</p>
            <Button className="mt-4 rounded-full" asChild>
              <Link to="/">{t("goMenu")}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* 菜品明细 */}
            <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
              <h2 className="font-display text-lg font-bold">{t("dishDetails")}</h2>
              <ul className="mt-4 divide-y divide-border/60">
                {cart.lines.map((l) => (
                  <li key={l.dishId} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{l.name}</p>
                      <p className="text-sm text-muted-foreground">{formatPrice(l.price)} {t("perServing")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => cart.setQty(l.dishId, l.quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{l.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => cart.setQty(l.dishId, l.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <span className="w-20 text-right font-medium">{formatPrice(l.price * l.quantity)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => cart.remove(l.dishId)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end border-t border-border/60 pt-4">
                <p className="font-display text-xl font-black text-primary">
                  {t("total")} {formatPrice(cart.totalPrice)}
                </p>
              </div>
            </section>

            {/* 履约方式 */}
            <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
              <h2 className="font-display text-lg font-bold">{t("fulfillmentTitle")}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillment("delivery")}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-colors ${
                    fulfillment === "delivery"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Bike className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">{t("delivery")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillment("pickup")}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-colors ${
                    fulfillment === "pickup"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Store className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">{t("pickup")}</span>
                </button>
              </div>

              {fulfillment === "delivery" ? (
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t("contactName")} *</Label>
                    <Input value={address.contactName} onChange={(e) => setAddress({ ...address, contactName: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("phone")} *</Label>
                    <Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("province")} *</Label>
                    <Input value={address.province} onChange={(e) => setAddress({ ...address, province: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("city")} *</Label>
                    <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("district")} *</Label>
                    <Input value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("detailAddress")} *</Label>
                    <Input value={address.detail} onChange={(e) => setAddress({ ...address, detail: e.target.value })} placeholder={t("detailAddressPh")} />
                  </div>
                </div>
              ) : (
                <p className="mt-5 rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
                  {t("pickupHint")}
                </p>
              )}

              <div className="mt-5 space-y-1.5">
                <Label>{t("remark")}</Label>
                <Textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder={t("remarkPh")}
                  rows={2}
                />
              </div>
            </section>

            <Button
              size="lg"
              className="w-full rounded-full text-base"
              disabled={createOrder.isPending}
              onClick={submit}
            >
              {createOrder.isPending ? t("submitting") : `${t("submitOrder")} · ${formatPrice(cart.totalPrice)}`}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
