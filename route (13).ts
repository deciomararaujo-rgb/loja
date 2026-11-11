import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { guard } from "@/lib/auth";
import { ensureSeeded, uniqueProductSlug } from "@/lib/store";

export const dynamic = "force-dynamic";

const bad = (error: string, status = 400) => Response.json({ error }, { status });
const str = (v: unknown, max: number) => (typeof v === "string" ? v.normalize("NFC").trim().slice(0, max) : "");

function parse(body: Record<string, unknown>) {
  const name = str(body.name, 140);
  const categorySlug = str(body.categorySlug, 80);
  const priceCents = Math.round(Number(body.priceCents));
  const imageUrl = str(body.imageUrl, 500);
  if (!name) return { error: "Informe o nome do produto." };
  if (!categorySlug) return { error: "Escolha a categoria do produto." };
  if (!Number.isFinite(priceCents) || priceCents < 0 || priceCents > 100_000_000) {
    return { error: "Informe um preço válido." };
  }
  if (imageUrl && !/^(\/|https:\/\/)/.test(imageUrl)) {
    return { error: "O endereço da foto precisa começar com https://" };
  }
  return {
    data: {
      name,
      brand: str(body.brand, 100),
      categorySlug,
      subcategory: str(body.subcategory, 100),
      priceCents,
      description: str(body.description, 4000),
      imageUrl,
      active: body.active !== false,
      featured: body.featured === true,
    },
  };
}

export async function GET(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  await ensureSeeded();
  const rows = await db.select().from(products).orderBy(asc(products.sort), asc(products.id));
  return Response.json({ products: rows });
}

export async function POST(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const parsed = parse(body);
  if (parsed.error || !parsed.data) return bad(parsed.error ?? "Dados inválidos.");

  const slug = await uniqueProductSlug(parsed.data.name);
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${products.sort}), 0)` }).from(products);
  const [row] = await db
    .insert(products)
    .values({ ...parsed.data, slug, sort: Number(max) + 1 })
    .returning();
  return Response.json({ product: row });
}

export async function PUT(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const id = Number(body.id);
  if (!Number.isInteger(id)) return bad("Produto inválido.");

  // Alterações rápidas (ativar/desativar, destaque) sem reenviar o produto inteiro.
  if (body.quick === true) {
    const patch: { active?: boolean; featured?: boolean } = {};
    if (typeof body.active === "boolean") patch.active = body.active;
    if (typeof body.featured === "boolean") patch.featured = body.featured;
    if (!Object.keys(patch).length) return bad("Nada para alterar.");
    const [row] = await db.update(products).set(patch).where(eq(products.id, id)).returning();
    return row ? Response.json({ product: row }) : bad("Produto não encontrado.", 404);
  }

  const parsed = parse(body);
  if (parsed.error || !parsed.data) return bad(parsed.error ?? "Dados inválidos.");
  const [row] = await db.update(products).set(parsed.data).where(eq(products.id, id)).returning();
  return row ? Response.json({ product: row }) : bad("Produto não encontrado.", 404);
}

export async function DELETE(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return bad("Produto inválido.");
  await db.delete(products).where(eq(products.id, id));
  return Response.json({ ok: true });
}
