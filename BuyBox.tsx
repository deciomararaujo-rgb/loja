"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { QtyStepper } from "./CartDrawer";
import { useCart, type CartProduct } from "./CartProvider";

/** Quantidade + botões de compra. No celular, uma barra fixa aparece quando o botão sai da tela. */
export default function BuyBox({ product }: { product: CartProduct }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [stuck, setStuck] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = anchor.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);


  return (
    <>
      <div ref={anchor} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <QtyStepper qty={qty} onChange={setQty} label={product.name} size="lg" />
        <button type="button" className="btn btn-primary flex-1" onClick={() => add(product, qty)}>
          <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          Adicionar à sacola
        </button>
      </div>
      <button
        type="button"
        className="btn btn-outline mt-3 w-full"
        onClick={() => {
          add(product, qty, false);
          router.push("/checkout");
        }}
      >
        Comprar agora
      </button>

      <div
        inert={!stuck}
        className={`safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-sand-200 bg-cream/95 px-4 pt-3 backdrop-blur transition-transform duration-300 lg:hidden ${
          stuck ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[1.1rem] font-medium leading-tight">{product.name}</p>
            <p className="text-[14px] font-semibold tabular-nums">{formatBRL(product.priceCents)}</p>
          </div>
          <button type="button" className="btn btn-primary px-6" onClick={() => add(product, qty)}>
            Adicionar
          </button>
        </div>
      </div>
    </>
  );
}
