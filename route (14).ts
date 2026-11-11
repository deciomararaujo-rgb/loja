import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { guard } from "@/lib/auth";
import { matchPhotos } from "@/lib/photos";
import { getAllCategories, getProducts, saveSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

const RAW = "https://raw.githubusercontent.com/";
const fail = (error: string, status: number) => Response.json({ error }, { status });

type Listing = { branch: string; paths: string[] };

/** Lista os arquivos pela API oficial do GitHub. */
async function fromGitHub(repo: string): Promise<Listing | "not-found" | "unavailable"> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "perfumes-imports-painel",
  };
  // Opcional: um token aumenta o limite de consultas da API.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const get = (url: string) => fetch(url, { headers, signal: AbortSignal.timeout(15_000), cache: "no-store" });

  try {
    const info = await get(`https://api.github.com/repos/${repo}`);
    if (info.status === 404) return "not-found";
    if (!info.ok) return "unavailable";
    const branch = String(((await info.json()) as { default_branch?: string }).default_branch ?? "main");
    const tree = await get(`https://api.github.com/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
    if (!tree.ok) return "unavailable";
    const data = (await tree.json()) as { tree?: { path: string; type: string }[] };
    return { branch, paths: (data.tree ?? []).filter((t) => t.type === "blob").map((t) => t.path) };
  } catch {
    return "unavailable";
  }
}

/** Plano B quando a API do GitHub está limitada: lista os arquivos do repositório pelo jsDelivr. */
async function fromJsDelivr(repo: string): Promise<Listing | null> {
  for (const branch of ["main", "master"]) {
    try {
      const res = await fetch(`https://data.jsdelivr.com/v1/packages/gh/${repo}@${branch}?structure=flat`, {
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { files?: { name: string }[] };
      if (Array.isArray(data.files)) {
        return { branch, paths: data.files.map((f) => String(f.name).replace(/^\//, "")) };
      }
    } catch {
      /* tenta o próximo */
    }
  }
  return null;
}

/** Procura fotos em um repositório público do GitHub e aplica nos produtos pelo nome do arquivo. */
export async function POST(req: Request) {
  const denied = await guard(req);
  if (denied) return denied;

  const body = ((await req.json().catch(() => null)) ?? {}) as { repo?: unknown; source?: unknown };
  const repo = (typeof body.repo === "string" ? body.repo : "")
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "")
    .split("/")
    .slice(0, 2)
    .join("/");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return fail("Informe o repositório no formato usuario/repositorio (ou cole o link do GitHub).", 400);
  }

  let listing = body.source === "alt" ? ("unavailable" as const) : await fromGitHub(repo);
  if (listing === "not-found") return fail("Repositório não encontrado. Confira o nome e se ele está público.", 404);
  if (listing === "unavailable") {
    const alt = await fromJsDelivr(repo);
    if (!alt) {
      return fail(
        "Não foi possível consultar esse repositório agora. Confira o nome, se ele está público, e tente de novo em alguns minutos.",
        502,
      );
    }
    listing = alt;
  }
  const { branch, paths } = listing;

  const [all, cats] = await Promise.all([getProducts({ includeInactive: true }), getAllCategories()]);
  const catName = new Map(cats.map((c) => [c.slug, c.name]));
  const { matches, ambiguous, imageCount } = matchPhotos(
    all.map((p) => ({ id: p.id, name: p.name, categorySlug: p.categorySlug, categoryName: catName.get(p.categorySlug) ?? "" })),
    paths,
  );

  const byId = new Map(all.map((p) => [p.id, p]));
  const report: { productName: string; path: string; status: "applied" | "same" | "kept" }[] = [];
  let applied = 0;
  let withoutPhoto = all.filter((p) => !p.imageUrl).length;

  for (const m of matches) {
    const p = byId.get(m.productId);
    if (!p) continue;
    const url = `${RAW}${repo}/${encodeURIComponent(branch)}/${m.path.split("/").map(encodeURIComponent).join("/")}`;
    // Fotos enviadas manualmente pelo painel nunca são substituídas.
    if (p.imageUrl && !p.imageUrl.startsWith(RAW)) {
      report.push({ productName: p.name, path: m.path, status: "kept" });
    } else if (p.imageUrl === url) {
      report.push({ productName: p.name, path: m.path, status: "same" });
    } else {
      if (!p.imageUrl) withoutPhoto -= 1;
      await db.update(products).set({ imageUrl: url }).where(eq(products.id, p.id));
      applied += 1;
      report.push({ productName: p.name, path: m.path, status: "applied" });
    }
  }

  await saveSettings({ photosRepo: repo });
  return Response.json({ applied, matches: report, ambiguous: ambiguous.slice(0, 40), imageCount, withoutPhoto });
}
