import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BrandLogos from "@/components/BrandLogos";
import HomeHero from "@/components/HomeHero";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { toCard } from "@/lib/cards";
import { responsive } from "@/lib/img";
import { getActiveProducts, getCategories, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

// Quantos produtos cada vitrine mostra (no computador aparecem os 5 primeiros).
const PER_ROW = 10;

// Imagens das seções: no celular cada uma ocupa a largura toda; em telas maiores ficam lado a lado.
// Sempre de ponta a ponta e coladas umas nas outras, sem espaço entre elas.
const THEME_COLS: Record<number, string> = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

const sectionOf = (href: string) => /^\/categoria\/([^/?#]+)/.exec(href)?.[1];
const productOf = (href: string) => /^\/produto\/([^/?#]+)/.exec(href)?.[1];

// Página inicial, nesta ordem: topo em tela cheia (vídeos e, depois deles, as fotos), imagens das seções
// e uma vitrine de produtos por seção.
// Só entram aqui as seções marcadas com "Na página inicial" no painel; as outras continuam no menu da loja.
export default async function HomePage() {
  const [s, cats, all] = await Promise.all([getSettings(), getCategories(), getActiveProducts()]);
  const installments = { max: s.maxInstallments, free: s.interestFree };

  const inStore = new Set(cats.map((c) => c.slug));
  const onHome = new Set(cats.filter((c) => c.onHome).map((c) => c.slug));
  const available = new Set(all.map((p) => p.slug));

  // Topo: some o destaque cujo produto ou seção não está mais na loja.
  const slides = s.slides.filter((b) => {
    const section = sectionOf(b.href);
    if (section) return inStore.has(section);
    const product = productOf(b.href);
    return product ? available.has(product) : true;
  });
  // Imagens das seções: só as que aparecem na página inicial.
  const themes = s.banners.filter((b) => {
    const section = sectionOf(b.href);
    return section ? onHome.has(section) : true;
  });
  const themeCols = themes.length > 4 ? 3 : themes.length;

  // Os produtos marcados como destaque no painel aparecem primeiro em cada vitrine.
  const rows = cats
    .filter((cat) => cat.onHome)
    .map((cat) => {
      const items = all.filter((p) => p.categorySlug === cat.slug);
      return { cat, total: items.length, items: items.slice(0, PER_ROW).map(toCard) };
    })
    .filter((row) => row.total > 0);

  return (
    <>
      {/* Título só para leitores de tela e buscadores: a página inicial não mostra a logo, só vídeos e imagens. */}
      <h1 className="sr-only">{s.storeName}: perfumes árabes e importados</h1>

      <HomeHero slides={slides} />

      {themes.length ? (
        <section aria-label="Seções da loja">
          <ul className={`grid grid-cols-1 gap-0 ${THEME_COLS[themes.length] ?? "sm:grid-cols-3"}`}>
            {themes.map((theme, i) => {
              const img = responsive(theme.image, 1080);
              return (
                <li key={`${theme.image}-${i}`}>
                  <Link
                    href={theme.href}
                    aria-label={theme.label || "Ver produtos"}
                    className="group block aspect-[4/5] overflow-hidden bg-sand-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      srcSet={img.srcSet}
                      sizes={img.srcSet ? `(min-width: 640px) ${Math.ceil(100 / themeCols)}vw, 100vw` : undefined}
                      alt={theme.label}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Logos das marcas, logo abaixo das imagens das seções. */}
      <BrandLogos />

      {/* Vitrines: produtos de cada seção. Os cartões entram em sequência conforme a página desce. */}
      {rows.map(({ cat, items, total }) => (
        <section key={cat.slug} aria-labelledby={`vitrine-${cat.slug}`} className="container-x pt-12 lg:pt-20">
          <Reveal>
            <div className="mb-5 flex items-end justify-between gap-4 lg:mb-8">
              <h2 id={`vitrine-${cat.slug}`} className="display text-[clamp(1.7rem,3.4vw,2.5rem)]">
                {cat.name}
              </h2>
              <Link
                href={`/categoria/${cat.slug}`}
                aria-label={`Ver todos os produtos de ${cat.name}`}
                className="group/all link-underline mb-1 inline-flex shrink-0 items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.18em] text-ink"
              >
                Ver todos
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/all:translate-x-1" aria-hidden />
              </Link>
            </div>
          </Reveal>

          <ul className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-pl-5 gap-3.5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:scroll-pl-8 sm:gap-5 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-x-6 lg:overflow-visible lg:px-0 lg:pb-0 lg:[&>li:nth-child(n+6)]:hidden">
            {items.map((p) => (
              <li key={p.id} className="w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-auto">
                <Reveal className="h-full">
                  <ProductCard product={p} installments={installments} />
                </Reveal>
              </li>
            ))}
            {total > items.length ? (
              <li className="w-[44%] shrink-0 snap-start sm:w-[30%] lg:hidden">
                <Reveal>
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-[1.6rem] border border-sand-200 bg-sand-50 px-4 text-center transition hover:border-flame-400"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-flame-600 shadow-card">
                      <ArrowRight className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="font-display text-[1.15rem] leading-tight text-ink">Ver todos</span>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-ink-mute">{total} produtos</span>
                  </Link>
                </Reveal>
              </li>
            ) : null}
          </ul>
        </section>
      ))}

    </>
  );
}
