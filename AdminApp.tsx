"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageCircle,
  Package,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { formatBRL, formatDateTime, ORDER_STATUS, PAID_STATUSES } from "@/lib/format";
import AdminOrders from "./AdminOrders";
import AdminProducts from "./AdminProducts";
import AdminSettings from "./AdminSettings";
import { AdminCtx, Empty, Loading, useAdmin, type AdminNotice, type AdminOrder, type Api } from "./admin-ui";

const TOKEN_KEY = "pi-admin-token";

type Tab = "inicio" | "pedidos" | "produtos" | "avisos" | "ajustes";
const TABS: { id: Tab; label: string; icon: typeof Bell }[] = [
  { id: "inicio", label: "Início", icon: LayoutDashboard },
  { id: "pedidos", label: "Pedidos", icon: ShoppingBag },
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "avisos", label: "Avisos", icon: Bell },
  { id: "ajustes", label: "Ajustes", icon: Settings },
];

const NOTICE_ICON: Record<string, typeof Bell> = {
  pedido: ShoppingBag,
  pagamento: Wallet,
  whatsapp: MessageCircle,
  acesso: KeyRound,
  seguranca: ShieldAlert,
};

function beep() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    osc.onended = () => ctx.close();
  } catch {
    /* som indisponível */
  }
}

function Logo({ className }: { className: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/logo-preta.webp" alt="Perfumes Imports" width={900} height={351} className={className} />;
}

/* ───────── Entrada ───────── */

function Login({ onToken, notice }: { onToken: (token: string) => void; notice?: string }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);

  // Entra pelo toque no botão ou pela tecla Enter, sem depender do envio nativo de formulário:
  // alguns navegadores bloqueiam esse envio quando o site está aberto dentro de outra página (pré-visualização).
  async function submit() {
    if (sending.current) return;
    const value = password.trim();
    if (!value) {
      setError("Digite a senha para entrar.");
      return;
    }
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        onToken(data.token);
        return;
      }
      setError(data.error ?? "Não foi possível entrar agora. Aguarde um instante e tente de novo.");
    } catch {
      setError("Não foi possível falar com a loja. Confira sua internet, aguarde um instante e tente de novo.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-sand-100 px-5 py-10">
      <div className="w-full max-w-md">
        <Logo className="mx-auto h-20 w-auto" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          noValidate
          className="card mt-8 p-7 shadow-soft sm:p-9"
        >
          <p className="eyebrow">Área restrita</p>
          <h1 className="display mt-3 text-[2.5rem]">Painel da loja</h1>
          <p className="mt-2 text-[15px] text-ink-soft">Entre com a senha para gerenciar produtos, pedidos e configurações.</p>

          {notice && !error ? (
            <p role="status" className="mt-5 rounded-xl bg-flame-50 px-4 py-3 text-[14px] text-flame-700">
              {notice}
            </p>
          ) : null}

          <label htmlFor="senha" className="label mt-7">
            Senha
          </label>
          <div className="relative">
            <input
              id="senha"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              autoFocus
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "senha-erro" : undefined}
              className={`field pr-12 ${error ? "field-error" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Esconder senha" : "Mostrar senha"}
              className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-lg text-ink-mute transition hover:text-ink"
            >
              {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
          {error ? (
            <p id="senha-erro" role="alert" className="mt-2 text-[13.5px] text-red-600">
              {error}
            </p>
          ) : null}

          <button type="button" onClick={submit} disabled={busy} className="btn btn-primary mt-6 w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <a href="/" className="mt-6 block text-center text-[14px] text-ink-mute transition hover:text-flame-700">
          ← Voltar para a loja
        </a>
      </div>
    </main>
  );
}

/* ───────── Visão geral ───────── */

function StatusBadge({ status }: { status: string }) {
  const s = ORDER_STATUS[status] ?? ORDER_STATUS.aguardando;
  return <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.tone}`}>{s.label}</span>;
}

function Overview({
  orders,
  notices,
  go,
  openOrder,
}: {
  orders: AdminOrder[] | null;
  notices: AdminNotice[];
  go: (tab: Tab) => void;
  openOrder: (code: string) => void;
}) {
  const stats = useMemo(() => {
    const list = orders ?? [];
    const now = new Date();
    const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    const sum = (rows: AdminOrder[]) => rows.reduce((n, o) => n + o.totalCents, 0);
    const paid = list.filter((o) => PAID_STATUSES.includes(o.status));
    const monthPaid = paid.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const today = list.filter((o) => o.status !== "cancelado" && sameDay(new Date(o.createdAt), now));
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      return {
        label: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        total: sum(paid.filter((o) => sameDay(new Date(o.createdAt), d))),
      };
    });
    return {
      monthRevenue: sum(monthPaid),
      monthCount: monthPaid.length,
      todayCount: today.length,
      todayTotal: sum(today),
      waiting: list.filter((o) => o.status === "aguardando").length,
      ticket: paid.length ? Math.round(sum(paid) / paid.length) : 0,
      days,
      maxDay: Math.max(1, ...days.map((d) => d.total)),
    };
  }, [orders]);

  if (!orders) return <Loading />;

  const cards = [
    { label: "Vendas pagas no mês", value: formatBRL(stats.monthRevenue), hint: `${stats.monthCount} ${stats.monthCount === 1 ? "pedido pago" : "pedidos pagos"}` },
    { label: "Pedidos de hoje", value: String(stats.todayCount), hint: formatBRL(stats.todayTotal) },
    { label: "Aguardando pagamento", value: String(stats.waiting), hint: stats.waiting ? "Confira e confirme" : "Tudo em dia" },
    { label: "Ticket médio", value: formatBRL(stats.ticket), hint: "Pedidos pagos" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Visão geral</p>
        <h1 className="display mt-2 text-[clamp(2.2rem,5vw,3.2rem)]">Olá! Veja como está a loja</h1>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {cards.map((c) => (
          <li key={c.label} className="card p-4 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-mute">{c.label}</p>
            <p className="mt-3 text-[1.45rem] font-semibold leading-none tabular-nums text-ink sm:text-[1.9rem]">{c.value}</p>
            <p className="mt-2 text-[13px] text-ink-mute">{c.hint}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="card p-5 sm:p-7">
          <h2 className="font-display text-[1.6rem] font-medium">Vendas pagas nos últimos 7 dias</h2>
          <div className="mt-6 flex h-44 items-end gap-2 sm:gap-4" role="img" aria-label="Gráfico de vendas dos últimos 7 dias">
            {stats.days.map((d, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[10.5px] tabular-nums text-ink-mute sm:text-[11.5px]">{d.total ? formatBRL(d.total).replace(",00", "") : ""}</span>
                <span
                  className={`w-full rounded-t-lg transition-all duration-700 ${d.total ? "bg-flame-500" : "bg-sand-200"}`}
                  style={{ height: `${Math.max(4, (d.total / stats.maxDay) * 100)}%` }}
                />
                <span className="text-[11.5px] capitalize text-ink-mute">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[1.6rem] font-medium">Avisos recentes</h2>
            <button type="button" onClick={() => go("avisos")} className="link-underline text-[13px] font-medium">
              Ver todos
            </button>
          </div>
          {notices.length === 0 ? (
            <p className="mt-5 text-[14.5px] text-ink-mute">Tudo o que acontecer na loja aparece aqui.</p>
          ) : (
            <ul className="mt-4 divide-y divide-sand-200">
              {notices.slice(0, 4).map((n) => (
                <li key={n.id} className="flex items-start gap-3 py-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-sand-300" : "bg-flame-500"}`} />
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-medium leading-snug">{n.title}</p>
                    <p className="text-[12.5px] text-ink-mute">{formatDateTime(n.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[1.6rem] font-medium">Últimos pedidos</h2>
          <button type="button" onClick={() => go("pedidos")} className="link-underline text-[13px] font-medium">
            Ver todos
          </button>
        </div>
        {orders.length === 0 ? (
          <p className="mt-5 text-[14.5px] text-ink-mute">Nenhum pedido ainda. Assim que alguém comprar, o pedido aparece aqui.</p>
        ) : (
          <ul className="mt-3 divide-y divide-sand-200">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => openOrder(o.code)} className="flex w-full items-center gap-3 py-3.5 text-left transition hover:bg-sand-50 sm:gap-5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{o.customerName}</span>
                    <span className="block text-[12.5px] text-ink-mute">
                      {o.code} · {formatDateTime(o.createdAt)}
                    </span>
                  </span>
                  <StatusBadge status={o.status} />
                  <span className="w-24 shrink-0 text-right text-[15px] font-semibold tabular-nums">{formatBRL(o.totalCents)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ───────── Avisos ───────── */

function Notices({
  notices,
  unread,
  reload,
  openOrder,
}: {
  notices: AdminNotice[];
  unread: number;
  reload: () => Promise<void>;
  openOrder: (code: string) => void;
}) {
  const { api, toast } = useAdmin();

  const act = async (body: Record<string, unknown>) => {
    try {
      await api("/api/admin/notifications", { method: "POST", body });
      await reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível atualizar os avisos.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Avisos</p>
          <h1 className="display mt-2 text-[clamp(2.2rem,5vw,3.2rem)]">Tudo o que acontece na loja</h1>
          <p className="mt-2 text-[15px] text-ink-soft">
            {unread > 0 ? `${unread} ${unread === 1 ? "aviso novo" : "avisos novos"}.` : "Nenhum aviso novo."} Esta página atualiza
            sozinha.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-soft min-h-11 px-5" onClick={() => act({ action: "read-all" })} disabled={unread === 0}>
            Marcar como lidos
          </button>
          <button type="button" className="btn btn-soft min-h-11 px-5" onClick={() => act({ action: "clear" })} disabled={!notices.some((n) => n.read)}>
            Limpar lidos
          </button>
        </div>
      </div>

      {notices.length === 0 ? (
        <Empty icon={<Bell className="h-6 w-6" strokeWidth={1.5} />} title="Sem avisos por enquanto" text="Novos pedidos, pagamentos informados e acessos ao painel aparecem aqui." />
      ) : (
        <ul className="space-y-2.5">
          {notices.map((n) => {
            const Icon = NOTICE_ICON[n.type] ?? Bell;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={async () => {
                    if (!n.read) await act({ action: "read", id: n.id });
                    if (n.orderCode) openOrder(n.orderCode);
                  }}
                  className={`flex w-full items-start gap-4 rounded-[1.25rem] border p-4 text-left transition hover:border-flame-400 sm:p-5 ${
                    n.read ? "border-sand-200 bg-white" : "border-flame-100 bg-flame-50/70"
                  }`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${n.read ? "bg-sand-100 text-ink-mute" : "bg-flame-600 text-white"}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-snug">{n.title}</span>
                    {n.message ? <span className="mt-0.5 block text-[14px] text-ink-soft">{n.message}</span> : null}
                    <span className="mt-1 block text-[12.5px] text-ink-mute">
                      {formatDateTime(n.createdAt)}
                      {n.orderCode ? " · toque para abrir o pedido" : ""}
                    </span>
                  </span>
                  {!n.read ? <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-flame-500" aria-label="Não lido" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ───────── Aplicativo do painel ───────── */

export default function AdminApp() {
  const [token, setTokenState] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("inicio");
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [notices, setNotices] = useState<AdminNotice[]>([]);
  const [unread, setUnread] = useState(0);
  const [focusCode, setFocusCode] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; tone: "ok" | "error" }[]>([]);
  const [loginNotice, setLoginNotice] = useState("");
  const tokenRef = useRef<string | null>(null);
  const lastUnread = useRef<number | null>(null);
  const toastId = useRef(0);

  const setToken = useCallback((value: string | null) => {
    tokenRef.current = value;
    setTokenState(value);
    try {
      if (value) localStorage.setItem(TOKEN_KEY, value);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignora */
    }
    if (!value) {
      setOrders(null);
      setNotices([]);
      setUnread(0);
      lastUnread.current = null;
    }
  }, []);

  const toast = useCallback((message: string, tone: "ok" | "error" = "ok") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4800);
  }, []);

  const api = useCallback<Api>(
    async (path, init) => {
      const res = await fetch(path, {
        method: init?.method ?? "GET",
        cache: "no-store",
        headers: {
          "x-admin-token": tokenRef.current ?? "",
          ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setLoginNotice("Sua sessão expirou. Entre de novo com a senha.");
        setToken(null);
        throw new Error("Sua sessão expirou. Entre novamente.");
      }
      if (!res.ok) throw new Error(data.error ?? "Algo deu errado. Tente novamente.");
      return data;
    },
    [setToken],
  );

  // Recupera a sessão salva neste aparelho.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(TOKEN_KEY);
    } catch {
      /* ignora */
    }
    if (!saved) {
      setChecking(false);
      return;
    }
    // Se a loja demorar a responder, a tela não fica presa em "Abrindo o painel…".
    const abort = new AbortController();
    const timer = window.setTimeout(() => abort.abort(), 8000);
    fetch("/api/admin/session", { headers: { "x-admin-token": saved }, cache: "no-store", signal: abort.signal })
      .then((r) => {
        if (r.ok) setToken(saved);
        else if (r.status === 401) {
          setToken(null);
          setLoginNotice("Sua sessão anterior expirou. Entre de novo com a senha.");
        } else setLoginNotice("Não foi possível conferir sua sessão agora. Entre de novo com a senha.");
      })
      .catch(() => setLoginNotice("Não foi possível conferir sua sessão agora. Entre de novo com a senha."))
      .finally(() => {
        window.clearTimeout(timer);
        setChecking(false);
      });
  }, [setToken]);

  const refresh = useCallback(
    async (withOrders: boolean) => {
      try {
        const n = await api<{ items: AdminNotice[]; unread: number }>("/api/admin/notifications");
        setNotices(n.items);
        setUnread(n.unread);
        const isNew = lastUnread.current !== null && n.unread > lastUnread.current;
        lastUnread.current = n.unread;
        if (isNew) {
          toast(n.items[0]?.title ?? "Novo aviso na loja");
          beep();
        }
        if (withOrders || isNew) {
          const o = await api<{ orders: AdminOrder[] }>("/api/admin/orders");
          setOrders(o.orders);
        }
      } catch {
        /* tenta de novo na próxima atualização */
      }
    },
    [api, toast],
  );

  // Atualiza avisos e pedidos sozinho a cada 20 segundos.
  useEffect(() => {
    if (!token) return;
    refresh(true);
    const timer = window.setInterval(() => refresh(false), 20_000);
    return () => window.clearInterval(timer);
  }, [token, refresh]);

  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) Painel da loja` : "Painel da loja";
  }, [unread]);

  const ctx = useMemo(() => ({ api, toast }), [api, toast]);
  const openOrder = useCallback((code: string) => {
    setFocusCode(code);
    setTab("pedidos");
  }, []);
  const clearFocus = useCallback(() => setFocusCode(null), []);
  const reloadAll = useCallback(() => refresh(true), [refresh]);

  if (checking) {
    return (
      <main className="grid min-h-dvh place-items-center bg-sand-100">
        <Loading text="Abrindo o painel…" />
      </main>
    );
  }
  if (!token) {
    return (
      <Login
        notice={loginNotice}
        onToken={(value) => {
          setLoginNotice("");
          setToken(value);
        }}
      />
    );
  }

  return (
    <AdminCtx.Provider value={ctx}>
      <div className="min-h-dvh bg-sand-50 lg:pl-[264px]">
        {/* Menu lateral (computador) */}
        <aside className="fixed inset-y-0 left-0 hidden w-[264px] flex-col border-r border-sand-200 bg-cream lg:flex">
          <div className="px-7 pb-6 pt-8">
            <Logo className="h-14 w-auto" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-ink-mute">Painel da loja</p>
          </div>
          <nav aria-label="Seções do painel" className="flex-1 space-y-1 px-4">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className={`flex h-12 w-full items-center gap-3 rounded-xl px-4 text-[15px] font-medium transition ${
                  tab === id ? "bg-flame-600 text-white shadow-[0_12px_26px_-14px_rgba(196,87,11,0.8)]" : "text-ink-soft hover:bg-sand-100"
                }`}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} aria-hidden />
                {label}
                {id === "avisos" && unread > 0 ? (
                  <span className={`ml-auto grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11.5px] font-semibold ${tab === id ? "bg-white text-flame-700" : "bg-flame-600 text-white"}`}>
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
          <div className="space-y-1 border-t border-sand-200 p-4">
            <a href="/" target="_blank" rel="noopener noreferrer" className="flex h-11 items-center gap-3 rounded-xl px-4 text-[14.5px] text-ink-soft transition hover:bg-sand-100">
              <ExternalLink className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden />
              Ver a loja
            </a>
            <button type="button" onClick={() => setToken(null)} className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-[14.5px] text-ink-soft transition hover:bg-sand-100">
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden />
              Sair
            </button>
          </div>
        </aside>

        {/* Topo (celular) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sand-200 bg-cream/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <Logo className="h-10 w-auto" />
          <div className="flex items-center gap-1">
            <a href="/" target="_blank" rel="noopener noreferrer" aria-label="Ver a loja" className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition hover:bg-sand-100">
              <ExternalLink className="h-5 w-5" strokeWidth={1.7} />
            </a>
            <button type="button" onClick={() => setToken(null)} aria-label="Sair do painel" className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition hover:bg-sand-100">
              <LogOut className="h-5 w-5" strokeWidth={1.7} />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-14 lg:pt-10">
          {tab === "inicio" ? <Overview orders={orders} notices={notices} go={setTab} openOrder={openOrder} /> : null}
          {tab === "pedidos" ? <AdminOrders orders={orders} setOrders={setOrders} focusCode={focusCode} clearFocus={clearFocus} /> : null}
          {tab === "produtos" ? <AdminProducts /> : null}
          {tab === "avisos" ? <Notices notices={notices} unread={unread} reload={reloadAll} openOrder={openOrder} /> : null}
          {tab === "ajustes" ? <AdminSettings onToken={setToken} /> : null}
        </main>

        {/* Abas (celular) */}
        <nav aria-label="Seções do painel" className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-sand-200 bg-cream/95 pt-1.5 backdrop-blur lg:hidden">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`relative flex min-h-[52px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                tab === id ? "text-flame-700" : "text-ink-mute"
              }`}
            >
              <span className="relative">
                <Icon className="h-[22px] w-[22px]" strokeWidth={tab === id ? 2 : 1.6} aria-hidden />
                {id === "avisos" && unread > 0 ? (
                  <span className="absolute -right-2.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-flame-600 px-1 text-[10px] font-semibold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </span>
              {label}
            </button>
          ))}
        </nav>

        {/* Mensagens rápidas */}
        <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-24 z-[90] flex flex-col items-center gap-2 lg:inset-x-auto lg:bottom-8 lg:right-8 lg:items-end">
          {toasts.map((t) => (
            <p
              key={t.id}
              role="status"
              className={`pointer-events-auto max-w-sm animate-rise rounded-2xl px-5 py-3.5 text-[14.5px] font-medium shadow-soft ${
                t.tone === "error" ? "bg-red-600 text-white" : "bg-ink text-cream"
              }`}
            >
              {t.message}
            </p>
          ))}
        </div>
      </div>
    </AdminCtx.Provider>
  );
}
