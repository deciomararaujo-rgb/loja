"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeText } from "@/lib/format";
import type { CartProduct } from "./CartProvider";
import ProductCard, { type Installments } from "./ProductCard";
import Reveal from "./Reveal";

type Item = CartProduct & { subcategory: string };

const SORTS = [
  ["destaque", "Em destaque"],
  ["menor", "Menor preço"],
  ["maior", "Maior preço"],
  ["az", "Nome (A–Z)"],
] as const;

/** Grade de produtos com filtro por linha e ordenação. */
export default function ProductGrid({
  products,
  installments,
  initialLine = "",
}: {
  products: Item[];
  installments: Installments;
  initialLine?: string;
}) {
  const lines = useMemo(() => {
    const seen: string[] = [];
    for (const p of products) if (p.subcategory && !seen.includes(p.subcategory)) seen.push(p.subcategory);
    return seen;
  }, [products]);

  const [line, setLine] = useState(() => lines.find((l) => normalizeText(l) === normalizeText(initialLine)) ?? "");
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>("destaque");
  const chips = useRef<HTMLDivElement>(null);

  // No celular, rola a fileira de filtros até a linha que veio selecionada pelo link.
  useEffect(() => {
    const box = chips.current;
    const active = box?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (box && active) box.scrollLeft = Math.max(0, active.offsetLeft - 20);
  }, []);

  const list = useMemo(() => {
    const filtered = line ? products.filter((p) => p.subcategory === line) : [...products];
    if (sort === "menor") filtered.sort((a, b) => (a.priceCents || Number.MAX_SAFE_INTEGER) - (b.priceCents || Number.MAX_SAFE_INTEGER));
    if (sort === "maior") filtered.sort((a, b) => b.priceCents - a.priceCents);
    if (sort === "az") filtered.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return filtered;
  }, [products, line, sort]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-center lg:justify-between">
        {lines.length > 1 ? (
          <div ref={chips} className="no-scrollbar relative -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrar por linha">
            <button type="button" onClick={() => setLine("")} aria-pressed={line === ""} className={`chip ${line === "" ? "chip-active" : ""}`}>
              Todos
            </button>
            {lines.map((l) => (
              <button key={l} type="button" onClick={() => setLine(l)} aria-pressed={line === l} className={`chip ${line === l ? "chip-active" : ""}`}>
                {l}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <p className="text-[14px] text-ink-mute" aria-live="polite">
            {list.length} {list.length === 1 ? "produto" : "produtos"}
          </p>
          <label className="flex items-center gap-2 text-[14px] text-ink-soft">
            <span className="sr-only sm:not-sr-only">Ordenar</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-11 rounded-full border border-sand-300 bg-white pl-4 pr-9 text-base text-ink focus:border-flame-500 focus:outline-none focus:ring-4 focus:ring-flame-100 sm:text-[14px]"
            >
              {SORTS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="rounded-[1.75rem] border border-dashed border-sand-300 bg-sand-50 px-6 py-16 text-center text-ink-mute">
          Nenhum produto por aqui ainda. Novidades chegam em breve.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">
          {list.map((p) => (
            <li key={p.id}>
              <Reveal className="h-full">
                <ProductCard product={p} installments={installments} />
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
