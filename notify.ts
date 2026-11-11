import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getSettings } from "@/lib/store";

export type NoticeType = "pedido" | "pagamento" | "whatsapp" | "acesso" | "seguranca" | "sistema";

/** Registra um aviso no painel administrativo. */
export async function addNotification(n: { type: NoticeType; title: string; message?: string; orderCode?: string }) {
  await db.insert(notifications).values({
    type: n.type,
    title: n.title.slice(0, 200),
    message: (n.message ?? "").slice(0, 1000),
    orderCode: n.orderCode ?? "",
  });
}

/**
 * Envia uma mensagem de WhatsApp para o número de avisos da loja usando o CallMeBot.
 * Só funciona depois que a chave de API for informada em Ajustes → Avisos no WhatsApp.
 */
export async function sendAdminWhatsApp(text: string): Promise<{ sent: boolean; reason?: string }> {
  const s = await getSettings();
  if (!s.callmebotKey || !s.notifyNumber) return { sent: false, reason: "not-configured" };
  const url =
    "https://api.callmebot.com/whatsapp.php" +
    `?phone=${encodeURIComponent(`+${s.notifyNumber}`)}` +
    `&text=${encodeURIComponent(text)}` +
    `&apikey=${encodeURIComponent(s.callmebotKey)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000), cache: "no-store" });
    return res.ok ? { sent: true } : { sent: false, reason: `http-${res.status}` };
  } catch {
    return { sent: false, reason: "network" };
  }
}
