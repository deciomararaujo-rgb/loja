import { guard } from "@/lib/auth";
import { onlyDigits } from "@/lib/format";
import { getRawSettings, parseBanners, saveSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

const TEXT_LIMITS: Record<string, number> = {
  storeName: 60,
  announcement: 160,
  pixKey: 120,
  pixName: 60,
  pixCity: 40,
  callmebotKey: 80,
};
const INT_LIMITS: Record<string, [number, number]> = {
  shippingCents: [0, 1_000_000],
  shippingDays: [0, 60],
  maxInstallments: [1, 24],
  interestFree: [1, 24],
};

export async function GET(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  return Response.json({ settings: await getRawSettings() });
}

export async function PUT(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const patch: Record<string, string> = {};

  for (const [key, max] of Object.entries(TEXT_LIMITS)) {
    if (typeof body[key] === "string") patch[key] = (body[key] as string).normalize("NFC").trim().slice(0, max);
  }
  for (const [key, [min, max]] of Object.entries(INT_LIMITS)) {
    if (body[key] === undefined) continue;
    const n = Math.round(Number(body[key]));
    if (!Number.isFinite(n) || n < min || n > max) {
      return Response.json({ error: "Confira os valores numéricos informados." }, { status: 400 });
    }
    patch[key] = String(n);
  }
  for (const key of ["whatsappNumber", "notifyNumber"]) {
    if (typeof body[key] !== "string") continue;
    const digits = onlyDigits(body[key] as string);
    if (digits && (digits.length < 12 || digits.length > 13)) {
      return Response.json(
        { error: "Informe o WhatsApp com código do país e DDD. Exemplo: 55 11 95083-5003." },
        { status: 400 },
      );
    }
    if (!digits && key === "whatsappNumber") {
      return Response.json({ error: "O WhatsApp de atendimento é obrigatório." }, { status: 400 });
    }
    patch[key] = digits;
  }
  if (body.pickupEnabled !== undefined) patch.pickupEnabled = body.pickupEnabled === true || body.pickupEnabled === "1" ? "1" : "0";
  // Listas de imagens com link: temas das seções e destaques (vídeos e fotos) do topo da página inicial.
  for (const key of ["banners", "slides"]) {
    if (typeof body[key] === "string") patch[key] = JSON.stringify(parseBanners(body[key] as string, []));
  }
  if (patch.storeName === "") delete patch.storeName;

  await saveSettings(patch);
  return Response.json({ settings: await getRawSettings() });
}
