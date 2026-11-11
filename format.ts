// Helpers compartilhados entre servidor e navegador (sem dependências de servidor).

export const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const normalizeText = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function waLink(number: string, text?: string) {
  const n = onlyDigits(number);
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function maskPhone(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCep(v: string) {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function prettyWhats(number: string) {
  const d = onlyDigits(number);
  const local = d.startsWith("55") && d.length > 11 ? d.slice(2) : d;
  return maskPhone(local);
}

export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  aguardando: { label: "Aguardando pagamento", tone: "bg-flame-50 text-flame-700 border-flame-100" },
  pago: { label: "Pago", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  separacao: { label: "Em separação", tone: "bg-sand-100 text-ink border-sand-300" },
  enviado: { label: "Saiu para entrega", tone: "bg-sky-50 text-sky-800 border-sky-200" },
  entregue: { label: "Entregue", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  cancelado: { label: "Cancelado", tone: "bg-stone-100 text-stone-600 border-stone-200" },
};
export const PAID_STATUSES = ["pago", "separacao", "enviado", "entregue"];

export const PAYMENT_LABEL: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão de crédito",
  whatsapp: "Combinar pelo WhatsApp",
};

export const DELIVERY_LABEL: Record<string, string> = {
  motoboy: "Entrega por J3Flex",
  retirada: "Retirada em Jandira",
};

/** Texto de parcelamento exibido nos produtos. Só promete "sem juros" se a loja configurar. */
export function installmentText(priceCents: number, max: number, interestFree: number) {
  if (max <= 1) return "";
  if (interestFree > 1) {
    const n = Math.min(interestFree, max);
    return `${n}x de ${formatBRL(Math.ceil(priceCents / n))} sem juros`;
  }
  return `em até ${max}x no cartão`;
}

export type OrderLike = {
  code: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  paymentMethod: string;
  installments: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  notes: string;
  items: { name: string; brand: string; priceCents: number; qty: number }[];
};

export function addressLine(o: Pick<OrderLike, "street" | "number" | "complement" | "neighborhood" | "city" | "state" | "cep">) {
  const parts = [
    [o.street, o.number].filter(Boolean).join(", "),
    o.complement,
    o.neighborhood,
    [o.city, o.state].filter(Boolean).join("/"),
    o.cep ? `CEP ${maskCep(o.cep)}` : "",
  ];
  return parts.filter(Boolean).join(" · ");
}

/** Mensagem pronta para o cliente enviar o pedido pelo WhatsApp. */
export function orderMessage(o: OrderLike, link?: string) {
  const lines = [
    `*Pedido ${o.code}*`,
    "",
    `*Cliente:* ${o.customerName}`,
    "",
    "*Itens:*",
    ...o.items.map(
      (i) => `• ${i.qty}x ${i.name}${i.brand ? ` (${i.brand})` : ""} — ${formatBRL(i.priceCents * i.qty)}`,
    ),
    "",
    `Subtotal: ${formatBRL(o.subtotalCents)}`,
    o.deliveryMethod === "motoboy"
      ? `Frete (J3Flex): ${formatBRL(o.shippingCents)}`
      : "Entrega: retirada em Jandira (a combinar)",
    `*Total: ${formatBRL(o.totalCents)}*`,
    "",
    `*Pagamento:* ${PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}${
      o.paymentMethod === "cartao" ? ` em ${o.installments}x` : ""
    }`,
  ];
  if (o.deliveryMethod === "motoboy") lines.push(`*Endereço:* ${addressLine(o)}`);
  if (o.notes) lines.push(`*Observações:* ${o.notes}`);
  if (link) lines.push("", `Acompanhar pedido: ${link}`);
  return lines.join("\n");
}
