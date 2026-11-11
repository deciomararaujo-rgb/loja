"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { formatBRL, installmentText } from "@/lib/format";
import { useCart, type CartProduct } from "./CartProvider";
import ProductImage from "./ProductImage";

export type Installments = { max: number; free: number };

export default function ProductCard({ product, installments }: { product: CartProduct; installments: Installments }) {
  const { add } = useCart();
  // Preço 0 = "sob consulta": o cartão leva à página do produto, onde a cliente pergunta o valor pelo WhatsApp.
  const quote = product.priceCents <= 0;
  const parcel = quote ? "" : installmentText(product.priceCents, installments.max, installments.free);

  return (
    <article className="group flex h-full flex-col">
      <div className="relative">
        <Link
          href={`/produto/${product.slug}`}
          aria-label={product.name}
          className="block aspect-[4/5] overflow-hidden rounded-[1.6rem] bg-sand-100 shadow-[0_1px_0_rgba(74,44,20,0.04)] transition-shadow duration-500 group-hover:shadow-card"
        >
          <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.045]">
            <div className="rv-zoom h-full w-full">
              <ProductImage src={product.imageUrl} alt={product.name} category={product.categorySlug} brand={product.brand} />
            </div>
          </div>
        </Link>
        {quote ? null : (
          <button
            type="button"
            onClick={() => add(product)}
            aria-label={`Adicionar ${product.name} à sacola`}
            className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-card transition duration-200 hover:bg-flame-600 hover:text-white active:scale-90"
          >
            <Plus className="h-5 w-5" strokeWidth={1.8} />
          </button>
        )}
      </div>
      <div className="rv-text mt-4 flex flex-1 flex-col px-1">
        {product.brand ? (
          <p className="truncate text-[10.5px] font-medium uppercase tracking-[0.24em] text-ink-mute">{product.brand}</p>
        ) : null}
        <h3 className="mt-1 font-display text-[1.22rem] font-medium leading-[1.15] text-ink sm:text-[1.32rem]">
          <Link href={`/produto/${product.slug}`} title={product.name} className="line-clamp-3 transition hover:text-flame-700">
            {product.name}
          </Link>
        </h3>
        {quote ? (
          <p className="mt-auto pt-2.5 text-[14.5px] font-semibold text-ink">Preço sob consulta</p>
        ) : (
          <p className="mt-auto pt-2.5 text-[15.5px] font-semibold tabular-nums text-ink">{formatBRL(product.priceCents)}</p>
        )}
        {parcel ? <p className="text-[12.5px] text-ink-mute">ou {parcel}</p> : null}
      </div>
    </article>
  );
}
