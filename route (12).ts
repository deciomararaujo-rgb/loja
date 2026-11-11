import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import {
  checkPassword,
  clearFailures,
  countFailure,
  createToken,
  guard,
  isBlocked,
  limitFor,
  setPassword,
} from "@/lib/auth";
import { addNotification } from "@/lib/notify";
import { ensureSeeded } from "@/lib/store";

export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60_000;

export async function GET(req: Request) {
  const denied = await guard(req);
  return denied ?? Response.json({ ok: true });
}

// Entrar no painel
export async function POST(req: Request) {
  await ensureSeeded();

  // Só as tentativas com senha errada contam. Entrar com a senha certa zera a contagem.
  const limit = limitFor(req, "login", 8, 20);
  if (isBlocked(limit.key, limit.max, WINDOW_MS)) {
    return Response.json(
      { error: "Muitas tentativas com a senha errada. Por segurança, aguarde 15 minutos para tentar de novo." },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  // Espaços no começo ou no fim (comuns no teclado do celular) não fazem parte da senha.
  const password = typeof body?.password === "string" ? body.password.trim().slice(0, 200) : "";

  if (!password || !(await checkPassword(password))) {
    countFailure(limit.key, WINDOW_MS);
    const recent = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.type, "seguranca"), gt(notifications.createdAt, new Date(Date.now() - WINDOW_MS))))
      .limit(1);
    if (!recent.length) {
      await addNotification({
        type: "seguranca",
        title: "Tentativa de acesso com senha incorreta",
        message: "Alguém tentou entrar no painel com a senha errada. Se não foi você, troque a senha em Ajustes.",
      });
    }
    return Response.json({ error: "Senha incorreta. Tente novamente." }, { status: 401 });
  }

  clearFailures(limit.key);
  await addNotification({ type: "acesso", title: "Painel acessado", message: "Um novo acesso ao painel foi realizado." });
  return Response.json({ token: await createToken() });
}

// Trocar a senha
export async function PUT(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as { currentPassword?: unknown; newPassword?: unknown } | null;
  const current = typeof body?.currentPassword === "string" ? body.currentPassword.trim() : "";
  const next = typeof body?.newPassword === "string" ? body.newPassword.trim() : "";

  if (!(await checkPassword(current))) {
    return Response.json({ error: "A senha atual não confere." }, { status: 400 });
  }
  if (next.length < 8 || next.length > 100) {
    return Response.json({ error: "A nova senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
  }

  await setPassword(next);
  await addNotification({ type: "seguranca", title: "Senha do painel alterada", message: "A senha de acesso foi trocada." });
  return Response.json({ token: await createToken() });
}
