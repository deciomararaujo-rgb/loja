import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { guard } from "@/lib/auth";
import { sendAdminWhatsApp } from "@/lib/notify";
import { ensureSeeded } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  await ensureSeeded();
  const items = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(120);
  const [{ unread }] = await db
    .select({ unread: sql<number>`count(*)::int` })
    .from(notifications)
    .where(eq(notifications.read, false));
  return Response.json({ items, unread: Number(unread) });
}

export async function POST(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;

  if (body.action === "read-all") {
    await db.update(notifications).set({ read: true }).where(eq(notifications.read, false));
    return Response.json({ ok: true });
  }
  if (body.action === "read" && Number.isInteger(Number(body.id))) {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, Number(body.id)));
    return Response.json({ ok: true });
  }
  if (body.action === "clear") {
    await db.delete(notifications).where(eq(notifications.read, true));
    return Response.json({ ok: true });
  }
  if (body.action === "test-whatsapp") {
    const result = await sendAdminWhatsApp("✅ Teste do painel Perfumes Imports: os avisos por WhatsApp estão funcionando.");
    return Response.json(result);
  }
  return Response.json({ error: "Ação inválida." }, { status: 400 });
}
