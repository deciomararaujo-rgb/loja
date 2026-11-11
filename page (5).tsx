import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCard, MapPin, QrCode, Truck } from "lucide-react";
import BuyBox from "@/components/BuyBox";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import { WhatsAppIcon } from "@/components/icons";
import { toCard } from "@/lib/cards";
import { formatBRL, installmentText, waLink } from "@/lib/format";
import { getCategories, getProductBySlug, getProducts, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active) return {};
  return {
    title: product.brand ? `${product.name} · ${product.brand}` : product.name,
    description: product.description.slice(0, 160) || undefined,
    openGraph: product.imageUrl ? { images: [product.imageUrl] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active) notFound();

  const [s, cats, siblings] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({ category: product.categorySlug }),
  ]);
  const cat = cats.find((c) => c.slug === product.categorySlug);
  // Produto de uma seção retirada da loja não aparece.
  if (!cat) notFound();
  const installments = { max: s.maxInstallments, free: s.interestFree };
  const parcel = installmentText(product.priceCents, s.maxInstallments, s.interestFree);
  const days = `${s.shippingDays} ${s.shippingDays === 1 ? "dia útil" : "dias úteis"}`;

  const others = siblings.filter((p) => p.id !== product.id);
  const related = [
    ...others.filter((p) => p.subcategory === product.subcategory),
    ...others.filter((p) => p.subcategory !== product.subcategory),
  ]
    .slice(0, 4)
    .map(toCard);

  const question = waLink(
    s.whatsappNumber,
    `Olá! Tenho uma dúvida sobre o produto "${product.name}"${product.brand ? ` (${product.brand})` : ""}.`,
  );

  // Preço 0 = "sob consulta": em vez do botão de compra, a cliente pergunta o valor pelo WhatsApp.
  const quote = product.priceCents <= 0;
  const priceQuestion = waLink(
    s.whatsappNumber,
    `Olá! Gostaria de saber o preço do "${product.name}"${product.brand ? ` (${product.brand})` : ""}.`,
  );

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: quote ? undefined : { "@type": "Offer", priceCurrency: "BRL", price: (product.priceCents / 100).toFixed(2) },
  }).replace(/</g, "\\u003c");

  return (
    <div className="container-x pb-4 pt-6 lg:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <nav aria-label="Você está em" className="no-scrollbar flex gap-2 overflow-x-auto whitespace-nowrap text-[13px] text-ink-mute">
        <Link href="/" className="hover:text-flame-700">
          Início
        </Link>
        <span className="text-sand-400">/</span>
        {cat ? (
          <>
            <Link href={`/categoria/${cat.slug}`} className="hover:text-flame-700">
              {cat.name}
            </Link>
            <span className="text-sand-400">/</span>
          </>
        ) : null}
        <span className="text-ink-soft">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.02fr_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-36 lg:self-start">
          <div className="mx-auto aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-sand-100 shadow-card lg:max-w-[62vh] lg:rounded-[2.5rem]">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              category={product.categorySlug}
              brand={product.brand}
              sizes="(min-width: 1024px) 46vw, 100vw"
              eager
            />
          </div>
        </div>

        <div className="lg:py-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {product.brand ? <p className="eyebrow">{product.brand}</p> : null}
            {product.subcategory ? (
              <span className="rounded-full border border-sand-300 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-ink-mute">
                {product.subcategory}
              </span>
            ) : null}
          </div>
          <h1 className="display mt-3 text-[clamp(2.3rem,5vw,3.6rem)]">{product.name}</h1>

          <div className="mt-6 border-y border-sand-200 py-5">
            {quote ? (
              <>
                <p className="text-[1.6rem] font-semibold leading-none text-ink">Preço sob consulta</p>
                <p className="mt-2 text-[15px] text-ink-soft">Fale com a gente no WhatsApp para saber o valor e a disponibilidade.</p>
              </>
            ) : (
              <>
                <p className="text-[2rem] font-semibold leading-none tabular-nums text-ink">{formatBRL(product.priceCents)}</p>
                <p className="mt-2 text-[15px] text-ink-soft">à vista no Pix{parcel ? ` ou ${parcel}` : ""}</p>
              </>
            )}
          </div>

          {quote ? (
            <a href={priceQuestion} target="_blank" rel="noopener noreferrer" className="btn btn-whats mt-8 w-full">
              <WhatsAppIcon className="h-5 w-5" />
              Consultar preço no WhatsApp
            </a>
          ) : (
            <BuyBox product={toCard(product)} />
          )}

          <ul className="mt-8 grid gap-3 text-[14.5px] text-ink-soft sm:grid-cols-2">
            <li className="flex gap-3 rounded-2xl bg-sand-50 p-4">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-flame-600" strokeWidth={1.5} aria-hidden />
              <span>
                <strong className="block font-semibold text-ink">J3Flex por {formatBRL(s.shippingCents)}</strong>
                Entrega em até {days}
              </span>
            </li>
            {s.pickupEnabled ? (
              <li className="flex gap-3 rounded-2xl bg-sand-50 p-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-flame-600" strokeWidth={1.5} aria-hidden />
                <span>
                  <strong className="block font-semibold text-ink">Retirada em Jandira</strong>
                  Combine pelo WhatsApp
                </span>
              </li>
            ) : null}
            <li className="flex gap-3 rounded-2xl bg-sand-50 p-4">
              <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-flame-600" strokeWidth={1.5} aria-hidden />
              <span>
                <strong className="block font-semibold text-ink">Pix</strong>
                QR Code e copia e cola
              </span>
            </li>
            <li className="flex gap-3 rounded-2xl bg-sand-50 p-4">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-flame-600" strokeWidth={1.5} aria-hidden />
              <span>
                <strong className="block font-semibold text-ink">Cartão de crédito</strong>
                {s.maxInstallments > 1 ? `Em até ${s.maxInstallments}x` : "Link de pagamento seguro"}
              </span>
            </li>
          </ul>

          {product.description ? (
            <section className="mt-10">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.26em] text-ink">Sobre o produto</h2>
              <p className="mt-4 whitespace-pre-line text-[16.5px] leading-relaxed text-ink-soft">{product.description}</p>
            </section>
          ) : null}

          <a
            href={question}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex items-center gap-4 rounded-2xl border border-sand-200 bg-white p-4 transition hover:border-[#1f9d57]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1f9d57]/10 text-[#1f9d57]">
              <WhatsAppIcon className="h-5 w-5" />
            </span>
            <span className="text-[14.5px] text-ink-soft">
              <strong className="block font-semibold text-ink">Dúvidas sobre esta fragrância?</strong>
              Fale com a gente no WhatsApp
            </span>
          </a>
        </div>
      </div>

      {related.length ? (
        <section className="pt-16 lg:pt-24">
          <p className="eyebrow">Você também pode gostar</p>
          <h2 className="display mt-3 text-[clamp(2rem,4.4vw,3.2rem)]">Combine com</h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} installments={installments} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
