"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2, Plus, Send, Trash2 } from "lucide-react";
import { Field, ImageUpload, Loading, moneyInput, parseMoney, Toggle, useAdmin, type AdminCategory, type AdminProduct } from "./admin-ui";

type Banner = { image: string; href: string; label: string; video?: string };
const message = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

function Block({ title, text, children }: { title: string; text?: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-8">
      <h2 className="font-display text-[1.7rem] font-medium leading-tight">{title}</h2>
      {text ? <p className="mt-1.5 max-w-2xl text-[14.5px] text-ink-soft">{text}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

type LinkOption = { value: string; label: string };

/** Editor de uma lista de imagens com link (carrossel ou seções da página inicial). */
function LinkedImages({
  items,
  onChange,
  categories,
  products,
  shape,
  max,
  nameLabel,
  addLabel,
  removeLabel,
}: {
  items: Banner[];
  onChange: (next: Banner[]) => void;
  categories: LinkOption[];
  products: LinkOption[];
  shape: "portrait" | "wide";
  max: number;
  nameLabel: string;
  addLabel: string;
  removeLabel: string;
}) {
  const set = (index: number, patch: Partial<Banner>) => onChange(items.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  const known = (href: string) => categories.some((c) => c.value === href) || products.some((p) => p.value === href);

  return (
    <>
      <ul className="space-y-4">
        {items.map((b, i) => (
          <li key={i} className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
            <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
              <ImageUpload value={b.image} onChange={(url) => set(i, { image: url })} shape={shape} />
              <div className="grid gap-3">
                <Field label={nameLabel}>
                  <input value={b.label} onChange={(e) => set(i, { label: e.target.value })} className="field h-11" maxLength={60} />
                </Field>
                <Field label="Ao clicar, abrir">
                  <select value={b.href} onChange={(e) => set(i, { href: e.target.value })} className="field h-11">
                    {b.href && !known(b.href) ? <option value={b.href}>Link atual ({b.href})</option> : null}
                    <optgroup label="Seções">
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </optgroup>
                    {products.length ? (
                      <optgroup label="Produtos">
                        {products.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                  </select>
                </Field>
              </div>
            </div>
            {b.video ? (
              <p className="mt-3 rounded-xl bg-white px-3 py-2.5 text-[12.5px] leading-snug text-ink-soft">
                Este destaque é um <strong className="font-semibold text-ink">vídeo</strong>. A imagem acima só aparece enquanto ele carrega. Para
                trocar o vídeo, envie o novo arquivo para quem cuida do site.{" "}
                <button type="button" onClick={() => set(i, { video: undefined })} className="link-underline font-medium text-ink">
                  Usar só a imagem
                </button>
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-[13px] font-medium text-ink-mute transition hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              {removeLabel}
            </button>
          </li>
        ))}
      </ul>
      {items.length < max ? (
        <button
          type="button"
          className="btn btn-soft mt-4 min-h-11 px-5"
          onClick={() => onChange([...items, { image: "", href: categories[0]?.value ?? "/", label: "" }])}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {addLabel}
        </button>
      ) : null}
    </>
  );
}

export default function AdminSettings({ onToken }: { onToken: (token: string) => void }) {
  const { api, toast } = useAdmin();
  const [s, setS] = useState<Record<string, string> | null>(null);
  const [shipping, setShipping] = useState("");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [slides, setSlides] = useState<Banner[]>([]);
  const [prods, setProds] = useState<AdminProduct[]>([]);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const apply = useCallback((raw: Record<string, string>) => {
    setS(raw);
    setShipping(moneyInput(Number(raw.shippingCents) || 0));
    const read = (value: string | undefined): Banner[] => {
      try {
        const list = JSON.parse(value ?? "[]");
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    };
    setBanners(read(raw.banners));
    setSlides(read(raw.slides));
    setDirty(false);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [a, b, c] = await Promise.all([
          api<{ settings: Record<string, string> }>("/api/admin/settings"),
          api<{ categories: AdminCategory[] }>("/api/admin/categories"),
          api<{ products: AdminProduct[] }>("/api/admin/products"),
        ]);
        apply(a.settings);
        setCats(b.categories);
        setProds(c.products);
      } catch (err) {
        toast(message(err, "Não foi possível carregar os ajustes."), "error");
      }
    })();
  }, [api, toast, apply]);

  const set = (key: string, value: string) => {
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
  };

  async function save() {
    if (!s) return;
    const shippingCents = parseMoney(shipping || "0");
    if (!Number.isFinite(shippingCents)) {
      toast("Confira o valor do frete. Exemplo: 14,00", "error");
      return;
    }
    if ([...banners, ...slides].some((b) => !b.image)) {
      toast("Envie a imagem de todos os itens (topo e seções) ou remova os que estão vazios.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await api<{ settings: Record<string, string> }>("/api/admin/settings", {
        method: "PUT",
        body: { ...s, shippingCents, banners: JSON.stringify(banners), slides: JSON.stringify(slides) },
      });
      apply(res.settings);
      toast("Ajustes salvos. A loja já está atualizada.");
    } catch (err) {
      toast(message(err, "Não foi possível salvar os ajustes."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function testWhatsApp() {
    if (dirty) {
      toast("Salve os ajustes antes de enviar o teste.", "error");
      return;
    }
    setTesting(true);
    try {
      const res = await api<{ sent: boolean; reason?: string }>("/api/admin/notifications", { method: "POST", body: { action: "test-whatsapp" } });
      if (res.sent) toast("Mensagem de teste enviada. Confira o WhatsApp.");
      else if (res.reason === "not-configured") toast("Informe o número e a chave de API e salve antes de testar.", "error");
      else toast("O serviço de mensagens não aceitou o envio. Confira a chave de API.", "error");
    } catch (err) {
      toast(message(err, "Não foi possível enviar o teste."), "error");
    } finally {
      setTesting(false);
    }
  }

  async function changePassword() {
    setPwError("");
    if (pw.next.length < 8) return setPwError("A nova senha precisa ter pelo menos 8 caracteres.");
    if (pw.next !== pw.confirm) return setPwError("A confirmação não é igual à nova senha.");
    setPwBusy(true);
    try {
      const res = await api<{ token: string }>("/api/admin/session", { method: "PUT", body: { currentPassword: pw.current, newPassword: pw.next } });
      onToken(res.token);
      setPw({ current: "", next: "", confirm: "" });
      toast("Senha alterada com sucesso.");
    } catch (err) {
      setPwError(message(err, "Não foi possível trocar a senha."));
    } finally {
      setPwBusy(false);
    }
  }

  if (!s) return <Loading text="Carregando ajustes…" />;

  const text = (key: string, props: { placeholder?: string; maxLength?: number; inputMode?: "text" | "numeric" | "tel" } = {}) => (
    <input value={s[key] ?? ""} onChange={(e) => set(key, e.target.value)} className="field" {...props} />
  );
  const categoryLinks = cats.map((c) => ({
    value: `/categoria/${c.slug}`,
    label: c.hidden ? `${c.name} (fora da loja)` : c.name,
    hidden: c.hidden,
  }));
  const hiddenSlugs = new Set(cats.filter((c) => c.hidden).map((c) => c.slug));
  const productLinks = prods
    .filter((p) => p.active && !hiddenSlugs.has(p.categorySlug))
    .map((p) => ({ value: `/produto/${p.slug}`, label: p.brand ? `${p.name} · ${p.brand}` : p.name }));

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Ajustes</p>
        <h1 className="display mt-2 text-[clamp(2.2rem,5vw,3.2rem)]">Configurações da loja</h1>
        <p className="mt-2 text-[15px] text-ink-soft">Mude temas, frete, Pix e WhatsApp sem mexer em código.</p>
      </div>

      <Block title="Loja" text="A página inicial mostra os vídeos e as fotos do topo, as imagens das seções e uma vitrine de produtos de cada seção (os produtos em destaque aparecem primeiro). A faixa de aviso aparece no topo das outras páginas.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome da loja">{text("storeName", { maxLength: 60 })}</Field>
          <Field label="Faixa de aviso no topo" hint="Deixe em branco para esconder a faixa.">
            {text("announcement", { maxLength: 160 })}
          </Field>
        </div>
      </Block>

      <Block
        title="Topo da página inicial (vídeos e fotos)"
        text="Os destaques que ocupam a primeira tela da página inicial e passam sozinhos, na ordem em que estão aqui: primeiro os vídeos, depois as fotos. Cada um abre a seção ou o produto escolhido. As três fotos que vieram com o site preenchem a tela inteira (o fundo delas foi continuado); uma foto nova enviada por aqui aparece inteira, com o fundo desfocado em volta."
      >
        <LinkedImages
          items={slides}
          onChange={(next) => {
            setSlides(next);
            setDirty(true);
          }}
          categories={categoryLinks.filter((c) => !c.hidden)}
          products={productLinks}
          shape="wide"
          max={8}
          nameLabel="Nome da imagem"
          addLabel="Adicionar imagem"
          removeLabel="Remover imagem"
        />
      </Block>

      <Block
        title="Seções em destaque na página inicial"
        text="As imagens das seções, logo abaixo dos vídeos e fotos do topo, de ponta a ponta da tela. Só aparecem as das seções marcadas com “Na página inicial” em Produtos → Categorias. Use imagens em pé (4:5), já com o nome escrito."
      >
        <LinkedImages
          items={banners}
          onChange={(next) => {
            setBanners(next);
            setDirty(true);
          }}
          categories={categoryLinks}
          products={[]}
          shape="portrait"
          max={12}
          nameLabel="Nome do tema"
          addLabel="Adicionar tema"
          removeLabel="Remover tema"
        />
      </Block>

      <Block title="Entrega" text="Frete fixo por J3Flex e opção de retirada.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Valor do frete (R$)">
            <input
              value={shipping}
              onChange={(e) => {
                setShipping(e.target.value);
                setDirty(true);
              }}
              inputMode="decimal"
              className="field"
              placeholder="14,00"
            />
          </Field>
          <Field label="Prazo de entrega (dias úteis)">{text("shippingDays", { inputMode: "numeric", maxLength: 2 })}</Field>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-sand-50 p-4 sm:col-span-2">
            <div>
              <p className="text-[14.5px] font-semibold">Retirada em Jandira</p>
              <p className="text-[13px] text-ink-mute">A cliente combina tudo pelo WhatsApp, sem pagar frete no site.</p>
            </div>
            <Toggle checked={s.pickupEnabled !== "0"} onChange={(v) => set("pickupEnabled", v ? "1" : "0")} label="Retirada em Jandira" />
          </div>
        </div>
      </Block>

      <Block title="Pagamento" text="O Pix cai direto na chave abaixo. No cartão, a cliente pede o link de pagamento pelo WhatsApp.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Chave Pix" className="sm:col-span-2" hint="E-mail, CPF/CNPJ, celular ou chave aleatória. Confira com atenção: é para onde o dinheiro vai.">
            {text("pixKey", { maxLength: 120 })}
          </Field>
          <Field label="Nome do recebedor" hint="Como aparece no app do banco.">
            {text("pixName", { maxLength: 60 })}
          </Field>
          <Field label="Cidade do recebedor">{text("pixCity", { maxLength: 40 })}</Field>
          <Field label="Máximo de parcelas no cartão">{text("maxInstallments", { inputMode: "numeric", maxLength: 2 })}</Field>
          <Field label="Parcelas sem juros" hint="Use 1 para não anunciar parcelamento sem juros.">
            {text("interestFree", { inputMode: "numeric", maxLength: 2 })}
          </Field>
        </div>
      </Block>

      <Block title="WhatsApp" text="Número que atende as clientes e número que recebe os avisos de compra.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="WhatsApp de atendimento" hint="Usado no botão “Tirar dúvidas” e no envio dos pedidos. Com 55 + DDD.">
            {text("whatsappNumber", { inputMode: "tel", maxLength: 20 })}
          </Field>
          <Field label="WhatsApp para avisos de compra" hint="Recebe uma mensagem automática a cada novo pedido. Com 55 + DDD.">
            {text("notifyNumber", { inputMode: "tel", maxLength: 20 })}
          </Field>
          <Field
            label="Chave de API do CallMeBot"
            className="sm:col-span-2"
            hint={
              <>
                Para o aviso automático funcionar, o número acima precisa autorizar o serviço gratuito CallMeBot uma única vez e
                receber uma chave.{" "}
                <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener noreferrer" className="link-underline font-medium text-ink">
                  Ver passo a passo
                </a>
                . Sem a chave, os avisos continuam chegando aqui no painel.
              </>
            }
          >
            {text("callmebotKey", { maxLength: 80, placeholder: "Cole aqui a chave recebida no WhatsApp" })}
          </Field>
        </div>
        <button type="button" className="btn btn-soft mt-5 min-h-11 px-5" onClick={testWhatsApp} disabled={testing}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          Enviar mensagem de teste
        </button>
      </Block>

      <Block title="Segurança" text="Troque a senha do painel sempre que achar necessário. Use pelo menos 8 caracteres.">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Senha atual">
            <input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className="field" />
          </Field>
          <Field label="Nova senha">
            <input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className="field" />
          </Field>
          <Field label="Repita a nova senha">
            <input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className="field" />
          </Field>
        </div>
        {pwError ? (
          <p role="alert" className="mt-3 text-[14px] text-red-600">
            {pwError}
          </p>
        ) : null}
        <button type="button" className="btn btn-dark mt-5 min-h-11 px-6" onClick={changePassword} disabled={pwBusy || !pw.current || !pw.next}>
          {pwBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Trocar senha
        </button>
      </Block>

      <div className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-20 flex items-center justify-between gap-4 rounded-full border border-sand-200 bg-cream/95 py-2 pl-6 pr-2 shadow-soft backdrop-blur lg:bottom-6">
        <p className="text-[14px] text-ink-soft">{dirty ? "Você tem alterações não salvas." : "Tudo salvo."}</p>
        <button type="button" className="btn btn-primary min-h-11 px-6" onClick={save} disabled={saving || !dirty}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Salvar alterações
        </button>
      </div>
    </div>
  );
}
