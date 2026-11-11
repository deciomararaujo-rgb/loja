import { eq } from "drizzle-orm";
import { db } from "@/db";
import { images } from "@/db/schema";
import { ensureSeeded } from "@/lib/store";

export const dynamic = "force-dynamic";

// Serve as fotos enviadas pelo painel (guardadas no banco de dados).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) return new Response("Imagem não encontrada", { status: 404 });

  await ensureSeeded();
  const [row] = await db.select().from(images).where(eq(images.id, n)).limit(1);
  if (!row) return new Response("Imagem não encontrada", { status: 404 });

  return new Response(new Uint8Array(Buffer.from(row.data, "base64")), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
