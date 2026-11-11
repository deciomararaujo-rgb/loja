"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartProduct = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  priceCents: number;
  imageUrl: string;
  categorySlug: string;
};
export type CartItem = CartProduct & { qty: number };

type CartContext = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (product: CartProduct, qty?: number, openDrawer?: boolean) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  replace: (items: CartItem[]) => void;
  clear: () => void;
};

const KEY = "pi-cart-v1";
const MAX_QTY = 20;
const Ctx = createContext<CartContext | null>(null);

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  // Carrega a sacola salva neste aparelho.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(saved)) {
        setItems(saved.filter((i) => i && Number.isInteger(i.id) && i.qty > 0 && typeof i.name === "string"));
      }
    } catch {
      /* armazenamento indisponível: segue com a sacola vazia */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignora */
    }
  }, [items, ready]);

  const add = useCallback((product: CartProduct, qty = 1, openDrawer = true) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) {
        return prev.map((i) => (i.id === product.id ? { ...i, ...product, qty: Math.min(MAX_QTY, i.qty + qty) } : i));
      }
      return [...prev, { ...product, qty: Math.min(MAX_QTY, qty) }];
    });
    if (openDrawer) setOpen(true);
  }, []);

  const setQty = useCallback((id: number, qty: number) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_QTY, qty) } : i)),
    );
  }, []);

  const remove = useCallback((id: number) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const replace = useCallback((next: CartItem[]) => setItems(next), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContext>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.qty * i.priceCents, 0),
      ready,
      open,
      setOpen,
      add,
      setQty,
      remove,
      replace,
      clear,
    }),
    [items, ready, open, add, setQty, remove, replace, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
