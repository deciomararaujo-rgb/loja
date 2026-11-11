import { getProductsByIds } from "@/lib/store";

export const dynamic = "force-dynamic";

// Devolve os dados atuais (preço, nome, foto) dos produtos da sacola.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Number.isFinite) : [];
  const rows = await getProductsByIds(ids);
  return Response.json({
    products: rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      priceCents: p.priceCents,
      imageUrl: p.imageUrl,
      categorySlug: p.categorySlug,
    })),
  });
}
