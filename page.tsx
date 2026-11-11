import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import { toCard } from "@/lib/cards";
import { getCategories, getProducts, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  return cat ? { title: cat.name, description: cat.tagline || undefined } : {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { linha } = await searchParams;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) notFound();

  const [s, items] = await Promise.all([getSettings(), getProducts({ category: slug })]);

  return (
    <>
      <section className="border-b border-sand-200 bg-sand-100">
        <div className="container-x pb-10 pt-8 lg:pb-16 lg:pt-12">
          <nav aria-label="Você está em" className="text-[13px] text-ink-mute">
            <Link href="/" className="hover:text-flame-700">
              Início
            </Link>
            <span className="mx-2 text-sand-400">/</span>
            <span className="text-ink-soft">{cat.name}</span>
          </nav>
          <h1 className="display mt-5 animate-rise text-[clamp(2.8rem,7.4vw,5rem)]">{cat.name}</h1>
          {cat.tagline ? <p className="mt-4 max-w-2xl animate-rise text-[17px] text-ink-soft [animation-delay:90ms]">{cat.tagline}</p> : null}
        </div>
      </section>

      <section className="container-x py-10 lg:py-14">
        <ProductGrid
          key={`${slug}-${typeof linha === "string" ? linha : ""}`}
          products={items.map(toCard)}
          installments={{ max: s.maxInstallments, free: s.interestFree }}
          initialLine={typeof linha === "string" ? linha : ""}
        />
      </section>
    </>
  );
}
