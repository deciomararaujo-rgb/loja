import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { Check } from "lucide-react";
import OrderActions from "@/components/OrderActions";
import ProductImage from "@/components/ProductImage";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { addressLine, DELIVERY_LABEL, formatBRL, formatDateTime, ORDER_STATUS, PAYMENT_LABEL } from "@/lib/format";
import { pixPayload } from "@/lib/pix";
import { ensureSeeded, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Seu pedido", robots: { index: false, follow: false } };

const STEPS = ["Pedido recebido", "Pagamento confirmado", "Saiu para entrega", "Entregue"];
const STEP_OF: Record<string, number> = { aguardando: 0, pago: 1, separacao: 1, enviado: 2, entregue: 3 };

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await ensureSeeded();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.code, decodeURIComponent(code).toUpperCase().slice(0, 20)))
    .limit(1);
  if (!order) notFound();

  const s = await getSettings();
  const waiting = order.status === "aguardando";
  const cancelled = order.status === "cancelado";

  let pix: { payload: string; qr: string; key: string; name: string } | null = null;
  if ((order.paymentMethod === "pix" || order.paymentMethod === "cartao") && waiting && s.pixKey) {
    const payload = pixPayload({
      key: s.pixKey,
      name: s.pixName || s.storeName,
      city: s.pixCity || "Jandira",
      amountCents: order.totalCents,
      txid: order.code,
    });
    const qr = await QRCode.toDataURL(payload, {
      margin: 1,
      width: 560,
      errorCorrectionLevel: "M",
      color: { dark: "#2a1c13", light: "#ffffff" },
    });
    pix = { payload, qr, key: s.pixKey, name: s.pixName };
  }

  const current = STEP_OF[order.status] ?? 0;
  const firstName = order.customerName.split(" ")[0];
  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.aguardando;

  return (
    <div className="container-x py-10 lg:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid h-16 w-16 animate-rise place-items-center rounded-full bg-flame-600 text-white shadow-[0_18px_40px_-16px_rgba(196,87,11,0.8)]">
          <Check className="h-8 w-8" strokeWidth={2.2} aria-hidden />
        </span>
        <p className="eyebrow mt-6">Pedido {order.code}</p>
        <h1 className="display mt-3 text-[clamp(2.3rem,5.6vw,3.8rem)]">
          {cancelled ? "Pedido cancelado" : `Pedido recebido, ${firstName}!`}
        </h1>
        <p className="mt-4 text-[17px] text-ink-soft">
          {cancelled
            ? "Este pedido foi cancelado. Se precisar de ajuda, fale com a gente pelo WhatsApp."
            : waiting
              ? "Falta só o pagamento para a gente separar tudo com carinho."
              : "Obrigada pela compra! Você pode acompanhar o andamento por aqui."}
        </p>
        <p className="mt-5 inline-flex items-center gap-2">
          <span className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] ${status.tone}`}>
            {status.label}
          </span>
        </p>
      </header>

      {!cancelled ? (
        <ol className="mx-auto mt-10 grid max-w-3xl grid-cols-4 gap-2" aria-label="Andamento do pedido">
          {STEPS.map((label, i) => (
            <li key={label} aria-current={i === current ? "step" : undefined}>
              <span className={`block h-1.5 rounded-full ${i <= current ? "bg-flame-500" : "bg-sand-200"}`} />
              <span className={`mt-2.5 block text-[11.5px] leading-tight sm:text-[13px] ${i <= current ? "font-semibold text-ink" : "text-ink-mute"}`}>
                {label}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
        <OrderActions
          whatsapp={s.whatsappNumber}
          pix={pix}
          order={{
            code: order.code,
            status: order.status,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            deliveryMethod: order.deliveryMethod,
            cep: order.cep,
            street: order.street,
            number: order.number,
            complement: order.complement,
            neighborhood: order.neighborhood,
            city: order.city,
            state: order.state,
            paymentMethod: order.paymentMethod,
            installments: order.installments,
            subtotalCents: order.subtotalCents,
            shippingCents: order.shippingCents,
            totalCents: order.totalCents,
            notes: order.notes,
            items: order.items.map((i) => ({ name: i.name, brand: i.brand, priceCents: i.priceCents, qty: i.qty })),
          }}
        />

        <aside className="card h-fit p-5 sm:p-7">
          <h2 className="font-display text-[1.7rem] font-medium leading-none">Resumo do pedido</h2>
          <p className="mt-2 text-[13px] text-ink-mute">Feito em {formatDateTime(order.createdAt)}</p>

          <ul className="mt-4 divide-y divide-sand-200">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 py-3.5">
                <div className="h-[68px] w-14 shrink-0 overflow-hidden rounded-xl bg-sand-100">
                  <ProductImage src={item.imageUrl} alt={item.name} category={item.categorySlug} compact />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[1.08rem] font-medium leading-tight">{item.name}</p>
                  <p className="text-[13px] text-ink-mute">
                    {item.qty} × {formatBRL(item.priceCents)}
                  </p>
                </div>
                <p className="text-[14.5px] font-semibold tabular-nums">{formatBRL(item.qty * item.priceCents)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-3 space-y-2 border-t border-sand-200 pt-4 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="tabular-nums">{formatBRL(order.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">{order.deliveryMethod === "motoboy" ? "Frete (J3Flex)" : "Retirada / entrega local"}</dt>
              <dd className="tabular-nums">{order.deliveryMethod === "motoboy" ? formatBRL(order.shippingCents) : "A combinar"}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-sand-200 pt-3">
              <dt className="font-semibold">Total</dt>
              <dd className="text-[1.5rem] font-semibold tabular-nums">{formatBRL(order.totalCents)}</dd>
            </div>
          </dl>

          <dl className="mt-5 space-y-3 rounded-2xl bg-sand-50 p-4 text-[14px]">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">Pagamento</dt>
              <dd className="mt-0.5 text-ink">
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
                {order.paymentMethod === "cartao" ? ` em ${order.installments}x` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">Entrega</dt>
              <dd className="mt-0.5 text-ink">
                {DELIVERY_LABEL[order.deliveryMethod] ?? order.deliveryMethod}
                {order.deliveryMethod === "motoboy" ? (
                  <span className="block text-ink-soft">
                    {addressLine(order)} · até {s.shippingDays} {s.shippingDays === 1 ? "dia útil" : "dias úteis"}
                  </span>
                ) : null}
              </dd>
            </div>
            {order.notes ? (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">Observações</dt>
                <dd className="mt-0.5 whitespace-pre-line text-ink">{order.notes}</dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </div>
    </div>
  );
}
