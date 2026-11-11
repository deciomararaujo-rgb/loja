"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import { WhatsAppIcon } from "./icons";

export function QtyStepper({
  qty,
  onChange,
  label,
  size = "md",
}: {
  qty: number;
  onChange: (qty: number) => void;
  label: string;
  size?: "md" | "lg";
}) {
  const box = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  return (
    <div className="inline-flex items-center rounded-full border border-sand-300 bg-white" role="group" aria-label={`Quantidade de ${label}`}>
      <button type="button" className={`${box} grid place-items-center rounded-full text-ink transition hover:bg-sand-100 disabled:opacity-35`} onClick={() => onChange(qty - 1)} disabled={qty <= 1} aria-label="Diminuir quantidade">
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center text-[15px] font-semibold tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button type="button" className={`${box} grid place-items-center rounded-full text-ink transition hover:bg-sand-100 disabled:opacity-35`} onClick={() => onChange(qty + 1)} disabled={qty >= 20} aria-label="Aumentar quantidade">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function CartDrawer({ shippingCents, shippingDays }: { shippingCents: number; shippingDays: number }) {
  const { items, subtotal, count, open, setOpen, setQty, remove } = useCart();

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add("scroll-lock");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.classList.remove("scroll-lock");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <div className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`} inert={!open}>
      <div
        className={`absolute inset-0 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Sua sacola"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-cream shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-[1.7rem] font-normal leading-none">Sua sacola</h2>
            <p className="mt-1 text-[13px] text-ink-mute">
              {count === 0 ? "Nenhum item ainda" : count === 1 ? "1 item" : `${count} itens`}
            </p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fechar sacola" className="-mr-2 grid h-11 w-11 place-items-center rounded-full transition hover:bg-sand-100">
            <X className="h-[22px] w-[22px]" strokeWidth={1.6} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-sand-100 text-flame-600">
              <ShoppingBag className="h-8 w-8" strokeWidth={1.3} />
            </span>
            <p className="mt-6 font-display text-2xl font-normal">Sua sacola está vazia</p>
            <p className="mt-2 max-w-xs text-[15px] text-ink-mute">
              Escolha seus perfumes favoritos e eles aparecem aqui para você finalizar tudo em uma única compra.
            </p>
            <Link href="/categoria/femininos" onClick={() => setOpen(false)} className="btn btn-primary mt-7">
              Ver perfumes
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-sand-200 overflow-y-auto px-5 sm:px-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-5">
                  <Link href={`/produto/${item.slug}`} onClick={() => setOpen(false)} className="h-[104px] w-[84px] shrink-0 overflow-hidden rounded-2xl bg-sand-100">
                    <ProductImage src={item.imageUrl} alt={item.name} category={item.categorySlug} compact />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    {item.brand ? <p className="text-[10px] uppercase tracking-[0.22em] text-ink-mute">{item.brand}</p> : null}
                    <Link href={`/produto/${item.slug}`} onClick={() => setOpen(false)} className="font-display text-[1.15rem] font-medium leading-tight hover:text-flame-700">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-[14px] font-semibold">{formatBRL(item.priceCents)}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QtyStepper qty={item.qty} onChange={(q) => setQty(item.id, q)} label={item.name} />
                      <button type="button" onClick={() => remove(item.id)} aria-label={`Remover ${item.name}`} className="grid h-10 w-10 place-items-center rounded-full text-ink-mute transition hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.6} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="safe-bottom border-t border-sand-200 bg-white px-5 pt-5 sm:px-6">
              <dl className="space-y-1.5 text-[15px]">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="font-semibold">{formatBRL(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-[13px] text-ink-mute">
                  <dt>Entrega por J3Flex</dt>
                  <dd>
                    {formatBRL(shippingCents)} · até {shippingDays} {shippingDays === 1 ? "dia útil" : "dias úteis"}
                  </dd>
                </div>
              </dl>
              <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-primary mt-4 w-full">
                Finalizar compra
              </Link>
              <Link href="/checkout?pagamento=whatsapp" onClick={() => setOpen(false)} className="btn btn-soft mt-2.5 w-full">
                <WhatsAppIcon className="h-[18px] w-[18px] text-[#1f9d57]" />
                Pedir pelo WhatsApp
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
