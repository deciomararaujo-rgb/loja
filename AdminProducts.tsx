"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Download, Loader2, Package, Pencil, Plus, Search, Star, Tags, Trash2 } from "lucide-react";
import { formatBRL, normalizeText } from "@/lib/format";
import ProductImage from "../ProductImage";
import PhotoImport from "./PhotoImport";
import {
  Confirm,
  Empty,
  Field,
  ImageUpload,
  Loading,
  Modal,
  moneyInput,
  parseMoney,
  Toggle,
  useAdmin,
  type AdminCategory,
  type AdminProduct,
} from "./admin-ui";

type Draft = {
  id?: number;
  name: string;
  brand: string;
  categorySlug: string;
  subcategory: string;
  price: string;
  description: string;
  imageUrl: string;
  active: boolean;
  featured: boolean;
};

const message = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

/* ───────── Categorias ───────── */

function CategoryRow({
  cat,
  first,
  last,
  onSave,
  onMove,
  onDelete,
  onVisible,
  onHome,
}: {
  cat: AdminCategory;
  first: boolean;
  last: boolean;
  onSave: (name: string, tagline: string) => Promise<void>;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onVisible: (visible: boolean) => void;
  onHome: (value: boolean) => void;
}) {
  const [name, setName] = useState(cat.name);
  const [tagline, setTagline] = useState(cat.tagline);
  const [busy, setBusy] = useState(false);
  const changed = name.trim() !== cat.name || tagline.trim() !== cat.tagline;
  const arrow = "grid h-10 w-10 place-items-center rounded-full text-ink-soft transition hover:bg-sand-100 disabled:opacity-30";

  return (
    <li className="rounded-2xl border border-sand-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Nome da categoria" className="field h-11 font-semibold" maxLength={60} />
        <button type="button" className={arrow} onClick={() => onMove(-1)} disabled={first} aria-label="Mover para cima">
          <ChevronUp className="h-5 w-5" />
        </button>
        <button type="button" className={arrow} onClick={() => onMove(1)} disabled={last} aria-label="Mover para baixo">
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
      <input value={tagline} onChange={(e) => setTagline(e.target.value)} aria-label="Frase da categoria" placeholder="Frase curta que aparece no topo da categoria" className="field mt-2 h-11 text-[14.5px]" maxLength={200} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between gap-2 rounded-xl bg-sand-50 px-3 py-2">
          <span className="text-[12.5px] leading-tight text-ink-soft">Na loja</span>
          <Toggle checked={!cat.hidden} onChange={onVisible} label={`${cat.name} aparece na loja`} />
        </div>
        <div className="flex items-center justify-between gap-2 rounded-xl bg-sand-50 px-3 py-2">
          <span className="text-[12.5px] leading-tight text-ink-soft">Na página inicial</span>
          <Toggle
            checked={cat.onHome && !cat.hidden}
            onChange={onHome}
            label={`${cat.name} aparece na página inicial`}
            disabled={cat.hidden}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-mute">
          {cat.productCount} {cat.productCount === 1 ? "produto" : "produtos"}
        </p>
        <div className="flex items-center gap-2">
          {changed ? (
            <button
              type="button"
              className="btn btn-primary min-h-10 px-5"
              disabled={busy || !name.trim()}
              onClick={async () => {
                setBusy(true);
                await onSave(name.trim(), tagline.trim());
                setBusy(false);
              }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Salvar
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDelete}
            disabled={cat.productCount > 0}
            title={cat.productCount > 0 ? "Mova ou exclua os produtos antes de apagar a categoria" : "Apagar categoria"}
            aria-label={`Apagar categoria ${cat.name}`}
            className="grid h-10 w-10 place-items-center rounded-full text-ink-mute transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-mute"
          >
            <Trash2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </li>
  );
}

/* ───────── Produtos ───────── */

export default function AdminProducts() {
  const { api, toast } = useAdmin();
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [newCat, setNewCat] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        api<{ products: AdminProduct[] }>("/api/admin/products"),
        api<{ categories: AdminCategory[] }>("/api/admin/categories"),
      ]);
      setProducts(p.products);
      setCategories(c.categories);
    } catch (err) {
      toast(message(err, "Não foi possível carregar os produtos."), "error");
    }
  }, [api, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const catName = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories]);
  const hiddenCats = useMemo(() => new Set(categories.filter((c) => c.hidden).map((c) => c.slug)), [categories]);
  const list = useMemo(() => {
    const term = normalizeText(q.trim());
    return (products ?? []).filter((p) => {
      if (cat && p.categorySlug !== cat) return false;
      return !term || normalizeText(`${p.name} ${p.brand} ${p.subcategory}`).includes(term);
    });
  }, [products, q, cat]);
  const lines = useMemo(() => {
    if (!draft) return [];
    return [...new Set((products ?? []).filter((p) => p.categorySlug === draft.categorySlug && p.subcategory).map((p) => p.subcategory))];
  }, [products, draft]);

  const [photosOpen, setPhotosOpen] = useState(false);
  const closePhotos = useCallback(() => setPhotosOpen(false), []);
  const closeDraft = useCallback(() => setDraft(null), []);
  const closeCats = useCallback(() => setCatsOpen(false), []);

  const openNew = () => {
    setFormError("");
    setDraft({
      name: "",
      brand: "",
      categorySlug: cat || categories[0]?.slug || "",
      subcategory: "",
      price: "",
      description: "",
      imageUrl: "",
      active: true,
      featured: false,
    });
  };
  const openEdit = (p: AdminProduct) => {
    setFormError("");
    setDraft({ ...p, price: moneyInput(p.priceCents) });
  };

  async function save() {
    if (!draft) return;
    const priceCents = parseMoney(draft.price);
    if (!draft.name.trim()) return setFormError("Informe o nome do produto.");
    if (!draft.categorySlug) return setFormError("Escolha uma categoria.");
    if (!Number.isFinite(priceCents)) return setFormError("Informe o preço. Exemplo: 230,00");
    setSaving(true);
    setFormError("");
    try {
      const body = { ...draft, priceCents };
      const res = await api<{ product: AdminProduct }>("/api/admin/products", { method: draft.id ? "PUT" : "POST", body });
      setProducts((prev) => {
        if (!prev) return prev;
        return draft.id ? prev.map((p) => (p.id === draft.id ? res.product : p)) : [...prev, res.product];
      });
      toast(draft.id ? "Produto atualizado." : "Produto cadastrado.");
      setDraft(null);
      if (!draft.id) load();
    } catch (err) {
      setFormError(message(err, "Não foi possível salvar o produto."));
    } finally {
      setSaving(false);
    }
  }

  async function quick(p: AdminProduct, patch: { active?: boolean; featured?: boolean }) {
    setProducts((prev) => (prev ? prev.map((x) => (x.id === p.id ? { ...x, ...patch } : x)) : prev));
    try {
      await api("/api/admin/products", { method: "PUT", body: { id: p.id, quick: true, ...patch } });
      if (patch.active !== undefined) toast(patch.active ? `“${p.name}” está visível na loja.` : `“${p.name}” foi ocultado da loja.`);
      if (patch.featured !== undefined) toast(patch.featured ? `“${p.name}” entrou nos destaques.` : `“${p.name}” saiu dos destaques.`);
    } catch (err) {
      setProducts((prev) => (prev ? prev.map((x) => (x.id === p.id ? p : x)) : prev));
      toast(message(err, "Não foi possível atualizar o produto."), "error");
    }
  }

  async function remove() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/admin/products?id=${toDelete.id}`, { method: "DELETE" });
      setProducts((prev) => (prev ? prev.filter((p) => p.id !== toDelete.id) : prev));
      toast(`“${toDelete.name}” foi excluído.`);
      setToDelete(null);
      setDraft(null);
      load();
    } catch (err) {
      toast(message(err, "Não foi possível excluir o produto."), "error");
    } finally {
      setDeleting(false);
    }
  }

  /* categorias */
  async function saveCategory(c: AdminCategory, name: string, tagline: string, sort = c.sort) {
    try {
      await api("/api/admin/categories", { method: "PUT", body: { id: c.id, name, tagline, sort } });
      await load();
      toast("Categoria atualizada.");
    } catch (err) {
      toast(message(err, "Não foi possível salvar a categoria."), "error");
    }
  }
  async function moveCategory(index: number, dir: -1 | 1) {
    const a = categories[index];
    const b = categories[index + dir];
    if (!a || !b) return;
    try {
      const [sa, sb] = a.sort === b.sort ? [index + dir + 1, index + 1] : [b.sort, a.sort];
      await api("/api/admin/categories", { method: "PUT", body: { id: a.id, name: a.name, tagline: a.tagline, sort: sa } });
      await api("/api/admin/categories", { method: "PUT", body: { id: b.id, name: b.name, tagline: b.tagline, sort: sb } });
      await load();
    } catch (err) {
      toast(message(err, "Não foi possível reordenar."), "error");
    }
  }
  async function addCategory() {
    if (!newCat.trim()) return;
    try {
      await api("/api/admin/categories", { method: "POST", body: { name: newCat.trim() } });
      setNewCat("");
      await load();
      toast("Categoria criada. Ela já aparece no menu da loja.");
    } catch (err) {
      toast(message(err, "Não foi possível criar a categoria."), "error");
    }
  }
  async function setCategoryVisible(c: AdminCategory, visible: boolean) {
    try {
      await api("/api/admin/categories", {
        method: "PUT",
        body: { id: c.id, name: c.name, tagline: c.tagline, sort: c.sort, hidden: !visible },
      });
      await load();
      toast(
        visible
          ? `“${c.name}” voltou a aparecer na loja.`
          : `“${c.name}” saiu da loja. Os produtos continuam guardados aqui no painel.`,
      );
    } catch (err) {
      toast(message(err, "Não foi possível atualizar a categoria."), "error");
    }
  }

  async function setCategoryHome(c: AdminCategory, value: boolean) {
    try {
      await api("/api/admin/categories", {
        method: "PUT",
        body: { id: c.id, name: c.name, tagline: c.tagline, sort: c.sort, onHome: value },
      });
      await load();
      toast(
        value
          ? `“${c.name}” voltou a aparecer na página inicial.`
          : `“${c.name}” saiu da página inicial. Continua no menu e na loja.`,
      );
    } catch (err) {
      toast(message(err, "Não foi possível atualizar a categoria."), "error");
    }
  }

  async function deleteCategory(c: AdminCategory) {
    try {
      await api(`/api/admin/categories?id=${c.id}`, { method: "DELETE" });
      await load();
      toast("Categoria apagada.");
    } catch (err) {
      toast(message(err, "Não foi possível apagar a categoria."), "error");
    }
  }

  if (!products) return <Loading text="Carregando produtos…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Produtos</p>
          <h1 className="display mt-2 text-[clamp(2.2rem,5vw,3.2rem)]">Catálogo da loja</h1>
          <p className="mt-2 text-[15px] text-ink-soft">
            {products.length} produtos cadastrados · {products.filter((p) => !p.imageUrl).length} sem foto
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button type="button" className="btn btn-soft min-h-11 whitespace-nowrap px-4 tracking-[0.1em] sm:px-5" onClick={() => setCatsOpen(true)}>
            <Tags className="h-4 w-4 shrink-0" aria-hidden />
            Categorias
          </button>
          <button type="button" className="btn btn-primary min-h-11 whitespace-nowrap px-4 tracking-[0.1em] sm:px-5" onClick={openNew}>
            <Plus className="h-4 w-4" aria-hidden />
            Novo produto
          </button>
          <button type="button" className="btn btn-soft col-span-2 min-h-11 whitespace-nowrap px-4 tracking-[0.1em] sm:px-5" onClick={() => setPhotosOpen(true)}>
            <Download className="h-4 w-4 shrink-0" aria-hidden />
            Fotos do GitHub
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <span className="sr-only">Buscar produto</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, marca ou linha" className="field h-11 rounded-full pl-11" />
        </label>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filtrar por categoria" className="field h-11 rounded-full sm:w-60">
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c.productCount})
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <Empty icon={<Package className="h-6 w-6" strokeWidth={1.5} />} title="Nenhum produto encontrado" text="Tente outra busca ou cadastre um novo produto." />
      ) : (
        <ul className="space-y-2.5">
          {list.map((p) => (
            <li key={p.id} className={`card flex items-center gap-3 p-3 sm:gap-4 sm:p-4 ${p.active ? "" : "opacity-70"}`}>
              <button type="button" onClick={() => openEdit(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4" aria-label={`Editar ${p.name}`}>
                <span className="block h-[72px] w-[58px] shrink-0 overflow-hidden rounded-xl bg-sand-100">
                  <ProductImage src={p.imageUrl} alt="" category={p.categorySlug} compact />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold">{p.name}</span>
                  <span className="block truncate text-[13px] text-ink-mute">
                    {[p.brand, catName.get(p.categorySlug) ?? p.categorySlug, p.subcategory].filter(Boolean).join(" · ")}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-[14.5px] font-semibold tabular-nums">
                    {formatBRL(p.priceCents)}
                    {!p.active ? <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-stone-600">Oculto</span> : null}
                    {!p.imageUrl ? <span className="rounded-full bg-flame-50 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-flame-700">Sem foto</span> : null}
                    {hiddenCats.has(p.categorySlug) ? <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-stone-600">Seção fora da loja</span> : null}
                    {p.priceCents <= 0 ? <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-stone-600">Sob consulta</span> : null}
                  </span>
                </span>
              </button>
              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => quick(p, { featured: !p.featured })}
                  aria-pressed={p.featured}
                  aria-label={p.featured ? "Tirar dos destaques" : "Colocar nos destaques"}
                  title={p.featured ? "Em destaque: aparece primeiro na categoria e na página inicial" : "Colocar em destaque"}
                  className={`hidden h-11 w-11 place-items-center rounded-full transition hover:bg-sand-100 sm:grid ${p.featured ? "text-flame-500" : "text-sand-400"}`}
                >
                  <Star className="h-5 w-5" fill={p.featured ? "currentColor" : "none"} />
                </button>
                <Toggle checked={p.active} onChange={(v) => quick(p, { active: v })} label={`${p.name} visível na loja`} />
                <button type="button" onClick={() => openEdit(p)} aria-label={`Editar ${p.name}`} className="hidden h-11 w-11 place-items-center rounded-full text-ink-soft transition hover:bg-sand-100 sm:grid">
                  <Pencil className="h-[18px] w-[18px]" />
                </button>
                <button type="button" onClick={() => setToDelete(p)} aria-label={`Excluir ${p.name}`} className="hidden h-11 w-11 place-items-center rounded-full text-ink-mute transition hover:bg-red-50 hover:text-red-600 sm:grid">
                  <Trash2 className="h-[18px] w-[18px]" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Cadastro / edição */}
      <Modal
        open={Boolean(draft)}
        title={draft?.id ? "Editar produto" : "Novo produto"}
        onClose={closeDraft}
        wide
        footer={
          draft ? (
            <>
              {draft.id ? (
                <button
                  type="button"
                  className="btn btn-soft text-red-600 hover:border-red-400 hover:text-red-700 sm:mr-auto"
                  onClick={() => setToDelete(products.find((p) => p.id === draft.id) ?? null)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Excluir
                </button>
              ) : null}
              <button type="button" className="btn btn-soft" onClick={closeDraft}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {draft.id ? "Salvar alterações" : "Cadastrar produto"}
              </button>
            </>
          ) : null
        }
      >
        {draft ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="label">Foto do produto</p>
              <ImageUpload value={draft.imageUrl} onChange={(url) => setDraft({ ...draft, imageUrl: url })} />
            </div>
            <Field label="Nome do produto" className="sm:col-span-2">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="field" maxLength={140} placeholder="Ex.: Yara Tradicional" />
            </Field>
            <Field label="Marca">
              <input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} className="field" maxLength={100} placeholder="Ex.: Lattafa" />
            </Field>
            <Field label="Preço (R$)" hint="Use 0 para mostrar “Preço sob consulta”.">
              <input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} inputMode="decimal" className="field" placeholder="230,00" />
            </Field>
            <Field label="Categoria">
              <select value={draft.categorySlug} onChange={(e) => setDraft({ ...draft, categorySlug: e.target.value })} className="field">
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Linha (opcional)" hint="Cria um filtro dentro da categoria. Ex.: Karseell, Kits.">
              <input value={draft.subcategory} onChange={(e) => setDraft({ ...draft, subcategory: e.target.value })} className="field" maxLength={100} list="linhas-existentes" />
              <datalist id="linhas-existentes">
                {lines.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </Field>
            <Field label="Descrição" className="sm:col-span-2">
              <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={5} maxLength={4000} className="field h-auto py-3" placeholder="Fale das notas, da ocasião de uso, do tamanho…" />
            </Field>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-sand-50 p-4">
              <div>
                <p className="text-[14.5px] font-semibold">Visível na loja</p>
                <p className="text-[13px] text-ink-mute">Desative para ocultar sem excluir.</p>
              </div>
              <Toggle checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} label="Visível na loja" />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-sand-50 p-4">
              <div>
                <p className="text-[14.5px] font-semibold">Destaque</p>
                <p className="text-[13px] text-ink-mute">Aparece primeiro na categoria e na página inicial.</p>
              </div>
              <Toggle checked={draft.featured} onChange={(v) => setDraft({ ...draft, featured: v })} label="Destaque" />
            </div>
            {formError ? (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700 sm:col-span-2">
                {formError}
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* Categorias */}
      <Modal open={catsOpen} title="Categorias do menu" onClose={closeCats}>
        <p className="text-[14.5px] text-ink-soft">Renomeie, reordene ou crie categorias. A ordem daqui é a ordem do menu da loja. “Na página inicial” controla se a seção aparece no início do site (imagem e vitrine); fora dela, a seção continua no menu.</p>
        <ul className="mt-4 space-y-3">
          {categories.map((c, i) => (
            <CategoryRow
              key={`${c.id}-${c.name}-${c.tagline}`}
              cat={c}
              first={i === 0}
              last={i === categories.length - 1}
              onSave={(name, tagline) => saveCategory(c, name, tagline)}
              onMove={(dir) => moveCategory(i, dir)}
              onDelete={() => deleteCategory(c)}
              onVisible={(visible) => setCategoryVisible(c, visible)}
              onHome={(value) => setCategoryHome(c, value)}
            />
          ))}
        </ul>
        <div className="mt-5 flex gap-2">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCategory();
              }
            }}
            aria-label="Nome da nova categoria"
            placeholder="Nova categoria"
            className="field h-11"
            maxLength={60}
            enterKeyHint="done"
          />
          <button type="button" onClick={addCategory} className="btn btn-primary min-h-11 shrink-0 px-5" disabled={!newCat.trim()}>
            <Plus className="h-4 w-4" aria-hidden />
            Criar
          </button>
        </div>
      </Modal>

      <PhotoImport open={photosOpen} onClose={closePhotos} onDone={load} />

      <Confirm
        open={Boolean(toDelete)}
        title="Excluir produto?"
        text={toDelete ? `“${toDelete.name}” será removido da loja para sempre. Para só esconder, desative “Visível na loja”.` : ""}
        action="Excluir produto"
        busy={deleting}
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
