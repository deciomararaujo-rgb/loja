import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { ensureSeeded } from "@/lib/store";

// Senha inicial do painel (pode ser trocada em Ajustes → Segurança ou pela variável ADMIN_PASSWORD).
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "123456789";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

let cachedSecret: string | null = null;

async function readSetting(key: string) {
  await ensureSeeded();
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

async function writeSetting(key: string, value: string) {
  await ensureSeeded();
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}

async function getSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (cachedSecret) return cachedSecret;
  let secret = await readSetting("session_secret");
  if (!secret) {
    await db
      .insert(settings)
      .values({ key: "session_secret", value: randomBytes(32).toString("hex") })
      .onConflictDoNothing();
    secret = await readSetting("session_secret");
  }
  cachedSecret = secret as string;
  return cachedSecret;
}

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export async function createToken() {
  const payload = `${Date.now() + SESSION_MS}.${randomBytes(8).toString("hex")}`;
  return `${payload}.${sign(payload, await getSecret())}`;
}

export async function verifyToken(token?: string | null) {
  if (!token || token.length > 300) return false;
  const cut = token.lastIndexOf(".");
  if (cut < 0) return false;
  const payload = token.slice(0, cut);
  const given = Buffer.from(token.slice(cut + 1));
  const expected = Buffer.from(sign(payload, await getSecret()));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  return Number(payload.split(".")[0]) > Date.now();
}

export async function isAdmin(req: Request) {
  return verifyToken(req.headers.get("x-admin-token"));
}

/** Retorna uma resposta 401 quando a requisição não é do painel autenticado. */
export async function guard(req: Request) {
  if (await isAdmin(req)) return null;
  return Response.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
}

export async function checkPassword(password: string) {
  const stored = await readSetting("admin_password_hash");
  if (stored && stored.includes(":")) {
    const [salt, hash] = stored.split(":");
    const real = Buffer.from(hash, "hex");
    const test = scryptSync(password, salt, 32);
    return test.length === real.length && timingSafeEqual(test, real);
  }
  const a = createHmac("sha256", "pw").update(password).digest();
  const b = createHmac("sha256", "pw").update(DEFAULT_PASSWORD).digest();
  return timingSafeEqual(a, b);
}

export async function setPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  await writeSetting("admin_password_hash", `${salt}:${scryptSync(password, salt, 32).toString("hex")}`);
  // Troca o segredo das sessões: qualquer acesso antigo deixa de valer.
  if (!process.env.SESSION_SECRET) {
    await writeSetting("session_secret", randomBytes(32).toString("hex"));
    cachedSecret = null;
  }
}

/* ───────── Limites (em memória) ───────── */

const buckets = new Map<string, { count: number; start: number }>();

/** Conta uma ação e diz se ela ainda está dentro do limite. */
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.start > windowMs) {
    buckets.set(key, { count: 1, start: now });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now - v.start > windowMs) buckets.delete(k);
    }
    return true;
  }
  bucket.count += 1;
  return bucket.count <= max;
}

/* Entrada no painel: só as tentativas com senha errada contam, e entrar com a senha certa zera a contagem. */

export function isBlocked(key: string, max: number, windowMs: number) {
  const bucket = buckets.get(key);
  if (!bucket) return false;
  if (Date.now() - bucket.start > windowMs) {
    buckets.delete(key);
    return false;
  }
  return bucket.count >= max;
}

export function countFailure(key: string, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.start > windowMs) buckets.set(key, { count: 1, start: now });
  else bucket.count += 1;
}

export function clearFailures(key: string) {
  buckets.delete(key);
}

/** IP de quem está acessando, quando a hospedagem informa. Vazio quando não há como saber. */
export function clientIp(req: Request) {
  for (const header of ["x-forwarded-for", "x-real-ip", "cf-connecting-ip", "x-vercel-forwarded-for", "fly-client-ip", "x-client-ip"]) {
    const value = (req.headers.get(header) ?? "").split(",")[0].trim();
    if (value) return value;
  }
  return "";
}

/**
 * Chave e limite de uma contagem por visitante. Quando a hospedagem não informa o IP,
 * todos os visitantes caem na mesma contagem, então o limite é mais folgado.
 */
export function limitFor(req: Request, scope: string, perVisitor: number, whenUnknown: number) {
  const ip = clientIp(req);
  return { key: `${scope}:${ip || "todos"}`, max: ip ? perVisitor : whenUnknown };
}

export function requestOrigin(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return "";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto.split(",")[0]}://${host.split(",")[0]}`;
}
