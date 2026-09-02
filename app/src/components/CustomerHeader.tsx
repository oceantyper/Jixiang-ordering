import { Link, useNavigate } from "react-router";
import { ShoppingCart, UserRound, LogOut, ClipboardList, Globe } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { getToken, clearToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function CustomerHeader() {
  const navigate = useNavigate();
  const { totalCount } = useCart();
  const { lang, setLang, t } = useI18n();
  const hasToken = !!getToken();
  const me = trpc.auth.me.useQuery(undefined, { enabled: hasToken, retry: false });
  const utils = trpc.useUtils();
  const logout = trpc.auth.logout.useMutation({
    onSettled: () => {
      clearToken();
      utils.auth.me.reset();
      navigate("/");
    },
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4">
        <Link to="/" className="flex shrink-0 items-baseline gap-2">
          <span className="font-display text-xl font-black tracking-wide text-primary sm:text-2xl">吉祥</span>
          <span className="hidden text-xs tracking-[0.3em] text-muted-foreground sm:inline">
            {t("restaurantSub")}
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-0.5 sm:gap-2">
          <Button variant="ghost" size="sm" asChild className="px-2 sm:px-3">
            <Link to="/orders">
              <ClipboardList className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t("myOrders")}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="relative px-2 sm:px-3" asChild>
            <Link to="/cart">
              <ShoppingCart className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t("cart")}</span>
              {totalCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {totalCount}
                </span>
              )}
            </Link>
          </Button>
          {me.data?.type === "customer" ? (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <span className="hidden max-w-28 truncate text-sm text-muted-foreground md:inline">
                {me.data.type === "customer" ? me.data.name || me.data.email : ""}
              </span>
              <Button variant="ghost" size="sm" className="px-2 sm:px-3" onClick={() => logout.mutate()}>
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("logout")}</span>
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild className="px-2 sm:px-3">
              <Link to="/login">
                <UserRound className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("login")}</span>
              </Link>
            </Button>
          )}
          {/* 语言切换：导航最右侧 */}
          <button
            onClick={() => setLang(lang === "zh" ? "ru" : "zh")}
            className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label="Switch language / Сменить язык"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "zh" ? "RU" : "中文"}
          </button>
        </nav>
      </div>
    </header>
  );
}
