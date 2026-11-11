import { onlyDigits } from "@/lib/format";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

// Frete fixo por J3Flex. O CEP é consultado no ViaCEP para validar e preencher o endereço.
export async function GET(req: Request) {
  const cep = onlyDigits(new URL(req.url).searchParams.get("cep") ?? "");
  if (cep.length !== 8) {
    return Response.json({ error: "Informe um CEP válido, com 8 números." }, { status: 400 });
  }

  const s = await getSettings();
  let address: { street: string; neighborhood: string; city: string; state: string } | null = null;
  let notFound = false;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as Record<string, string | boolean | undefined>;
      if (data.erro) notFound = true;
      else {
        address = {
          street: String(data.logradouro ?? ""),
          neighborhood: String(data.bairro ?? ""),
          city: String(data.localidade ?? ""),
          state: String(data.uf ?? ""),
        };
      }
    }
  } catch {
    // Sem resposta do ViaCEP: o cliente preenche o endereço manualmente.
  }

  if (notFound) {
    return Response.json({ error: "CEP não encontrado. Confira os números e tente de novo." }, { status: 404 });
  }

  return Response.json({
    cep,
    address,
    priceCents: s.shippingCents,
    days: s.shippingDays,
    outsideSP: address ? address.state !== "SP" : false,
  });
}
