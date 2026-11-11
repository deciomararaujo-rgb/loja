import Link from "next/link";
import { Lock, QrCode, CreditCard } from "lucide-react";
import { formatBRL, prettyWhats, waLink } from "@/lib/format";
import { STORE_ADDRESS } from "@/lib/store-info";
import { WhatsAppIcon } from "./icons";

type Cat = { slug: string; name: string };

export default function Footer({
  whatsapp,
  shippingCents,
  shippingDays,
  categories,
}: {
  whatsapp: string;
  shippingCents: number;
  shippingDays: number;
  categories: Cat[];
}) {
  const help = waLink(whatsapp, "Olá! Vim pelo site e gostaria de tirar uma dúvida.");
  const heading = "text-[14px] font-semibold text-white";
  const link = "text-[14.5px] text-white/80 transition hover:text-white";
  const badge = "grid h-11 w-[68px] place-items-center rounded-lg border border-white/40 text-white";

  return (
    <footer className="mt-24 bg-[#120b08] text-white">
      <div className="container-x pb-10 pt-12 lg:pt-16">
        <div className="flex items-center justify-between gap-6 border-b border-white/15 pb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-preta.webp" alt="Perfumes Imports All PY&BR" width={900} height={351} className="h-12 w-auto brightness-0 invert lg:h-14" />
          <a href={help} target="_blank" rel="noopener noreferrer" className="btn btn-whats !px-5">
            <WhatsAppIcon className="h-5 w-5" />
            Fale comigo
          </a>
        </div>

        <div className="grid gap-10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className={heading}>Loja</h2>
            <ul className="mt-4 space-y-2.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/categoria/${c.slug}`} className={link}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={heading}>Ajuda</h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/busca" className={link}>
                  Buscar produtos
                </Link>
              </li>
              <li>
                <Link href="/checkout" className={link}>
                  Finalizar compra
                </Link>
              </li>
              <li>
                <a href={help} target="_blank" rel="noopener noreferrer" className={link}>
                  Fale conosco
                </a>
              </li>
              <li>
                <Link href="/admin" className={`${link} !text-white/50`}>
                  Área da loja
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className={heading}>Atendimento</h2>
            <ul className="mt-4 space-y-2.5 text-[14.5px] text-white/80">
              <li>
                <a href={help} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
                  WhatsApp {prettyWhats(whatsapp)}
                </a>
              </li>
              <li>{STORE_ADDRESS}</li>
              <li>
                Frete {formatBRL(shippingCents)} via J3Flex, em até {shippingDays} {shippingDays === 1 ? "dia útil" : "dias úteis"}
              </li>
            </ul>
          </div>

          <div>
            <h2 className={heading}>Formas de Pagamento</h2>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <span className={badge} title="Pix">
                <QrCode className="h-5 w-5" strokeWidth={1.5} aria-label="Pix" />
              </span>
              <span className={badge} title="Cartão (fale comigo)">
                <CreditCard className="h-5 w-5" strokeWidth={1.5} aria-label="Cartão" />
              </span>
            </div>
            <h2 className={`${heading} mt-7`}>Qualidade e segurança</h2>
            <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[13px] font-semibold uppercase tracking-wide text-white">
              <Lock className="h-4 w-4 text-[#3ddc84]" aria-hidden />
              Site seguro
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container-x py-6 pb-24 text-[13px] text-white/60 sm:pb-6">
          © {new Date().getFullYear()} Perfumes Imports All PY&amp;BR. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
