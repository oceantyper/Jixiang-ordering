import { ORDER_STATUS, PAYMENT_STATUS, type OrderStatusKey, type PaymentStatusKey } from "@/lib/constants";
import { localizedOrderStatus, localizedPaymentStatus, useI18n } from "@/lib/i18n";

export function OrderStatusBadge({ status }: { status: string }) {
  const { lang } = useI18n();
  const conf = ORDER_STATUS[status as OrderStatusKey] ?? { color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color: conf.color, backgroundColor: conf.bg }}
    >
      {localizedOrderStatus(status, lang)}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const { lang } = useI18n();
  const conf = PAYMENT_STATUS[status as PaymentStatusKey] ?? { color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color: conf.color, backgroundColor: conf.bg }}
    >
      {localizedPaymentStatus(status, lang)}
    </span>
  );
}

export function TagPill({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  );
}
