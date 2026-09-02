import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = { dishId: number; name: string; price: number; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  setQty: (dishId: number, qty: number) => void;
  remove: (dishId: number) => void;
  clear: () => void;
  totalCount: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "jixiang_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      add: (line, qty = 1) =>
        setLines((prev) => {
          const existing = prev.find((l) => l.dishId === line.dishId);
          if (existing) {
            return prev.map((l) =>
              l.dishId === line.dishId ? { ...l, quantity: Math.min(99, l.quantity + qty) } : l,
            );
          }
          return [...prev, { ...line, quantity: qty }];
        }),
      setQty: (dishId, qty) =>
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => l.dishId !== dishId)
            : prev.map((l) => (l.dishId === dishId ? { ...l, quantity: Math.min(99, qty) } : l)),
        ),
      remove: (dishId) => setLines((prev) => prev.filter((l) => l.dishId !== dishId)),
      clear: () => setLines([]),
      totalCount: lines.reduce((s, l) => s + l.quantity, 0),
      totalPrice: lines.reduce((s, l) => s + l.price * l.quantity, 0),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
