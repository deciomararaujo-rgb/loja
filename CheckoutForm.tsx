"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { Check, CreditCard, Loader2, Lock, MapPin, QrCode, ShoppingBag, Truck } from "lucide-react";
import { formatBRL, maskCep, maskPhone, onlyDigits } from "@/lib/format";
import { useCart, type CartItem, type CartProduct } from "./CartProvider";
import ProductImage from "./ProductImage";
import { WhatsAppIcon } from "./icons";

type Cfg = {
  shippingCents: number;
  shippingDays: number;
  maxInstallments: number;
  interestFree: number;
  pickupEnabled: boolean;
};
type Method = "motoboy" | "retirada";
type Payment = "pix" | "cartao" | "whatsapp";
type TextKey = "name" | "phone" | "email" | "cep" | "street" | "number" | "complement" | "neighborhood" | "city" | "state" | "notes";
type Form = Record<TextKey, string> & { method: Method; payment: Payment; installments: number; remember: boolean };
type CepState = { status: "idle" | "loading" | "ok" | "error"; message?: string; outsideSP?: boolean };

const CUSTOMER_KEY = "pi-customer-v1";
const SAVED_FIELDS: TextKey[] = ["name", "phone", "email", "cep", "street", "number", "complement", "neighborhood", "city", "state"];

function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-8">
      <h2 className="flex items-center gap-3 font-display text-[1.7rem] font-medium leading-none">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-flame-600 font-sans text-[13px] font-semibold text-white">{step}</span>
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Option({
  name,
  checked,
  onSelect,
  icon,
  title,
  text,
  aside,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  text: string;
  aside?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition sm:p-5 ${
        checked ? "border-flame-500 bg-flame-50/70 ring-4 ring-flame-100" : "border-sand-300 bg-white hover:border-sand-400"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="peer sr-only" />
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-flame-500 ${
          checked ? "border-flame-600 bg-flame-600 text-white" : "border-sand-400 bg-white"
        }`}
      >
        {checked ? <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="flex items-center gap-2 text-[15.5px] font-semibold text-ink">
            {icon}
            {title}
          </span>
          {aside ? <span className="text-[14px] font-semibold text-ink">{aside}</span> : null}
        </span>
        <span className="mt-1 block text-[14px] leading-snug text-ink-mute">{text}</span>
      </span>
    </label>
  );
}

export default function CheckoutForm({ cfg, initialPayment }: { cfg: Cfg; initialPayment: Payment }) {
  const router = useRouter();
  const { items, subtotal, ready, replace, clear, setOpen } = useCart();
  const [form, setForm] = useState<Form>({
    name: "",
    phone: "",
    email: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    notes: "",
    method: "motoboy",
    payment: initialPayment,
    installments: 1,
    remember: true,
  });
  const [errors, setErrors] = useState<Partial<Record<TextKey | "items", string>>>({});
  const [cep, setCep] = useState<CepState>({ status: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [serverError, setServerError] = useState("");
  const [notice, setNotice] = useState("");
  const lastCep = useRef("");
  const sending = useRef(false);
  const synced = useRef(false);

  // Dados salvos neste aparelho em uma compra anterior.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? "null");
      if (saved && typeof saved === "object") {
        setForm((f) => {
          const next = { ...f };
          for (const key of SAVED_FIELDS) if (typeof saved[key] === "string") next[key] = saved[key];
          return next;
        });
        if (typeof saved.cep === "string" && onlyDigits(saved.cep).length === 8) {
          lastCep.current = onlyDigits(saved.cep);
          setCep({ status: "ok" });
        }
      }
    } catch {
      /* ignora */
    }
  }, []);

  // Confere preços e disponibilidade atuais dos itens da sacola.
  useEffect(() => {
    if (!ready || synced.current || items.length === 0) return;
    synced.current = true;
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: items.map((i) => i.id) }),
    })
      .then((r) => r.json())
      .then((data: { products?: CartProduct[] }) => {
        if (!Array.isArray(data.products)) return;
        const map = new Map(data.products.map((p) => [p.id, p]));
        const next: CartItem[] = items.flatMap((i) => {
          const fresh = map.get(i.id);
          return fresh ? [{ ...fresh, qty: i.qty }] : [];
        });
        if (next.length !== items.length) setNotice("Alguns itens não estão mais disponíveis e saíram da sua sacola.");
        else if (next.some((n, idx) => n.priceCents !== items[idx].priceCents)) setNotice("Os preços da sacola foram atualizados.");
        replace(next);
      })
      .catch(() => {});
  }, [ready, items, replace]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key as TextKey];
      return next;
    });
  };

  const bind = (key: TextKey, extra: InputHTMLAttributes<HTMLInputElement> = {}) => ({
    id: key,
    name: key,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value),
    className: `field ${errors[key] ? "field-error" : ""}`,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key}-erro` : undefined,
    ...extra,
  });

  const fieldError = (key: TextKey) =>
    errors[key] ? (
      <p id={`${key}-erro`} role="alert" className="mt-1.5 text-[13px] text-red-600">
        {errors[key]}
      </p>
    ) : null;

  async function lookupCep(digits: string) {
    lastCep.current = digits;
    setCep({ status: "loading" });
    try {
      const res = await fetch(`/api/shipping?cep=${digits}`);
      const data = await res.json();
      if (lastCep.current !== digits) return;
      if (!res.ok) {
        setCep({ status: "error", message: data.error ?? "Não foi possível consultar este CEP." });
        return;
      }
      setCep({ status: "ok", outsideSP: Boolean(data.outsideSP) });
      if (data.address) {
        setForm((f) => ({
          ...f,
          street: data.address.street || f.street,
          neighborhood: data.address.neighborhood || f.neighborhood,
          city: data.address.city || f.city,
          state: data.address.state || f.state,
        }));
        setErrors((e) => ({ ...e, cep: undefined, street: undefined, neighborhood: undefined, city: undefined }));
        window.setTimeout(() => document.getElementById(data.address.street ? "number" : "street")?.focus(), 50);
      }
    } catch {
      if (lastCep.current === digits) setCep({ status: "ok" });
    }
  }

  function onCepChange(value: string) {
    const masked = maskCep(value);
    set("cep", masked);
    const digits = onlyDigits(masked);
    if (digits.length === 8 && digits !== lastCep.current) lookupCep(digits);
    if (digits.length < 8) {
      lastCep.current = "";
      setCep({ status: "idle" });
    }
  }

  function validate() {
    const e: Partial<Record<TextKey | "items", string>> = {};
    if (form.name.trim().length < 3) e.name = "Informe seu nome completo.";
    const phone = onlyDigits(form.phone);
    if (phone.length < 10) e.phone = "Informe seu WhatsApp com DDD.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Confira o e-mail informado.";
    if (form.method === "motoboy") {
      if (onlyDigits(form.cep).length !== 8) e.cep = "Informe um CEP válido.";
      else if (cep.status === "error") e.cep = cep.message ?? "Confira o CEP.";
      if (!form.street.trim()) e.street = "Informe a rua.";
      if (!form.number.trim()) e.number = "Informe o número.";
      if (!form.neighborhood.trim()) e.neighborhood = "Informe o bairro.";
      if (!form.city.trim()) e.city = "Informe a cidade.";
    }
    return e;
  }

  async function onSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (submitting || sending.current) return;
    const found = validate();
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }

    sending.current = true;
    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: form.name, phone: form.phone, email: form.email },
          delivery: {
            method: form.method,
            cep: form.cep,
            street: form.street,
            number: form.number,
            complement: form.complement,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
          },
          payment: { method: form.payment, installments: form.installments },
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          notes: form.notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.code) {
        const message = data.error ?? "Não foi possível concluir o pedido. Tente novamente.";
        if (data.field && data.field in form) {
          setErrors({ [data.field]: message });
          document.getElementById(data.field)?.focus();
        } else setServerError(message);
        sending.current = false;
        setSubmitting(false);
        return;
      }

      try {
        if (form.remember) {
          const saved: Record<string, string> = {};
          for (const key of SAVED_FIELDS) saved[key] = form[key];
          localStorage.setItem(CUSTOMER_KEY, JSON.stringify(saved));
        } else localStorage.removeItem(CUSTOMER_KEY);
      } catch {
        /* ignora */
      }
      setPlaced(true);
      clear();
      router.push(`/pedido/${data.code}`);
    } catch {
      setServerError("Sem conexão no momento. Confira sua internet e tente de novo.");
      sending.current = false;
      setSubmitting(false);
    }
  }

  if (!ready || placed) {
    return (
      <div className="grid place-items-center rounded-[1.75rem] border border-sand-200 bg-white py-24 text-ink-mute" role="status">
        <Loader2 className="h-7 w-7 animate-spin text-flame-600" aria-hidden />
        <p className="mt-4 text-[15px]">{placed ? "Pedido registrado! Abrindo os detalhes…" : "Carregando sua sacola…"}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-sand-300 bg-sand-50 px-6 py-20 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-flame-600 shadow-card">
          <ShoppingBag className="h-8 w-8" strokeWidth={1.3} aria-hidden />
        </span>
        <p className="mt-6 font-display text-3xl font-normal">Sua sacola está vazia</p>
        <p className="mx-auto mt-2 max-w-sm text-ink-mute">Adicione produtos à sacola para finalizar a compra.</p>
        <Link href="/" className="btn btn-primary mt-7">
          Ver produtos
        </Link>
      </div>
    );
  }

  const shipping = form.method === "motoboy" ? cfg.shippingCents : 0;
  const total = subtotal + shipping;
  const days = `${cfg.shippingDays} ${cfg.shippingDays === 1 ? "dia útil" : "dias úteis"}`;
  const maxParcels = Math.max(1, cfg.maxInstallments);

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10">
      <div className="space-y-6">
        {notice ? (
          <p role="status" className="rounded-2xl border border-flame-100 bg-flame-50 px-5 py-4 text-[14.5px] text-flame-700">
            {notice}
          </p>
        ) : null}

        <Section step={1} title="Seus dados">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="label">
                Nome completo
              </label>
              <input {...bind("name", { autoComplete: "name", placeholder: "Como está no seu documento" })} />
              {fieldError("name")}
            </div>
            <div>
              <label htmlFor="phone" className="label">
                WhatsApp
              </label>
              <input
                {...bind("phone", { type: "tel", inputMode: "tel", autoComplete: "tel-national", placeholder: "(11) 99999-9999" })}
                onChange={(e) => set("phone", maskPhone(e.target.value))}
              />
              {fieldError("phone")}
            </div>
            <div>
              <label htmlFor="email" className="label">
                E-mail <span className="font-normal text-ink-mute">(opcional)</span>
              </label>
              <input {...bind("email", { type: "email", inputMode: "email", autoComplete: "email", placeholder: "voce@email.com" })} />
              {fieldError("email")}
            </div>
          </div>
        </Section>

        <Section step={2} title="Entrega">
          <div className="grid gap-3" role="radiogroup" aria-label="Forma de entrega">
            <Option
              name="method"
              checked={form.method === "motoboy"}
              onSelect={() => set("method", "motoboy")}
              icon={<Truck className="h-[18px] w-[18px] text-flame-600" strokeWidth={1.6} aria-hidden />}
              title="Entrega por J3Flex"
              text={`Frete fixo, entrega em até ${days} após a confirmação do pagamento.`}
              aside={formatBRL(cfg.shippingCents)}
            />
            {cfg.pickupEnabled ? (
              <Option
                name="method"
                checked={form.method === "retirada"}
                onSelect={() => set("method", "retirada")}
                icon={<MapPin className="h-[18px] w-[18px] text-flame-600" strokeWidth={1.6} aria-hidden />}
                title="Retirada em Jandira"
                text="Rua Valdomiro Alves da Silva, 121 · Jardim Marília · Jandira/SP. Combinamos dia e horário pelo WhatsApp."
                aside="A combinar"
              />
            ) : null}
          </div>

          {form.method === "motoboy" ? (
            <div className="mt-6 grid animate-fade grid-cols-6 gap-4">
              <div className="col-span-6 sm:col-span-2">
                <label htmlFor="cep" className="label">
                  CEP
                </label>
                <div className="relative">
                  <input
                    {...bind("cep", { inputMode: "numeric", autoComplete: "postal-code", placeholder: "00000-000" })}
                    onChange={(e) => onCepChange(e.target.value)}
                  />
                  {cep.status === "loading" ? (
                    <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-flame-600" aria-label="Consultando CEP" />
                  ) : null}
                </div>
                {fieldError("cep")}
              </div>
              <div className="col-span-6 flex items-end sm:col-span-4">
                <p
                  aria-live="polite"
                  className={`w-full rounded-xl px-4 py-3 text-[14px] leading-snug ${
                    cep.status === "error" ? "bg-red-50 text-red-700" : cep.status === "ok" ? "bg-flame-50 text-flame-700" : "bg-sand-50 text-ink-mute"
                  }`}
                >
                  {cep.status === "error"
                    ? cep.message
                    : cep.status === "ok"
                      ? `J3Flex · ${formatBRL(cfg.shippingCents)} · entrega em até ${days}.${
                          cep.outsideSP ? " Para fora do estado de SP, confirmamos o prazo com você pelo WhatsApp." : ""
                        }`
                      : "Digite o CEP para preencher o endereço e ver o frete e o prazo."}
                </p>
              </div>
              <div className="col-span-6 sm:col-span-4">
                <label htmlFor="street" className="label">
                  Rua / avenida
                </label>
                <input {...bind("street", { autoComplete: "address-line1" })} />
                {fieldError("street")}
              </div>
              <div className="col-span-3 sm:col-span-2">
                <label htmlFor="number" className="label">
                  Número
                </label>
                <input {...bind("number", { inputMode: "text", autoComplete: "off" })} />
                {fieldError("number")}
              </div>
              <div className="col-span-3 sm:col-span-3">
                <label htmlFor="complement" className="label">
                  Complemento <span className="font-normal text-ink-mute">(opcional)</span>
                </label>
                <input {...bind("complement", { autoComplete: "address-line2", placeholder: "Apto, bloco…" })} />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="neighborhood" className="label">
                  Bairro
                </label>
                <input {...bind("neighborhood", { autoComplete: "address-level3" })} />
                {fieldError("neighborhood")}
              </div>
              <div className="col-span-4">
                <label htmlFor="city" className="label">
                  Cidade
                </label>
                <input {...bind("city", { autoComplete: "address-level2" })} />
                {fieldError("city")}
              </div>
              <div className="col-span-2">
                <label htmlFor="state" className="label">
                  UF
                </label>
                <input
                  {...bind("state", { autoComplete: "address-level1", maxLength: 2, placeholder: "SP" })}
                  onChange={(e) => set("state", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                />
              </div>
            </div>
          ) : (
            <p className="mt-5 animate-fade rounded-xl bg-sand-50 px-4 py-3 text-[14px] text-ink-soft">
              Depois de finalizar, envie o pedido pelo WhatsApp para combinarmos a retirada em Jandira (Rua Valdomiro Alves da Silva, 121, Jardim Marília).
            </p>
          )}
        </Section>

        <Section step={3} title="Pagamento">
          <div className="grid gap-3" role="radiogroup" aria-label="Forma de pagamento">
            <Option
              name="payment"
              checked={form.payment === "pix"}
              onSelect={() => set("payment", "pix")}
              icon={<QrCode className="h-[18px] w-[18px] text-flame-600" strokeWidth={1.6} aria-hidden />}
              title="Pix"
              text="QR Code e Pix Copia e Cola aparecem assim que você finalizar o pedido."
            />
            <Option
              name="payment"
              checked={form.payment === "cartao"}
              onSelect={() => set("payment", "cartao")}
              icon={<CreditCard className="h-[18px] w-[18px] text-flame-600" strokeWidth={1.6} aria-hidden />}
              title="Cartão de crédito"
              text="O pagamento é feito pelo Pix da loja. Se precisar pagar no cartão, é só falar comigo no WhatsApp."
            />
            <Option
              name="payment"
              checked={form.payment === "whatsapp"}
              onSelect={() => set("payment", "whatsapp")}
              icon={<WhatsAppIcon className="h-[18px] w-[18px] text-[#1f9d57]" />}
              title="Combinar pelo WhatsApp"
              text="Envie o pedido para o nosso WhatsApp e combine o pagamento com a gente."
            />
          </div>

          {false ? (
            <div className="mt-5 animate-fade">
              <label htmlFor="installments" className="label">
                Número de parcelas
              </label>
              <select
                id="installments"
                value={form.installments}
                onChange={(e) => set("installments", Number(e.target.value))}
                className="field sm:max-w-sm"
              >
                {Array.from({ length: maxParcels }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n <= cfg.interestFree || n === 1
                      ? `${n}x de ${formatBRL(Math.ceil(total / n))}${n > 1 ? " sem juros" : ""}`
                      : `${n}x no cartão`}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[13px] text-ink-mute">O valor final das parcelas aparece no link de pagamento.</p>
            </div>
          ) : null}

          <div className="mt-6">
            <label htmlFor="notes" className="label">
              Observações <span className="font-normal text-ink-mute">(opcional)</span>
            </label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Ponto de referência, melhor horário para entrega, embalagem para presente…"
              className="field h-auto py-3"
            />
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-3 text-[14px] text-ink-soft">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(e) => set("remember", e.target.checked)}
              className="h-5 w-5 rounded border-sand-400 accent-[#c4570b]"
            />
            Lembrar meus dados neste aparelho para a próxima compra
          </label>
        </Section>
      </div>

      <aside className="lg:sticky lg:top-36 lg:self-start">
        <div className="card p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[1.7rem] font-medium leading-none">Resumo</h2>
            <button type="button" onClick={() => setOpen(true)} className="link-underline text-[13px] font-medium text-ink-soft">
              Editar sacola
            </button>
          </div>

          <ul className="mt-5 max-h-[320px] divide-y divide-sand-200 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-3.5">
                <div className="relative h-[68px] w-14 shrink-0 overflow-hidden rounded-xl bg-sand-100">
                  <ProductImage src={item.imageUrl} alt={item.name} category={item.categorySlug} compact />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[1.08rem] font-medium leading-tight">{item.name}</p>
                  <p className="text-[13px] text-ink-mute">
                    {item.qty} × {formatBRL(item.priceCents)}
                  </p>
                </div>
                <p className="text-[14.5px] font-semibold tabular-nums">{formatBRL(item.qty * item.priceCents)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-sand-200 pt-4 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="tabular-nums">{formatBRL(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">{form.method === "motoboy" ? "Frete (J3Flex)" : "Retirada / entrega local"}</dt>
              <dd className="tabular-nums">{form.method === "motoboy" ? formatBRL(shipping) : "A combinar"}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-sand-200 pt-3">
              <dt className="font-semibold">Total</dt>
              <dd className="text-[1.6rem] font-semibold tabular-nums">{formatBRL(total)}</dd>
            </div>
          </dl>

          {serverError ? (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">
              {serverError}
            </p>
          ) : null}

          <button type="button" onClick={() => onSubmit()} disabled={submitting} className={`btn mt-5 w-full ${form.payment === "whatsapp" ? "btn-whats" : "btn-primary"}`}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Enviando pedido…
              </>
            ) : form.payment === "pix" ? (
              "Finalizar e pagar com Pix"
            ) : form.payment === "cartao" ? (
              "Finalizar pedido"
            ) : (
              "Finalizar e enviar no WhatsApp"
            )}
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[12.5px] text-ink-mute">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Seus dados são usados apenas para este pedido.
          </p>
        </div>
      </aside>
    </form>
  );
}
