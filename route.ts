import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { guard } from "@/lib/auth";
import { ORDER_STATUS } from "@/lib/format";
import { ensureSeeded } from "@/lib/store";

export const dynamic = "force-dynamic";

const bad = (error: string, status = 400) => Response.json({ error }, { status });

export async function GET(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  await ensureSeeded();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(1000);
  return Response.json({ orders: rows });
}

export async function PATCH(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const id = Number(body.id);
  const status = typeof body.status === "string" ? body.status : "";
  if (!Number.isInteger(id)) return bad("Pedido inválido.");
  if (!ORDER_STATUS[status]) return bad("Status inválido.");
  const [row] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();
  return row ? Response.json({ order: row }) : bad("Pedido não encontrado.", 404);
}

export async function DELETE(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return bad("Pedido inválido.");
  await db.delete(orders).where(eq(orders.id, id));
  return Response.json({ ok: true });
}
