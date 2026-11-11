// Como o site entrega as imagens:
// - Fotos do catálogo (public/produtos): já estão prontas em três tamanhos, em alta qualidade,
//   e vão direto para o navegador, sem recompressão.
// - Fotos importadas do GitHub e imagens dos temas: passam pelo otimizador do site.
// - Fotos enviadas pelo painel: são servidas como foram enviadas.

const GITHUB = "https://raw.githubusercontent.com/";
const CATALOG = /^\/produtos\/([a-z0-9-]+)\.webp$/;
const CATALOG_FULL_WIDTH = 1179; // largura original das fotos enviadas pela loja
const WIDTHS = [384, 640, 828, 1080, 1200];
const QUALITY = 90;

const canOptimize = (src: string) =>
  src.startsWith(GITHUB) || src.startsWith("/produtos/") || src.startsWith("/banners/");

const optimized = (src: string, width: number) =>
  `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${QUALITY}`;

/** Lista de tamanhos (`srcSet`) de uma imagem do site, nas larguras pedidas. */
export function srcSetFor(src: string, widths: number[]) {
  return widths.map((w) => `${optimized(src, w)} ${w}w`).join(", ");
}

/** Endereço de uma imagem do site em uma largura específica. */
export const sized = (src: string, width: number) => optimized(src, width);

/** Atributos `src`/`srcSet` para o navegador escolher o tamanho certo para cada tela. */
export function responsive(src: string, fallbackWidth = 828): { src: string; srcSet?: string } {
  const catalog = CATALOG.exec(src);
  if (catalog) {
    const base = `/produtos/${catalog[1]}`;
    return {
      src: `${base}-640.webp`,
      srcSet: `${base}-320.webp 320w, ${base}-640.webp 640w, ${src} ${CATALOG_FULL_WIDTH}w`,
    };
  }
  if (!canOptimize(src)) return { src };
  return {
    src: optimized(src, fallbackWidth),
    srcSet: WIDTHS.map((w) => `${optimized(src, w)} ${w}w`).join(", "),
  };
}

/** Miniatura (sacola, resumo do pedido, tabela de categorias, painel). */
export function thumbnail(src: string) {
  const catalog = CATALOG.exec(src);
  if (catalog) return `/produtos/${catalog[1]}-320.webp`;
  return canOptimize(src) ? optimized(src, 256) : src;
}
