import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { guard } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { ensureSeeded } from "@/lib/store";

export const dynamic = "force-dynamic";

const bad = (error: string, status = 400) => Response.json({ error }, { status });
const str = (v: unknown, max: number) => (typeof v === "string" ? v.normalize("NFC").trim().slice(0, max) : "");

export async function GET(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  await ensureSeeded();
  const rows = await db.select().from(categories).orderBy(asc(categories.sort), asc(categories.id));
  const counts = await db
    .select({ slug: products.categorySlug, total: sql<number>`count(*)::int` })
    .from(products)
    .groupBy(products.categorySlug);
  const map = new Map(counts.map((c) => [c.slug, Number(c.total)]));
  return Response.json({ categories: rows.map((c) => ({ ...c, productCount: map.get(c.slug) ?? 0 })) });
}

export async function POST(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const name = str(body.name, 60);
  if (!name) return bad("Informe o nome da categoria.");

  const existing = await db.select().from(categories);
  const taken = new Set(existing.map((c) => c.slug));
  const base = slugify(name) || "categoria";
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  const sort = existing.reduce((max, c) => Math.max(max, c.sort), 0) + 1;

  const [row] = await db
    .insert(categories)
    .values({ name, slug, tagline: str(body.tagline, 200), sort })
    .returning();
  return Response.json({ category: { ...row, productCount: 0 } });
}

export async function PUT(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const id = Number(body.id);
  const name = str(body.name, 60);
  if (!Number.isInteger(id)) return bad("Categoria inválida.");
  if (!name) return bad("Informe o nome da categoria.");
  const sort = Math.round(Number(body.sort));
  const [row] = await db
    .update(categories)
    .set({ name, tagline: str(body.tagline, 200), ...(Number.isFinite(sort) ? { sort } : {}),
      ...(typeof body.hidden === "boolean" ? { hidden: body.hidden } : {}),
      ...(typeof body.onHome === "boolean" ? { onHome: body.onHome } : {}),
    })
    .where(eq(categories.id, id))
    .returning();
  return row ? Response.json({ category: row }) : bad("Categoria não encontrada.", 404);
}

export async function DELETE(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return bad("Categoria inválida.");
  const [cat] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!cat) return bad("Categoria não encontrada.", 404);
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.categorySlug, cat.slug));
  if (Number(total) > 0) {
    return bad(
      `Esta categoria ainda tem ${total} produto(s). Mova ou exclua os produtos antes de apagar a categoria.`,
      409,
    );
  }
  await db.delete(categories).where(eq(categories.id, id));
  return Response.json({ ok: true });
}
