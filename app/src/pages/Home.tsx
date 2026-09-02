import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/constants";
import { CustomerHeader } from "@/components/CustomerHeader";
import { DishImage } from "@/components/DishImage";
import { TagPill } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_ORDER = ["汤类", "俄式主菜", "中式热菜", "凉菜小吃", "主食", "甜品饮品"];

type Dish = {
  id: number;
  name: string;
  nameRu: string | null;
  description: string | null;
  descriptionRu: string | null;
  price: string;
  category: string;
  imageUrl: string | null;
  tags: { id: number; name: string; color: string }[];
};

export default function Home() {
  const menu = trpc.menu.list.useQuery(undefined, { refetchInterval: 60_000 });
  const tags = trpc.menu.tags.useQuery();
  const cart = useCart();
  const navigate = useNavigate();
  const { lang, t, categoryName, tagName, dishName, dishDesc } = useI18n();
  const [activeTag, setActiveTag] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const dishes = useMemo(() => {
    const all = (menu.data ?? []) as Dish[];
    return activeTag === null ? all : all.filter((d) => d.tags.some((tg) => tg.id === activeTag));
  }, [menu.data, activeTag]);

  const grouped = useMemo(() => {
    const map = new Map<string, Dish[]>();
    for (const d of dishes) {
      const arr = map.get(d.category) ?? [];
      arr.push(d);
      map.set(d.category, arr);
    }
    const orderedKeys = [
      ...CATEGORY_ORDER.filter((c) => map.has(c)),
      ...[...map.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
    ];
    return orderedKeys.map((k) => [k, map.get(k)!] as const);
  }, [dishes]);

  // 滚动时高亮左侧分类（移动端）
  useEffect(() => {
    const onScroll = () => {
      let current: string | null = null;
      for (const [cat] of grouped) {
        const el = sectionRefs.current[cat];
        if (el && el.getBoundingClientRect().top <= 160) current = cat;
      }
      if (current) setActiveCategory(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [grouped]);

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    const el = sectionRefs.current[cat];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const addDish = (dish: Dish) => {
    cart.add({ dishId: dish.id, name: dishName(dish), price: Number(dish.price) });
    toast.success(`${t("addedToCart")}：${dishName(dish)}`);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <CustomerHeader />

      {/* 品牌横幅：俄语模式在移动端自动收缩 */}
      <section
        className={`relative overflow-hidden border-b border-border/60 ${
          lang === "ru" ? "py-6 sm:py-10" : "py-8 sm:py-14"
        }`}
      >
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-[10px] font-medium tracking-[0.35em] text-primary sm:text-xs sm:tracking-[0.5em]">
            {t("heroKicker")}
          </p>
          <h1
            className={`font-display mt-2 font-black leading-tight tracking-wide sm:mt-3 ${
              lang === "ru" ? "text-2xl sm:text-4xl" : "text-3xl sm:text-5xl"
            }`}
          >
            {t("heroTitle")}
          </h1>
          <p
            className={`mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base ${
              lang === "ru" ? "line-clamp-2 sm:line-clamp-none" : ""
            }`}
          >
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* 标签筛选（移动端在分类栏下方横向滚动） */}
      <div className="sticky top-14 z-30 border-b border-border/60 bg-background/85 backdrop-blur sm:top-16">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-3 py-2.5 sm:px-4 sm:py-3">
          <button
            onClick={() => setActiveTag(null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeTag === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
            }`}
          >
            {t("all")}
          </button>
          {(tags.data ?? []).map((tg) => (
            <button
              key={tg.id}
              onClick={() => setActiveTag(activeTag === tg.id ? null : tg.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium text-white transition-opacity ${
                activeTag === tg.id ? "ring-2 ring-offset-2 ring-offset-background" : "opacity-75 hover:opacity-100"
              }`}
              style={{ backgroundColor: tg.color, ["--tw-ring-color" as string]: tg.color }}
            >
              {tagName(tg)}
            </button>
          ))}
        </div>
      </div>

      {/* 菜单主体 */}
      <main className="mx-auto max-w-6xl md:px-4">
        {menu.isLoading ? (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : menu.isError ? (
          <p className="px-4 py-20 text-center text-muted-foreground">{t("menuLoadFail")}</p>
        ) : grouped.length === 0 ? (
          <p className="px-4 py-20 text-center text-muted-foreground">{t("emptyTag")}</p>
        ) : (
          <div className="flex">
            {/* 左侧分类栏：移动端固定窄栏，桌面端隐藏 */}
            <aside className="sticky top-[6.75rem] h-[calc(100dvh-6.75rem-4.5rem)] w-24 shrink-0 self-start overflow-y-auto border-r border-border/60 bg-secondary/40 md:hidden">
              {grouped.map(([cat, list]) => (
                <button
                  key={cat}
                  onClick={() => scrollToCategory(cat)}
                  className={`flex w-full flex-col items-start gap-0.5 border-l-2 px-3 py-3.5 text-left text-[13px] leading-tight transition-colors ${
                    activeCategory === cat
                      ? "border-primary bg-background font-semibold text-primary"
                      : "border-transparent text-muted-foreground"
                  }`}
                >
                  {categoryName(cat)}
                  <span className="text-[10px] opacity-70">{list.length}</span>
                </button>
              ))}
            </aside>

            {/* 右侧菜品区 */}
            <div className="min-w-0 flex-1 px-3 pb-6 pt-4 sm:px-4 md:pt-6">
              {grouped.map(([category, list]) => (
                <section
                  key={category}
                  ref={(el) => {
                    sectionRefs.current[category] = el;
                  }}
                  className="mb-8 md:mb-10"
                >
                  <div className="mb-3 flex items-baseline gap-3 md:mb-4">
                    <h2 className="font-display text-lg font-bold tracking-wide md:text-2xl">
                      {categoryName(category)}
                    </h2>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  {/* 移动端：紧凑横排卡；桌面端：竖版网格卡 */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {list.map((dish) => (
                      <article
                        key={dish.id}
                        className="group flex gap-3 rounded-2xl border border-border/60 bg-card p-2.5 transition-transform duration-300 hover:-translate-y-0.5 sm:flex-col sm:overflow-hidden sm:p-0 sm:hover:-translate-y-1"
                      >
                        <DishImage
                          imageUrl={dish.imageUrl}
                          name={dishName(dish)}
                          className="h-20 w-20 shrink-0 rounded-xl sm:h-40 sm:w-full sm:rounded-none"
                        />
                        <div className="flex min-w-0 flex-1 flex-col sm:p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display min-w-0 text-sm font-bold leading-snug sm:text-lg">
                              {dishName(dish)}
                            </h3>
                            <span className="shrink-0 font-display text-sm font-bold text-primary sm:text-lg">
                              {formatPrice(dish.price)}
                            </span>
                          </div>
                          {dish.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1 sm:mt-2 sm:gap-1.5">
                              {dish.tags.map((tg) => (
                                <TagPill key={tg.id} name={tagName(tg)} color={tg.color} />
                              ))}
                            </div>
                          )}
                          {dishDesc(dish) && (
                            <p className="mt-1.5 line-clamp-1 text-xs leading-relaxed text-muted-foreground sm:mt-2 sm:line-clamp-2 sm:text-sm">
                              {dishDesc(dish)}
                            </p>
                          )}
                          <Button
                            size="sm"
                            className="mt-2 h-8 w-full rounded-full text-xs sm:mt-3 sm:h-9 sm:text-sm"
                            onClick={() => addDish(dish)}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            {t("addToCart")}
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 底部购物车栏：仅移动端显示 */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur md:hidden">
        <button
          onClick={() => navigate("/cart")}
          className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4"
        >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShoppingCart className="h-5 w-5" />
            {cart.totalCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
                {cart.totalCount}
              </span>
            )}
          </span>
          <span className="font-display text-lg font-black text-primary">
            {cart.totalCount > 0 ? formatPrice(cart.totalPrice) : t("cartEmpty")}
          </span>
          <span
            className={`ml-auto rounded-full px-5 py-2 text-sm font-medium ${
              cart.totalCount > 0
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {t("submitOrder")}
          </span>
        </button>
      </div>
    </div>
  );
}
