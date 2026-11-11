import { cache } from "react";
import { and, asc, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, settings } from "@/db/schema";
import { PRODUCT_PHOTOS } from "@/db/photos";
import {
  DEFAULT_BANNERS,
  DEFAULT_SETTINGS,
  DEFAULT_SLIDES,
  DESCRIPTION_FIXES,
  DESCRIPTION_FIXES_V4,
  OFF_HOME_CATEGORIES,
  PRODUCT_UPDATES_V3,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_V3_COUNT,
} from "@/db/seed-data";
import { SHIPPING_CENTS, STORE_CITY, STORE_PIX_KEY, STORE_WHATSAPP } from "@/lib/store-info";
import { normalizeText, onlyDigits, slugify } from "@/lib/format";

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
/** Imagem com link. No topo da página inicial pode ter também um vídeo (a imagem vira a cena de espera). */
export type Banner = { image: string; href: string; label: string; video?: string };

export type StoreSettings = {
  storeName: string;
  announcement: string;
  whatsappNumber: string;
  notifyNumber: string;
  callmebotKey: string;
  pixKey: string;
  pixName: string;
  pixCity: string;
  shippingCents: number;
  shippingDays: number;
  maxInstallments: number;
  interestFree: number;
  pickupEnabled: boolean;
  /** Temas (imagens das seções) da página inicial. */
  banners: Banner[];
  /** Destaques do topo da página inicial: vídeos e fotos, na ordem em que passam. */
  slides: Banner[];
};

/* ───────── Preparação automática do banco (tabelas + catálogo inicial) ───────── */

const DDL = [
  `create table if not exists categories (id serial primary key, slug text not null, name text not null, tagline text not null default '', sort integer not null default 0, constraint categories_slug_unique unique (slug))`,
  `create table if not exists products (id serial primary key, slug text not null, name text not null, brand text not null default '', category_slug text not null, subcategory text not null default '', price_cents integer not null, description text not null default '', image_url text not null default '', active boolean not null default true, featured boolean not null default false, sort integer not null default 0, created_at timestamptz not null default now(), constraint products_slug_unique unique (slug))`,
  `create table if not exists orders (id serial primary key, code text not null, customer_name text not null, customer_phone text not null, customer_email text not null default '', delivery_method text not null, cep text not null default '', street text not null default '', number text not null default '', complement text not null default '', neighborhood text not null default '', city text not null default '', state text not null default '', payment_method text not null, installments integer not null default 1, subtotal_cents integer not null, shipping_cents integer not null default 0, total_cents integer not null, status text not null default 'aguardando', notes text not null default '', items jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), constraint orders_code_unique unique (code))`,
  `create table if not exists notifications (id serial primary key, type text not null, title text not null, message text not null default '', order_code text not null default '', read boolean not null default false, created_at timestamptz not null default now())`,
  `create table if not exists settings (key text primary key, value text not null)`,
  `create table if not exists images (id serial primary key, mime text not null, data text not null, created_at timestamptz not null default now())`,
  `alter table categories add column if not exists hidden boolean not null default false`,
  `alter table categories add column if not exists on_home boolean not null default true`,
];

let seeding: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seeding) {
    seeding = runSeed().catch((err) => {
      seeding = null;
      throw err;
    });
  }
  return seeding;
}

// Versões dos dados que vêm com o site. Cada bloco roda uma única vez em cada loja.
const DATA_V2 = "data_v2"; // fotos dos produtos e temas da página inicial
const DATA_V3 = "data_v3"; // novos masculinos
const DATA_V6 = "data_v6"; // vídeos e fotos juntos no topo da página inicial
const DATA_V5 = "data_v5"; // vídeos no topo da página inicial
const DATA_V7 = "data_v7"; // novo contato, endereço, Pix e frete J3Flex
const DATA_V4 = "data_v4"; // seções fora da página inicial (continuam na loja) e descrições completas
const OLD_BANNERS = ["/banners/1.jpg", "/banners/2.jpg", "/banners/3.jpg", "/banners/4.jpg"];

/** Produtos do catálogo inicial, com o endereço (slug), a ordem e a foto de cada um. */
function seedRows() {
  const used = new Set<string>();
  return SEED_PRODUCTS.map((item, index) => {
    const base = slugify(item.name) || `produto-${index + 1}`;
    let slug = base;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    used.add(slug);
    return { ...item, slug, sort: index + 1, imageUrl: PRODUCT_PHOTOS[slug] ?? "" };
  });
}

async function runSeed() {
  for (const statement of DDL) await db.execute(sql.raw(statement));
  const flags = await db.select().from(settings).where(inArray(settings.key, ["seeded", DATA_V2, DATA_V3, DATA_V4, DATA_V5, DATA_V6, DATA_V7]));
  const has = (key: string) => flags.some((f) => f.key === key);

  if (!has("seeded")) {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(7710011)`);
      const again = await tx.select().from(settings).where(eq(settings.key, "seeded")).limit(1);
      if (again.length) return;

      await tx.insert(categories).values(SEED_CATEGORIES).onConflictDoNothing();
      await tx.insert(products).values(seedRows()).onConflictDoNothing();
      await tx.insert(settings).values({ key: "seeded", value: "1" }).onConflictDoNothing();
    });
  }

  if (!has(DATA_V2)) {
    // Loja já criada: coloca as fotos nos produtos que ainda não têm e ajusta textos que não foram editados no painel.
    for (const [slug, url] of Object.entries(PRODUCT_PHOTOS)) {
      await db
        .update(products)
        .set({ imageUrl: url })
        .where(and(eq(products.slug, slug), eq(products.imageUrl, "")));
    }
    for (const fix of DESCRIPTION_FIXES) {
      await db
        .update(products)
        .set({ description: fix.to })
        .where(and(eq(products.slug, fix.slug), eq(products.description, fix.from)));
    }
    // Se os temas salvos ainda são só as 4 imagens originais, passa a usar a lista completa.
    const [saved] = await db.select().from(settings).where(eq(settings.key, "banners")).limit(1);
    if (saved) {
      const list = parseBanners(saved.value, DEFAULT_BANNERS);
      if (list.length === 4 && list.every((b) => OLD_BANNERS.includes(b.image))) {
        await db.delete(settings).where(eq(settings.key, "banners"));
      }
    }
    await db.insert(settings).values({ key: DATA_V2, value: "1" }).onConflictDoNothing();
  }

  if (!has(DATA_V3)) {
    // 1) Novos masculinos. Entram só os produtos desta versão, para não trazer de volta nada que a loja tenha excluído.
    await db.insert(products).values(seedRows().slice(-SEED_V3_COUNT)).onConflictDoNothing();

    // 2) Preço e texto atualizados pela loja, só onde o produto não foi alterado no painel.
    for (const update of PRODUCT_UPDATES_V3) {
      await db
        .update(products)
        .set({ priceCents: update.priceCents })
        .where(and(eq(products.slug, update.slug), eq(products.priceCents, update.fromPriceCents)));
      await db
        .update(products)
        .set({ description: update.description })
        .where(and(eq(products.slug, update.slug), eq(products.description, update.fromDescription)));
    }
    await db.insert(settings).values({ key: DATA_V3, value: "1" }).onConflictDoNothing();
  }

  if (!has(DATA_V4)) {
    // Todas as seções ficam na loja (menu, busca e páginas próprias). Estas só deixam de aparecer na página inicial.
    await db
      .update(categories)
      .set({ hidden: false, onHome: false })
      .where(inArray(categories.slug, OFF_HOME_CATEGORIES));
    // Descrições completadas, só onde o texto não foi editado no painel.
    for (const fix of DESCRIPTION_FIXES_V4) {
      await db
        .update(products)
        .set({ description: fix.to })
        .where(and(eq(products.slug, fix.slug), eq(products.description, fix.from)));
    }
    await db.insert(settings).values({ key: DATA_V4, value: "1" }).onConflictDoNothing();
  }

  if (!has(DATA_V5)) {
    // O topo da página inicial passou a ser em vídeo: a lista de imagens do carrossel salva antes deixa de valer.
    await db.delete(settings).where(eq(settings.key, "slides"));
    await db.insert(settings).values({ key: DATA_V5, value: "1" }).onConflictDoNothing();
  }

  if (!has(DATA_V6)) {
    // Vídeos e fotos passaram a ficar juntos no topo, em uma lista só: as listas salvas antes deixam de valer.
    await db.delete(settings).where(inArray(settings.key, ["slides", "carousel"]));
    await db.insert(settings).values({ key: DATA_V6, value: "1" }).onConflictDoNothing();
  }

  if (!has(DATA_V7)) {
    // Contato, Pix e frete novos: substituem os valores salvos antes. Depois disso continuam editáveis no painel.
    const patch: Record<string, string> = {
      whatsappNumber: STORE_WHATSAPP,
      notifyNumber: STORE_WHATSAPP,
      pixKey: STORE_PIX_KEY,
      pixName: DEFAULT_SETTINGS.pixName,
      pixCity: STORE_CITY,
      shippingCents: String(SHIPPING_CENTS),
      announcement: DEFAULT_SETTINGS.announcement,
    };
    for (const [key, value] of Object.entries(patch)) {
      await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
    }
    await db.insert(settings).values({ key: DATA_V7, value: "1" }).onConflictDoNothing();
  }
}

/* ───────── Configurações ───────── */

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);

export async function getRawSettings(): Promise<Record<string, string>> {
  await ensureSeeded();
  const rows = await db.select().from(settings).where(inArray(settings.key, SETTING_KEYS));
  const merged: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) merged[row.key] = row.value;
  return merged;
}

const toInt = (value: string, fallback: number, min: number, max: number) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Lê uma lista de imagens com link (temas ou carrossel) salva nas configurações. */
export function parseBanners(raw: string, fallback: Banner[]): Banner[] {
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return fallback;
    return list
      .filter((b) => b && typeof b.image === "string" && typeof b.href === "string")
      .map((b) => ({
        image: String(b.image),
        href: String(b.href),
        label: String(b.label ?? ""),
        ...(typeof b.video === "string" && /^(\/|https:\/\/)/.test(b.video) ? { video: b.video as string } : {}),
      }))
      .filter((b) => /^(\/|https:\/\/)/.test(b.image) && b.href.startsWith("/"))
      .slice(0, 12);
  } catch {
    return fallback;
  }
}

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const raw = await getRawSettings();
  return {
    storeName: raw.storeName || DEFAULT_SETTINGS.storeName,
    announcement: raw.announcement,
    whatsappNumber: onlyDigits(raw.whatsappNumber) || DEFAULT_SETTINGS.whatsappNumber,
    notifyNumber: onlyDigits(raw.notifyNumber),
    callmebotKey: raw.callmebotKey.trim(),
    pixKey: raw.pixKey.trim(),
    pixName: raw.pixName.trim(),
    pixCity: raw.pixCity.trim(),
    shippingCents: toInt(raw.shippingCents, 1400, 0, 1_000_000),
    shippingDays: toInt(raw.shippingDays, 2, 0, 60),
    maxInstallments: toInt(raw.maxInstallments, 12, 1, 24),
    interestFree: toInt(raw.interestFree, 1, 1, 24),
    pickupEnabled: raw.pickupEnabled !== "0",
    banners: parseBanners(raw.banners, DEFAULT_BANNERS),
    slides: parseBanners(raw.slides, DEFAULT_SLIDES),
  };
});

export async function saveSettings(patch: Record<string, string>) {
  await ensureSeeded();
  for (const [key, value] of Object.entries(patch)) {
    if (!SETTING_KEYS.includes(key)) continue;
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }
}

/* ───────── Catálogo ───────── */

/** Todas as categorias, inclusive as retiradas da loja (uso do painel). */
export const getAllCategories = cache(async (): Promise<Category[]> => {
  await ensureSeeded();
  return db.select().from(categories).orderBy(asc(categories.sort), asc(categories.id));
});

/** Categorias que aparecem na loja. */
export const getCategories = cache(async (): Promise<Category[]> => (await getAllCategories()).filter((c) => !c.hidden));

const hiddenSlugs = async () => (await getAllCategories()).filter((c) => c.hidden).map((c) => c.slug);

/**
 * Produtos. Sem `includeInactive`, devolve só o que a loja mostra:
 * produtos ativos de seções que não foram retiradas da loja.
 */
export async function getProducts(
  opts: { category?: string; includeInactive?: boolean; featured?: boolean; limit?: number } = {},
): Promise<Product[]> {
  await ensureSeeded();
  const conds = [];
  if (!opts.includeInactive) {
    conds.push(eq(products.active, true));
    const hidden = await hiddenSlugs();
    if (hidden.length) conds.push(notInArray(products.categorySlug, hidden));
  }
  if (opts.category) conds.push(eq(products.categorySlug, opts.category));
  if (opts.featured) conds.push(eq(products.featured, true));
  const rows = await db
    .select()
    .from(products)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(products.featured), asc(products.sort), asc(products.id));
  return opts.limit ? rows.slice(0, opts.limit) : rows;
}

/** Produtos que a loja mostra. Uma única consulta por página, compartilhada entre o topo e o conteúdo. */
export const getActiveProducts = cache(async (): Promise<Product[]> => getProducts());

export async function getProductBySlug(slug: string): Promise<Product | null> {
  await ensureSeeded();
  const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/** Produtos da sacola: só os que continuam à venda na loja. */
export async function getProductsByIds(ids: number[]): Promise<Product[]> {
  await ensureSeeded();
  const clean = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))].slice(0, 100);
  if (!clean.length) return [];
  const conds = [inArray(products.id, clean), eq(products.active, true)];
  const hidden = await hiddenSlugs();
  if (hidden.length) conds.push(notInArray(products.categorySlug, hidden));
  return db.select().from(products).where(and(...conds));
}

/** Busca tolerante a acentos e maiúsculas em nome, marca, linha e descrição. */
export async function searchProducts(query: string): Promise<Product[]> {
  const tokens = normalizeText(query).split(/\s+/).filter(Boolean).slice(0, 6);
  if (!tokens.length) return [];
  const all = await getProducts();
  return all.filter((item) => {
    const hay = normalizeText(`${item.name} ${item.brand} ${item.subcategory} ${item.description}`);
    return tokens.every((t) => hay.includes(t));
  });
}

export async function uniqueProductSlug(name: string, ignoreId?: number) {
  const base = slugify(name) || "produto";
  const rows = await db.select({ id: products.id, slug: products.slug }).from(products);
  const taken = new Set(rows.filter((r) => r.id !== ignoreId).map((r) => r.slug));
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  return slug;
}
