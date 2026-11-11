import type { Metadata } from "next";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import SearchPageForm from "@/components/SearchPageForm";
import { toCard } from "@/lib/cards";
import { getCategories, getSettings, searchProducts } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Buscar produtos", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = (await searchParams).q;
  const q = (typeof raw === "string" ? raw : "").trim().slice(0, 80);
  const [s, cats, results] = await Promise.all([getSettings(), getCategories(), q ? searchProducts(q) : Promise.resolve([])]);

  return (
    <div className="container-x py-10 lg:py-16">
      <p className="eyebrow">Busca</p>
      <h1 className="display mt-3 text-[clamp(2.2rem,5.4vw,3.8rem)]">
        {q ? <>Resultados para “{q}”</> : "O que você procura?"}
      </h1>

      <SearchPageForm key={q} initial={q} />

      <div className="mt-10">
        {q && results.length > 0 ? (
          <ProductGrid products={results.map(toCard)} installments={{ max: s.maxInstallments, free: s.interestFree }} />
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-sand-300 bg-sand-50 px-6 py-12 text-center">
            <p className="font-display text-2xl font-normal">
              {q ? "Não encontramos nada com esse nome" : "Digite o nome de um perfume ou de uma marca"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-mute">
              {q ? "Confira a escrita ou navegue pelas categorias abaixo." : "Ou navegue pelas categorias abaixo."}
            </p>
            <ul className="mt-6 flex flex-wrap justify-center gap-2">
              {cats.map((c) => (
                <li key={c.slug}>
                  <Link href={`/categoria/${c.slug}`} className="chip">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
