import type { ReactNode } from "react";
import CartDrawer from "@/components/CartDrawer";
import CartProvider from "@/components/CartProvider";
import Footer from "@/components/Footer";
import IntroVideo from "@/components/IntroVideo";
import Header from "@/components/Header";
import { getActiveProducts, getCategories, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [s, cats, all] = await Promise.all([getSettings(), getCategories(), getActiveProducts()]);
  // Categorias que aparecem ao lado da logo, na barra do topo.
  const nav = cats.map((c) => ({
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    lines: [...new Set(all.filter((p) => p.categorySlug === c.slug && p.subcategory).map((p) => p.subcategory))].slice(0, 8),
  }));

  return (
    <CartProvider>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-cream"
      >
        Pular para o conteúdo
      </a>
      <IntroVideo />
      <Header categories={nav} announcement={s.announcement} />
      <main id="conteudo">{children}</main>
      <Footer
        whatsapp={s.whatsappNumber}
        shippingCents={s.shippingCents}
        shippingDays={s.shippingDays}
        categories={nav}
      />
      <CartDrawer shippingCents={s.shippingCents} shippingDays={s.shippingDays} />
    </CartProvider>
  );
}
