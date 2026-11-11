import { normalizeText } from "@/lib/format";

// Liga as fotos de um repositório do GitHub aos produtos da loja pelo nome do arquivo
// (ex.: "Femininos/Yara Tradicional.jpg" → produto "Yara Tradicional" da categoria Femininos).

export type PhotoProduct = { id: number; name: string; categorySlug: string; categoryName: string };
export type PhotoMatch = { productId: number; productName: string; path: string; score: number };

const IMAGE = /\.(jpe?g|png|webp|jfif|avif)$/i;
const norm = (s: string) =>
  normalizeText(s)
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const stems = (s: string) =>
  norm(s)
    .split(" ")
    .filter((t) => t.length >= 4)
    .map((t) => t.slice(0, 6));

export function matchPhotos(products: PhotoProduct[], paths: string[]) {
  const categories = [
    ...new Map(products.map((p) => [p.categorySlug, stems(`${p.categorySlug} ${p.categoryName}`)])).entries(),
  ];

  const images = paths
    .filter((path) => IMAGE.test(path))
    .map((path) => {
      const parts = path.split("/");
      const file = parts.pop() as string;
      // "Yara Tradicional 2.jpg" conta como outra foto do mesmo produto.
      const base = norm(file.replace(IMAGE, "")).replace(/(?<=\S) \d{1,2}$/, "");
      const folder = norm(parts.join(" "));
      const folderCats = categories.filter(([, list]) => list.some((s) => folder.includes(s))).map(([slug]) => slug);
      return { path, base, tokens: base.split(" ").filter(Boolean), folderCats };
    })
    .filter((f) => f.base);

  const prepared = products.map((p) => {
    const short = norm(p.name.replace(/\(.*?\)/g, " "));
    const alts = [...p.name.matchAll(/\(([^)]+)\)/g)]
      .flatMap((m) => m[1].split(","))
      .map(norm)
      .filter(Boolean);
    return { p, full: norm(p.name), short, alts, tokens: new Set(short.split(" ").filter(Boolean)) };
  });

  const score = (pp: (typeof prepared)[number], f: (typeof images)[number]) => {
    let s = 0;
    if (f.base === pp.full || f.base === pp.short) s = 100;
    else if (pp.alts.includes(f.base)) s = 92;
    else {
      const common = f.tokens.filter((t) => pp.tokens.has(t)).length;
      if (!common) return 0;
      if (common === f.tokens.length && (common >= 2 || f.tokens[0].length >= 4)) s = 60 + 30 * (common / pp.tokens.size);
      else if (common === pp.tokens.size && (common >= 2 || pp.short.length >= 4)) s = 60 + 30 * (common / f.tokens.length);
      else return 0;
    }
    if (f.folderCats.length) s += f.folderCats.includes(pp.p.categorySlug) ? 8 : -12;
    return s;
  };

  const best = new Map<number, PhotoMatch>();
  const ambiguous: string[] = [];
  for (const f of images) {
    const candidates = prepared
      .map((pp) => ({ pp, s: score(pp, f) }))
      .filter((c) => c.s >= 70)
      .sort((a, b) => b.s - a.s);
    if (!candidates.length) continue;
    // Mesmo nome servindo para vários produtos: melhor não adivinhar.
    if (candidates.length > 1 && candidates[0].s - candidates[1].s < 3) {
      ambiguous.push(f.path);
      continue;
    }
    const { pp, s } = candidates[0];
    const current = best.get(pp.p.id);
    if (!current || s > current.score) {
      best.set(pp.p.id, { productId: pp.p.id, productName: pp.p.name, path: f.path, score: Math.round(s) });
    }
  }

  return { matches: [...best.values()], ambiguous, imageCount: images.length };
}
