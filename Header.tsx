"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "./CartProvider";

export type NavCategory = { slug: string; name: string; tagline?: string; lines?: string[] };

/** Fotos do menu: só as seções que têm uma foto que combina com elas. As outras abrem o menu sem foto. */
const MENU_IMAGES: Record<string, string> = {
  masculinos: "/menu/masculinos.webp",
  femininos: "/menu/femininos.webp",
  "body-splash": "/menu/body-splash.webp",
  cremes: "/menu/cremes.webp",
  esfoliantes: "/menu/esfoliantes.webp",
  cabelos: "/menu/cabelos.webp",
};

/** Faixa preta com letras em movimento, no alto de todas as páginas. */
function Marquee({ text }: { text: string }) {
  const items = text.split("·").map((t) => t.trim()).filter(Boolean);
  if (!items.length) return null;
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {[...items, ...items].map((t, i) => (
        <li key={i} className="flex items-center whitespace-nowrap text-[11.5px] font-medium uppercase tracking-[0.14em] text-white">
          <span className="px-8">{t}</span>
          <span className="text-white/50" aria-hidden>
            •
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="relative z-50 flex h-9 items-center overflow-hidden bg-black" role="region" aria-label="Avisos da loja">
      <div className="marquee-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

function Logo({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/logo-preta.webp" alt="Perfumes Imports All PY&BR" width={900} height={351} className={className} />
  );
}

function SearchForm({ id, onDone, autoFocus }: { id: string; onDone?: () => void; autoFocus?: boolean }) {
  const router = useRouter();
  return (
    <form action="/busca" role="search" className="relative w-full" onSubmit={() => onDone?.()}>
      <label htmlFor={id} className="sr-only">
        Buscar produtos
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" aria-hidden />
      <input
        id={id}
        name="q"
        type="search"
        required
        autoFocus={autoFocus}
        enterKeyHint="search"
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          const q = e.currentTarget.value.trim();
          if (!q) return;
          router.push(`/busca?q=${encodeURIComponent(q)}`);
          onDone?.();
        }}
        placeholder="Buscar perfume, marca…"
        className="h-11 w-full rounded-full border border-sand-300 bg-white pl-11 pr-4 text-base text-ink placeholder:text-ink-mute/70 focus:border-flame-500 focus:outline-none focus:ring-4 focus:ring-flame-100 lg:text-[14px]"
      />
    </form>
  );
}

export default function Header({ categories, announcement }: { categories: NavCategory[]; announcement: string }) {
  const { count, ready, setOpen } = useCart();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const leaveTimer = useRef<number | undefined>(undefined);
  const strip = useRef<HTMLUListElement>(null);

  // Fecha a busca e o menu ao trocar de página.
  useEffect(() => {
    setSearchOpen(false);
    setMenu(null);
  }, [pathname]);

  // Na página inicial o topo é transparente sobre o vídeo e fica sólido ao rolar.
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Dentro de uma categoria, desliza a faixa até o nome dela ficar à vista.
  useEffect(() => {
    const box = strip.current;
    const item = box?.querySelector<HTMLElement>('[aria-current="page"]')?.parentElement;
    if (!box || !item) return;
    box.scrollTo({ left: Math.max(0, item.offsetLeft - (box.clientWidth - item.offsetWidth) / 2), behavior: "smooth" });
  }, [pathname]);

  const clear = isHome && !scrolled && !searchOpen && !menu;
  const iconBtn = `relative grid h-10 w-10 shrink-0 place-items-center rounded-full transition active:scale-95 sm:h-11 sm:w-11 ${
    clear ? "text-white hover:bg-white/15" : "text-ink hover:bg-sand-100"
  }`;
  const open = (slug: string) => {
    window.clearTimeout(leaveTimer.current);
    setMenu(slug);
  };
  const close = () => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setMenu(null), 120);
  };
  const current = categories.find((c) => c.slug === menu);

  return (
    <>
      <Marquee text={announcement} />

      <header
        onMouseLeave={close}
        className={`sticky top-0 z-40 transition-colors duration-300 ${
          isHome ? "-mb-16 lg:-mb-[76px]" : ""
        } ${clear ? "border-b border-transparent bg-gradient-to-b from-black/60 to-transparent" : "border-b border-sand-200 bg-cream/95 backdrop-blur-md"}`}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center gap-1.5 px-4 sm:gap-3 sm:px-8 lg:h-[76px] lg:gap-4 lg:px-12">
          <Link href="/" aria-label="Perfumes Imports, página inicial" className="shrink-0">
            <Logo className={`h-9 w-auto transition sm:h-10 lg:h-[50px] ${clear ? "brightness-0 invert" : ""}`} />
          </Link>

          {/* Categorias ao lado da logo. Quando não cabem todas na tela, a faixa desliza para o lado. */}
          <nav aria-label="Categorias" className="min-w-0 flex-1">
            <ul
              ref={strip}
              className="no-scrollbar relative flex items-center gap-x-4 overflow-x-auto px-3 [mask-image:linear-gradient(to_right,transparent,#000_12px,#000_calc(100%_-_26px),transparent)] sm:gap-x-5 lg:px-4 min-[1440px]:gap-x-6"
            >
              {categories.map((c) => {
                const active = pathname === `/categoria/${c.slug}`;
                return (
                  <li key={c.slug} className="shrink-0" onMouseEnter={() => open(c.slug)} onFocus={() => open(c.slug)}>
                    <Link
                      href={`/categoria/${c.slug}`}
                      aria-current={active ? "page" : undefined}
                      className={`relative block whitespace-nowrap py-3 text-[11px] font-medium uppercase tracking-[0.14em] transition after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:origin-left after:bg-flame-600 after:transition-transform after:duration-300 hover:after:scale-x-100 lg:text-[11.5px]  ${
                        clear
                          ? "text-white after:bg-white hover:text-white " + (active ? "after:scale-x-100" : "after:scale-x-0")
                          : active
                            ? "text-flame-700 after:scale-x-100"
                            : "text-ink-soft hover:text-flame-700 after:scale-x-0"
                      }`}
                    >
                      {c.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center">
            <button
              type="button"
              className={iconBtn}
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar"
              aria-expanded={searchOpen}
            >
              {searchOpen ? <X className="h-5 w-5" strokeWidth={1.6} /> : <Search className="h-5 w-5" strokeWidth={1.6} />}
            </button>
            <button
              type="button"
              className={`${iconBtn} -mr-2`}
              onClick={() => setOpen(true)}
              aria-label={`Abrir sacola (${ready ? count : 0} itens)`}
            >
              <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.6} />
              {ready && count > 0 ? (
                <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-flame-600 px-1 text-[10px] font-semibold leading-none text-white">
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {current ? (
          <div
            className="absolute inset-x-0 top-full hidden animate-fade border-b border-sand-200 bg-white shadow-soft lg:block"
            onMouseEnter={() => open(current.slug)}
            onMouseLeave={close}
          >
            <div className="mx-auto flex w-full max-w-[1320px] items-start justify-between gap-10 px-12 py-8">
              <div className="min-w-0 max-w-md">
                <p className="font-display text-[1.7rem] leading-tight text-ink">{current.name}</p>
                {current.tagline ? <p className="mt-2 text-[14.5px] text-ink-soft">{current.tagline}</p> : null}
                {current.lines?.length ? (
                  <ul className="mt-5 space-y-2.5">
                    {current.lines.map((l) => (
                      <li key={l}>
                        <Link
                          href={`/categoria/${current.slug}?linha=${encodeURIComponent(l)}`}
                          className="text-[15px] text-ink transition hover:text-flame-700"
                          onClick={() => setMenu(null)}
                        >
                          {l}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <Link
                  href={`/categoria/${current.slug}`}
                  className="link-underline mt-5 inline-block text-[14.5px] font-medium text-flame-700"
                  onClick={() => setMenu(null)}
                >
                  Ver tudo
                </Link>
              </div>
              {MENU_IMAGES[current.slug] ? (
                <Link href={`/categoria/${current.slug}`} onClick={() => setMenu(null)} className="block shrink-0" aria-label={`Ver ${current.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={MENU_IMAGES[current.slug]} alt={current.name} width={360} height={440} className="h-[330px] w-auto object-cover" />
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        {searchOpen ? (
          <div className="container-x animate-fade pb-3">
            <div className="mx-auto max-w-xl">
              <SearchForm id="busca-topo" autoFocus onDone={() => setSearchOpen(false)} />
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}
