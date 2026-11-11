"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, QrCode } from "lucide-react";
import { formatBRL, orderMessage, waLink, type OrderLike } from "@/lib/format";
import { WhatsAppIcon } from "./icons";

type Props = {
  order: OrderLike & { status: string };
  pix: { payload: string; qr: string; key: string; name: string } | null;
  whatsapp: string;
};

export default function OrderActions({ order, pix, whatsapp }: Props) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [informed, setInformed] = useState(false);
  const codeField = useRef<HTMLTextAreaElement>(null);

  const waiting = order.status === "aguardando";
  const finished = order.status === "entregue" || order.status === "cancelado";

  useEffect(() => setOrigin(window.location.origin), []);

  // Atualiza o status sozinho enquanto o pedido está em andamento.
  useEffect(() => {
    if (finished) return;
    const t = window.setInterval(() => router.refresh(), 45_000);
    return () => window.clearInterval(t);
  }, [finished, router]);

  const track = origin ? `${origin}/pedido/${order.code}` : undefined;
  const fullMessage = orderMessage(order, track);

  const notify = (event: "paid" | "whatsapp") => {
    fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: order.code, event }),
      keepalive: true,
    }).catch(() => {});
  };

  async function copyPix() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.payload);
    } catch {
      codeField.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2600);
  }

  const sendOrderLink = (
    <a
      href={waLink(whatsapp, fullMessage)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => notify("whatsapp")}
      className="btn btn-whats w-full"
    >
      <WhatsAppIcon className="h-5 w-5" />
      Enviar pedido pelo WhatsApp
    </a>
  );

  return (
    <section className="card h-fit p-5 sm:p-8" aria-label="Pagamento">
      {order.status === "cancelado" ? (
        <>
          <h2 className="font-display text-[1.9rem] font-medium leading-tight">Precisa de ajuda?</h2>
          <p className="mt-2 text-ink-soft">Fale com a gente para refazer o pedido ou tirar qualquer dúvida.</p>
          <a href={waLink(whatsapp, `Olá! Preciso de ajuda com o pedido ${order.code}.`)} target="_blank" rel="noopener noreferrer" className="btn btn-whats mt-6 w-full">
            <WhatsAppIcon className="h-5 w-5" />
            Falar no WhatsApp
          </a>
        </>
      ) : !waiting ? (
        <>
          <h2 className="font-display text-[1.9rem] font-medium leading-tight">Pagamento confirmado</h2>
          <p className="mt-2 text-ink-soft">
            Recebemos o seu pagamento de <strong className="font-semibold text-ink">{formatBRL(order.totalCents)}</strong>. Qualquer
            novidade sobre a entrega, avisamos pelo WhatsApp.
          </p>
          <a href={waLink(whatsapp, `Olá! Gostaria de saber sobre o pedido ${order.code}.`)} target="_blank" rel="noopener noreferrer" className="btn btn-soft mt-6 w-full">
            <WhatsAppIcon className="h-5 w-5 text-[#1f9d57]" />
            Falar sobre o pedido
          </a>
        </>
      ) : order.paymentMethod === "pix" || order.paymentMethod === "cartao" ? (
        <>
          <h2 className="flex items-center gap-3 font-display text-[1.9rem] font-medium leading-tight">
            <QrCode className="h-7 w-7 text-flame-600" strokeWidth={1.5} aria-hidden />
            {order.paymentMethod === "cartao" ? "Pague com Pix (cartão)" : "Pague com Pix"}
          </h2>
          {pix ? (
            <>
              <p className="mt-2 text-ink-soft">
                Abra o app do seu banco, escolha <strong className="font-semibold text-ink">Pix</strong> e leia o QR Code ou use o
                Copia e Cola. Valor: <strong className="font-semibold text-ink">{formatBRL(order.totalCents)}</strong>.
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-[220px_1fr] sm:items-center">
                <div className="mx-auto w-[220px] rounded-[1.5rem] border border-sand-200 bg-white p-3 shadow-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pix.qr} alt="QR Code Pix do pedido" width={220} height={220} className="h-auto w-full rounded-xl" />
                </div>
                <div>
                  <label htmlFor="pix-codigo" className="label">
                    Pix Copia e Cola
                  </label>
                  <textarea
                    id="pix-codigo"
                    ref={codeField}
                    readOnly
                    rows={3}
                    value={pix.payload}
                    onFocus={(e) => e.currentTarget.select()}
                    className="field h-auto resize-none break-all py-3 font-mono text-[12.5px] leading-snug"
                  />
                  <button type="button" onClick={copyPix} className="btn btn-primary mt-3 w-full">
                    {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                    <span aria-live="polite">{copied ? "Código copiado!" : "Copiar código Pix"}</span>
                  </button>
                  <dl className="mt-4 space-y-1 text-[13.5px] text-ink-soft">
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-ink-mute">Chave Pix:</dt>
                      <dd className="break-all font-medium text-ink">{pix.key}</dd>
                    </div>
                    {pix.name ? (
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="text-ink-mute">Recebedor:</dt>
                        <dd className="font-medium text-ink">{pix.name}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>
              <div className="mt-7 rounded-2xl bg-sand-50 p-4 sm:p-5">
                <p className="text-[14.5px] text-ink-soft">
                  {informed
                    ? "Obrigada! Assim que confirmarmos o Pix, seu pedido segue para separação."
                    : "Depois de pagar, envie o comprovante pelo WhatsApp para agilizar a confirmação."}
                </p>
                <a
                  href={waLink(
                    whatsapp,
                    `Olá! Fiz o Pix do pedido ${order.code} no valor de ${formatBRL(order.totalCents)}. Segue o comprovante.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    notify("paid");
                    setInformed(true);
                  }}
                  className="btn btn-whats mt-4 w-full"
                >
                  <WhatsAppIcon className="h-5 w-5 shrink-0" />
                  Enviar comprovante
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-ink-soft">
                Envie o pedido pelo WhatsApp e a gente passa a chave Pix para o pagamento de{" "}
                <strong className="font-semibold text-ink">{formatBRL(order.totalCents)}</strong>.
              </p>
              <div className="mt-6">{sendOrderLink}</div>
            </>
          )}
        </>
      ) : (
        <>
          <h2 className="flex items-center gap-3 font-display text-[1.9rem] font-medium leading-tight">
            <WhatsAppIcon className="h-7 w-7 text-[#1f9d57]" />
            Envie seu pedido
          </h2>
          <p className="mt-2 text-ink-soft">
            Seu pedido já está registrado. Agora é só enviar para o nosso WhatsApp para combinarmos o pagamento
            {order.deliveryMethod === "retirada" ? " e a retirada" : " e a entrega"}.
          </p>
          <div className="mt-6">{sendOrderLink}</div>
        </>
      )}

      {waiting && order.paymentMethod !== "whatsapp" ? (
        <div className="mt-5 text-center">
          <p className="text-[14px] text-ink-mute">Algo não deu certo com o pagamento? Fale com a gente.</p>
          <a
            href={waLink(whatsapp, `Olá! Preciso de ajuda com o pagamento do pedido ${order.code}.\n\n${fullMessage}`)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => notify("whatsapp")}
            className="btn btn-whats mt-3 w-full"
          >
            <WhatsAppIcon className="h-5 w-5 shrink-0" />
            Fale comigo
          </a>
        </div>
      ) : null}

      <p className="mt-6 border-t border-sand-200 pt-5 text-center text-[14px] text-ink-mute">
        Guarde o código <strong className="font-semibold text-ink">{order.code}</strong> ou esta página para acompanhar o pedido.{" "}
        <Link href="/" className="link-underline font-medium text-ink">
          Continuar comprando
        </Link>
      </p>
    </section>
  );
}
