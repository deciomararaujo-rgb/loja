import { db } from "@/db";
import { images } from "@/db/schema";
import { guard } from "@/lib/auth";
import { ensureSeeded } from "@/lib/store";

export const dynamic = "force-dynamic";

// Recebe uma foto (já reduzida no navegador) e guarda no banco de dados.
export async function POST(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  await ensureSeeded();

  const body = (await req.json().catch(() => null)) as { dataUrl?: unknown } | null;
  const dataUrl = typeof body?.dataUrl === "string" ? body.dataUrl : "";
  const comma = dataUrl.indexOf(",");
  const head = comma > 0 ? dataUrl.slice(0, comma) : "";
  const match = /^data:(image\/(?:jpeg|png|webp));base64$/.exec(head);
  const data = comma > 0 ? dataUrl.slice(comma + 1) : "";

  if (!match || !data || !/^[A-Za-z0-9+/]+=*$/.test(data.slice(0, 2000))) {
    return Response.json({ error: "Envie uma imagem JPG, PNG ou WebP." }, { status: 400 });
  }
  if (data.length > 4_000_000) {
    return Response.json({ error: "Imagem muito grande. Tente uma foto menor." }, { status: 413 });
  }

  const [row] = await db.insert(images).values({ mime: match[1], data }).returning({ id: images.id });
  return Response.json({ url: `/api/img/${row.id}` });
}
