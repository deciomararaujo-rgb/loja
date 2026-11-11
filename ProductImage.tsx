import { responsive, thumbnail } from "@/lib/img";
import { BottleArt } from "./icons";

const KIND: Record<string, "perfume" | "splash" | "jar" | "pump" | "gift"> = {
  masculinos: "perfume",
  femininos: "perfume",
  "body-splash": "splash",
  cremes: "jar",
  esfoliantes: "jar",
  cabelos: "pump",
  kits: "gift",
  "stella-dustin": "splash",
};

// Largura dos cartões de produto em cada tela (o navegador usa isto para escolher o tamanho da foto).
const CARD_SIZES = "(min-width: 1320px) 290px, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, 46vw";

/**
 * Foto do produto (os cantos arredondados vêm do container) ou ilustração quando ainda não há foto.
 * As fotos de fundo branco se fundem com o bege do cartão, para todos os produtos ficarem no mesmo padrão.
 */
export default function ProductImage({
  src,
  alt,
  category,
  brand,
  eager = false,
  compact = false,
  sizes = CARD_SIZES,
}: {
  src: string;
  alt: string;
  category: string;
  brand?: string;
  eager?: boolean;
  compact?: boolean;
  sizes?: string;
}) {
  if (src) {
    const img = compact ? { src: thumbnail(src), srcSet: undefined } : responsive(src);
    return (
      <span className="isolate block h-full w-full bg-sand-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.src}
          srcSet={img.srcSet}
          sizes={img.srcSet ? sizes : undefined}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover mix-blend-multiply"
        />
      </span>
    );
  }
  return (
    <div
      role="img"
      aria-label={`${alt} (foto em breve)`}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(120%_90%_at_50%_18%,#fffdf9_0%,#f6eee2_52%,#ecdfcc_100%)] text-flame-600/75"
    >
      <span className="pointer-events-none absolute left-1/2 top-[14%] h-[72%] w-[62%] -translate-x-1/2 rounded-t-full border border-flame-300/35" />
      <BottleArt kind={KIND[category] ?? "perfume"} />
      {!compact && brand ? (
        <span className="mt-4 max-w-[80%] truncate text-[10px] font-medium uppercase tracking-[0.3em] text-ink-mute">
          {brand}
        </span>
      ) : null}
    </div>
  );
}
