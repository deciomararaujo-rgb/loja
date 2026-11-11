"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { MapPin, Search, ShoppingBag, Trash2, Truck } from "lucide-react";
import {
  addressLine,
  DELIVERY_LABEL,
  formatBRL,
  formatDateTime,
  maskPhone,
  normalizeText,
  onlyDigits,
  ORDER_STATUS,
  PAYMENT_LABEL,
  waLink,
} from "@/lib/format";
import { WhatsAppIcon } from "../icons";
import { Confirm, Empty, Loading, Modal, useAdmin, type AdminOrder } from "./admin-ui";

const customerNumber = (o: AdminOrder) => {
  const d = onlyDigits(o.customerPhone);
  return d.length <= 11 ? `55${d}` : d;
};

/** Mensagem pronta para avisar a cliente sobre o andamento do pedido. */
function statusMessage(o: AdminOrder) {
  const name = o.customerName.split(" ")[0];
  const total = formatBRL(o.totalCents);
  switch (o.status) {
    case "pago":
      return `Olá, ${name}! Confirmamos o pagamento do seu pedido ${o.code} ✅ Já estamos preparando tudo com carinho.`;
    case "separacao":
      return `Olá, ${name}! Seu pedido ${o.code} está em separação e logo sai para entrega.`;
    case "enviado":
      return `Olá, ${name}! Seu pedido ${o.code} saiu para entrega 🛵 Qualquer coisa, é só chamar.`;
    case "entregue":
      return `Olá, ${name}! Seu pedido ${o.code} foi entregue. Esperamos que você ame! 🧡`;
    case "cancelado":
      return `Olá, ${name}. Seu pedido ${o.code} foi cancelado. Se precisar de ajuda, é só chamar.`;
    default:
      return `Olá, ${name}! Recebemos o seu pedido ${o.code} no valor de ${total}. Assim que o pagamento for confirmado, seguimos com a separação. 🧡`;
  }
}

export default function AdminOrders({
  orders,
  setOrders,
  focusCode,
  clearFocus,
}: {
  orders: AdminOrder[] | null;
  setOrders: Dispatch<SetStateAction<AdminOrder[] | null>>;
  focusCode: string | null;
  clearFocus: () => void;
}) {
  const { api, toast } = useAdmin();
  const [filter, setFilter] = useState("todos");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<AdminOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Abre o pedido quando a pessoa chega por um aviso.
  useEffect(() => {
    if (!focusCode || !orders) return;
    const found = orders.find((o) => o.code === focusCode);
    if (found) setOpenId(found.id);
    clearFocus();
  }, [focusCode, orders, clearFocus]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { todos: orders?.length ?? 0 };
    for (const o of orders ?? []) map[o.status] = (map[o.status] ?? 0) + 1;
    return map;
  }, [orders]);

  const list = useMemo(() => {
    const term = normalizeText(q.trim());
    return (orders ?? []).filter((o) => {
      if (filter !== "todos" && o.status !== filter) return false;
      if (!term) return true;
      return normalizeText(`${o.code} ${o.customerName} ${o.customerPhone}`).includes(term);
    });
  }, [orders, filter, q]);

  const open = orders?.find((o) => o.id === openId) ?? null;
  const closeModal = useCallback(() => setOpenId(null), []);

  async function changeStatus(order: AdminOrder, status: string) {
    if (status === order.status) return;
    setBusy(order.id);
    try {
      const res = await api<{ order: AdminOrder }>("/api/admin/orders", { method: "PATCH", body: { id: order.id, status } });
      setOrders((prev) => (prev ? prev.map((o) => (o.id === order.id ? res.order : o)) : prev));
      toast(`Pedido ${order.code}: ${ORDER_STATUS[status].label}.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível atualizar o pedido.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/admin/orders?id=${toDelete.id}`, { method: "DELETE" });
      setOrders((prev) => (prev ? prev.filter((o) => o.id !== toDelete.id) : prev));
      toast(`Pedido ${toDelete.code} excluído.`);
      setToDelete(null);
      setOpenId(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível excluir o pedido.", "error");
    } finally {
      setDeleting(false);
    }
  }

  if (!orders) return <Loading text="Carregando pedidos…" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Pedidos</p>
        <h1 className="display mt-2 text-[clamp(2.2rem,5vw,3.2rem)]">Controle de pedidos</h1>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrar por status">
          {[["todos", "Todos"], ...Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label])].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key} className={`chip ${filter === key ? "chip-active" : ""}`}>
              {label}
              <span className={`ml-2 text-[11.5px] ${filter === key ? "text-cream/70" : "text-ink-mute"}`}>{counts[key] ?? 0}</span>
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:w-72">
          <span className="sr-only">Buscar pedido</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, código ou telefone" className="field h-11 rounded-full pl-11" />
        </label>
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<ShoppingBag className="h-6 w-6" strokeWidth={1.5} />}
          title={orders.length === 0 ? "Nenhum pedido ainda" : "Nada encontrado"}
          text={orders.length === 0 ? "Quando alguém finalizar uma compra, o pedido aparece aqui na hora." : "Tente outro filtro ou outra busca."}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const units = o.items.reduce((n, i) => n + i.qty, 0);
            return (
              <li key={o.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                <button type="button" onClick={() => setOpenId(o.id)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sand-100 text-flame-600">
                    {o.deliveryMethod === "motoboy" ? <Truck className="h-5 w-5" strokeWidth={1.6} aria-hidden /> : <MapPin className="h-5 w-5" strokeWidth={1.6} aria-hidden />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15.5px] font-semibold">{o.customerName}</span>
                    <span className="block text-[13px] text-ink-mute">
                      {o.code} · {formatDateTime(o.createdAt)}
                    </span>
                    <span className="block text-[13px] text-ink-mute">
                      {PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod} · {units} {units === 1 ? "item" : "itens"}
                    </span>
                  </span>
                </button>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="text-[16.5px] font-semibold tabular-nums">{formatBRL(o.totalCents)}</span>
                  <select
                    aria-label={`Status do pedido ${o.code}`}
                    value={o.status}
                    disabled={busy === o.id}
                    onChange={(e) => changeStatus(o, e.target.value)}
                    className={`h-11 rounded-full border px-3 text-[13px] font-semibold focus:outline-none focus:ring-4 focus:ring-flame-100 ${(ORDER_STATUS[o.status] ?? ORDER_STATUS.aguardando).tone}`}
                  >
                    {Object.entries(ORDER_STATUS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={Boolean(open)}
        title={open ? `Pedido ${open.code}` : "Pedido"}
        onClose={closeModal}
        wide
        footer={
          open ? (
            <>
              <button type="button" className="btn btn-soft text-red-600 hover:border-red-400 hover:text-red-700" onClick={() => setToDelete(open)}>
                <Trash2 className="h-4 w-4" aria-hidden />
                Excluir
              </button>
              <a href={waLink(customerNumber(open), statusMessage(open))} target="_blank" rel="noopener noreferrer" className="btn btn-whats">
                <WhatsAppIcon className="h-5 w-5" />
                Avisar cliente no WhatsApp
              </a>
            </>
          ) : null
        }
      >
        {open ? (
          <div className="space-y-6">
            <div>
              <p className="label">Andamento</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ORDER_STATUS).map(([k, v]) => (
                  <button key={k} type="button" disabled={busy === open.id} onClick={() => changeStatus(open, k)} aria-pressed={open.status === k} className={`chip ${open.status === k ? "chip-active" : ""}`}>
                    {v.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[13px] text-ink-mute">
                Depois de mudar o andamento, toque em “Avisar cliente no WhatsApp” para enviar a mensagem pronta.
              </p>
            </div>

            <dl className="grid gap-4 rounded-2xl bg-sand-50 p-4 text-[14.5px] sm:grid-cols-2 sm:p-5">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">Cliente</dt>
                <dd className="mt-1 font-semibold">{open.customerName}</dd>
                <dd className="text-ink-soft">{maskPhone(open.customerPhone)}</dd>
                {open.customerEmail ? <dd className="break-all text-ink-soft">{open.customerEmail}</dd> : null}
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">Pagamento</dt>
                <dd className="mt-1 font-semibold">
                  {PAYMENT_LABEL[open.paymentMethod] ?? open.paymentMethod}
                  {open.paymentMethod === "cartao" ? ` em ${open.installments}x` : ""}
                </dd>
                <dd className="text-ink-soft">Feito em {formatDateTime(open.createdAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">Entrega</dt>
                <dd className="mt-1 font-semibold">{DELIVERY_LABEL[open.deliveryMethod] ?? open.deliveryMethod}</dd>
                {open.deliveryMethod === "motoboy" ? <dd className="text-ink-soft">{addressLine(open)}</dd> : null}
              </div>
              {open.notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">Observações da cliente</dt>
                  <dd className="mt-1 whitespace-pre-line text-ink-soft">{open.notes}</dd>
                </div>
              ) : null}
            </dl>

            <div>
              <p className="label">Itens</p>
              <ul className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white px-4">
                {open.items.map((i) => (
                  <li key={i.productId} className="flex items-center justify-between gap-4 py-3 text-[14.5px]">
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {i.qty}× {i.name}
                      </span>
                      {i.brand ? <span className="block text-[13px] text-ink-mute">{i.brand}</span> : null}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatBRL(i.qty * i.priceCents)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1.5 text-[14.5px]">
                <div className="flex justify-between text-ink-soft">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatBRL(open.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between text-ink-soft">
                  <dt>Frete</dt>
                  <dd className="tabular-nums">{open.deliveryMethod === "motoboy" ? formatBRL(open.shippingCents) : "A combinar"}</dd>
                </div>
                <div className="flex justify-between text-[16.5px] font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatBRL(open.totalCents)}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}
      </Modal>

      <Confirm
        open={Boolean(toDelete)}
        title="Excluir pedido?"
        text={toDelete ? `O pedido ${toDelete.code} de ${toDelete.customerName} será apagado para sempre. Se quiser só encerrar, marque como “Cancelado”.` : ""}
        action="Excluir pedido"
        busy={deleting}
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
