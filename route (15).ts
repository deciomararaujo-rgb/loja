import { randomBytes } from "crypto";
import { after } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { notifications, orders, type OrderItem } from "@/db/schema";
import { limitFor, rateLimit, requestOrigin } from "@/lib/auth";
import { DELIVERY_LABEL, formatBRL, onlyDigits, PAYMENT_LABEL } from "@/lib/format";
import { addNotification, sendAdminWhatsApp } from "@/lib/notify";
import { getProductsByIds, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const newCode = () => "PI-" + Array.from(randomBytes(8), (b) => ALPHABET[b % 32]).join("");
const text = (v: unknown, max: number) => (typeof v === "string" ? v.normalize("NFC").trim().slice(0, max) : "");
const fail = (error: string, field?: string, status = 400) => Response.json({ error, field }, { status });
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

/** Cria um pedido. Os preços são sempre recalculados no servidor a partir do catálogo. */
export async function POST(req: Request) {
  const limit = limitFor(req, "order", 12, 60);
  if (!rateLimit(limit.key, limit.max, 10 * 60_000)) {
    return fail("Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.", undefined, 429);
  }

  const body = obj(await req.json().catch(() => null));
  const customer = obj(body.customer);
  const delivery = obj(body.delivery);
  const payment = obj(body.payment);

  const name = text(customer.name, 120);
  const phone = onlyDigits(text(customer.phone, 30));
  const email = text(customer.email, 160);
  if (name.length < 3) return fail("Informe seu nome completo.", "name");
  if (phone.length < 10 || phone.length > 13) return fail("Informe um WhatsApp válido, com DDD.", "phone");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Confira o e-mail informado.", "email");

  const s = await getSettings();
  const method = delivery.method === "retirada" ? "retirada" : "motoboy";
  if (method === "retirada" && !s.pickupEnabled) return fail("A retirada não está disponível no momento.", "delivery");

  const addr = {
    cep: onlyDigits(text(delivery.cep, 12)),
    street: text(delivery.street, 160),
    number: text(delivery.number, 20),
    complement: text(delivery.complement, 120),
    neighborhood: text(delivery.neighborhood, 120),
    city: text(delivery.city, 120),
    state: text(delivery.state, 2).toUpperCase(),
  };
  if (method === "motoboy") {
    if (addr.cep.length !== 8) return fail("Informe um CEP válido.", "cep");
    if (!addr.street) return fail("Informe a rua.", "street");
    if (!addr.number) return fail("Informe o número.", "number");
    if (!addr.neighborhood) return fail("Informe o bairro.", "neighborhood");
    if (!addr.city) return fail("Informe a cidade.", "city");
  }

  const payMethod = ["pix", "cartao", "whatsapp"].find((m) => m === payment.method);
  if (!payMethod) return fail("Escolha a forma de pagamento.", "payment");
  const installments =
    payMethod === "cartao"
      ? Math.min(s.maxInstallments, Math.max(1, Math.round(Number(payment.installments) || 1)))
      : 1;

  const wanted = new Map<number, number>();
  for (const raw of Array.isArray(body.items) ? body.items.slice(0, 60) : []) {
    const item = obj(raw);
    const id = Number(item.id);
    const qty = Math.round(Number(item.qty));
    if (Number.isInteger(id) && id > 0 && qty > 0) wanted.set(id, Math.min(20, (wanted.get(id) ?? 0) + qty));
  }
  if (!wanted.size) return fail("Sua sacola está vazia.", "items");

  const found = await getProductsByIds([...wanted.keys()]);
  if (found.length !== wanted.size) {
    return fail(
      "Um dos produtos da sacola não está mais disponível. Revise a sacola e tente novamente.",
      "items",
      409,
    );
  }
  if (found.some((p) => p.priceCents <= 0)) {
    return fail("Um dos produtos está com o preço sob consulta. Fale com a gente pelo WhatsApp para comprar.", "items", 409);
  }
  const byId = new Map(found.map((p) => [p.id, p]));
  const items: OrderItem[] = [...wanted.entries()].map(([id, qty]) => {
    const p = byId.get(id)!;
    return {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      priceCents: p.priceCents,
      qty,
      imageUrl: p.imageUrl,
      categorySlug: p.categorySlug,
    };
  });

  const subtotalCents = items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
  const shippingCents = method === "motoboy" ? s.shippingCents : 0;
  const totalCents = subtotalCents + shippingCents;

  let created: typeof orders.$inferSelect | undefined;
  for (let attempt = 0; attempt < 4 && !created; attempt++) {
    const rows = await db
      .insert(orders)
      .values({
        code: newCode(),
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        deliveryMethod: method,
        ...(method === "motoboy" ? addr : {}),
        paymentMethod: payMethod,
        installments,
        subtotalCents,
        shippingCents,
        totalCents,
        notes: text(body.notes, 500),
        items,
      })
      .onConflictDoNothing({ target: orders.code })
      .returning();
    created = rows[0];
  }
  if (!created) return fail("Não foi possível registrar o pedido. Tente novamente.", undefined, 500);

  const units = items.reduce((n, i) => n + i.qty, 0);
  await addNotification({
    type: "pedido",
    title: `Novo pedido ${created.code} · ${formatBRL(totalCents)}`,
    message: `${name} · ${units} ${units === 1 ? "item" : "itens"} · ${PAYMENT_LABEL[payMethod]} · ${DELIVERY_LABEL[method]}`,
    orderCode: created.code,
  });

  const origin = requestOrigin(req);
  const code = created.code;
  after(async () => {
    await sendAdminWhatsApp(
      `🛍️ Novo pedido ${code}\nCliente: ${name}\nTotal: ${formatBRL(totalCents)} (${PAYMENT_LABEL[payMethod]})\nVeja no painel: ${origin}/admin`,
    );
  });

  return Response.json({ code });
}

/** Eventos do cliente depois do pedido: informou o pagamento ou enviou o pedido pelo WhatsApp. */
export async function PATCH(req: Request) {
  const limit = limitFor(req, "event", 40, 200);
  if (!rateLimit(limit.key, limit.max, 10 * 60_000)) return fail("Aguarde um instante.", undefined, 429);

  const body = obj(await req.json().catch(() => null));
  const code = text(body.code, 20);
  const event = body.event === "paid" ? "paid" : body.event === "whatsapp" ? "whatsapp" : null;
  if (!code || !event) return fail("Dados inválidos.");

  const [order] = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
  if (!order) return fail("Pedido não encontrado.", undefined, 404);

  const type = event === "paid" ? "pagamento" : "whatsapp";
  const recent = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.orderCode, code),
        eq(notifications.type, type),
        gt(notifications.createdAt, new Date(Date.now() - 6 * 60 * 60 * 1000)),
      ),
    )
    .limit(1);

  if (!recent.length) {
    if (event === "paid") {
      await addNotification({
        type: "pagamento",
        title: `Cliente informou o pagamento do pedido ${code}`,
        message: `${order.customerName} avisou que pagou ${formatBRL(order.totalCents)}. Confira o recebimento antes de marcar como pago.`,
        orderCode: code,
      });
      const origin = requestOrigin(req);
      after(async () => {
        await sendAdminWhatsApp(
          `💰 ${order.customerName} informou o pagamento do pedido ${code} (${formatBRL(order.totalCents)}).\nConfira no painel: ${origin}/admin`,
        );
      });
    } else {
      await addNotification({
        type: "whatsapp",
        title: `Pedido ${code} enviado pelo WhatsApp`,
        message: `${order.customerName} abriu o WhatsApp da loja com os dados do pedido.`,
        orderCode: code,
      });
    }
  }

  return Response.json({ ok: true });
}
