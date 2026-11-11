import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Endereços "quase certos" do painel levam para a tela de entrada em vez de "página não encontrada":
// /Admin (o teclado do celular costuma colocar maiúscula), /painel, /login, /admin/qualquer-coisa
// e links que chegam com sobras de pontuação no final (por exemplo "/admin**" ou "/admin.").
const PANEL = /^(admin|adm|painel|login|entrar|dashboard)/;

export default async function AnyOtherAddress({ params }: { params: Promise<{ resto: string[] }> }) {
  const { resto } = await params;

  let first = resto[0] ?? "";
  try {
    first = decodeURIComponent(first);
  } catch {
    /* mantém como veio */
  }
  first = first
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^[^a-z0-9]+/, "");

  if (PANEL.test(first)) redirect("/admin");
  // Link da loja que chegou só com pontuação depois da barra (por exemplo "/**"): abre a página inicial.
  if (!first && resto.length === 1) redirect("/");

  notFound();
}
