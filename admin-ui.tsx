"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";

/* ───────── Tipos ───────── */

export type AdminOrder = {
  id: number;
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
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
  status: string;
  notes: string;
  items: { productId: number; slug: string; name: string; brand: string; priceCents: number; qty: number; imageUrl: string; categorySlug: string }[];
  createdAt: string;
  updatedAt: string;
};

export type AdminProduct = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  subcategory: string;
  priceCents: number;
  description: string;
  imageUrl: string;
  active: boolean;
  featured: boolean;
  sort: number;
};

export type AdminCategory = { id: number; slug: string; name: string; tagline: string; sort: number; hidden: boolean; onHome: boolean; productCount: number };
export type AdminNotice = { id: number; type: string; title: string; message: string; orderCode: string; read: boolean; createdAt: string };

export type Api = <T = unknown>(path: string, init?: { method?: string; body?: unknown }) => Promise<T>;
type AdminContext = { api: Api; toast: (message: string, tone?: "ok" | "error") => void };

export const AdminCtx = createContext<AdminContext | null>(null);
export function useAdmin() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error("useAdmin fora do painel");
  return ctx;
}

/* ───────── Dinheiro ───────── */

export function parseMoney(input: string) {
  let s = input.replace(/[^\d.,]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (!/^\d+\.\d{1,2}$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return s && Number.isFinite(n) ? Math.round(n * 100) : NaN;
}
export const moneyInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

/* ───────── Componentes ───────── */

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add("scroll-lock");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.classList.remove("scroll-lock");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade bg-ink/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[92dvh] w-full animate-rise flex-col rounded-t-[1.75rem] bg-cream shadow-2xl sm:rounded-[1.75rem] ${
          wide ? "sm:max-w-3xl" : "sm:max-w-xl"
        }`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-sand-200 px-5 py-4 sm:px-7">
          <h2 className="font-display text-[1.6rem] font-medium leading-tight">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full transition hover:bg-sand-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">{children}</div>
        {footer ? (
          <div className="safe-bottom flex flex-col-reverse gap-2.5 border-t border-sand-200 px-5 pt-4 sm:flex-row sm:justify-end sm:px-7 sm:pb-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Confirm({
  open,
  title,
  text,
  action,
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  text: string;
  action: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-soft" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn bg-red-600 text-white hover:bg-red-700" onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {action}
          </button>
        </>
      }
    >
      <p className="text-[15.5px] text-ink-soft">{text}</p>
    </Modal>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[12.5px] leading-snug text-ink-mute">{hint}</span> : null}
    </label>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${checked ? "bg-flame-600" : "bg-sand-300"}`}
    >
      <span className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

export function Loading({ text = "Carregando…" }: { text?: string }) {
  return (
    <div role="status" className="grid place-items-center py-24 text-ink-mute">
      <Loader2 className="h-7 w-7 animate-spin text-flame-600" aria-hidden />
      <p className="mt-3 text-[14.5px]">{text}</p>
    </div>
  );
}

export function Empty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-sand-300 bg-white px-6 py-14 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sand-100 text-flame-600">{icon}</span>
      <p className="mt-4 font-display text-[1.5rem] font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[14.5px] text-ink-mute">{text}</p>
    </div>
  );
}

/** Reduz a foto no próprio aparelho antes de enviar (fica leve e carrega rápido na loja). */
async function fileToDataUrl(file: File, maxSide = 1400, quality = 0.86): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Não foi possível ler esta imagem."));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível processar a imagem.");
    ctx.fillStyle = "#f6eee2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ImageUpload({ value, onChange, shape = "portrait" }: { value: string; onChange: (url: string) => void; shape?: "portrait" | "square" | "wide" }) {
  const { api, toast } = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await api<{ url: string }>("/api/admin/upload", { method: "POST", body: { dataUrl } });
      onChange(res.url);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível enviar a foto.", "error");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className={`relative shrink-0 overflow-hidden rounded-2xl border border-sand-200 bg-sand-100 ${shape === "portrait" ? "h-[120px] w-24" : shape === "wide" ? "h-[72px] w-36" : "h-24 w-24"}`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Foto atual" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-sand-400">
            <ImagePlus className="h-7 w-7" strokeWidth={1.4} aria-hidden />
          </span>
        )}
        {busy ? (
          <span className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="h-6 w-6 animate-spin text-flame-600" aria-label="Enviando foto" />
          </span>
        ) : null}
      </div>
      <div className="flex flex-col items-start gap-2">
        <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0])} />
        <button type="button" className="btn btn-soft min-h-11 px-5" onClick={() => input.current?.click()} disabled={busy}>
          <ImagePlus className="h-4 w-4" aria-hidden />
          {value ? "Trocar foto" : "Enviar foto"}
        </button>
        {value ? (
          <button type="button" onClick={() => onChange("")} className="inline-flex min-h-9 items-center gap-1.5 text-[13px] font-medium text-ink-mute transition hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Remover foto
          </button>
        ) : (
          <p className="text-[12.5px] text-ink-mute">JPG ou PNG, direto da galeria.</p>
        )}
      </div>
    </div>
  );
}
