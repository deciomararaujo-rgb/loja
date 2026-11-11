import Link from "next/link";

/* Logos das marcas, logo abaixo das imagens das seções (sem título).
   Os arquivos ficam em public/brand/marcas. As logos têm fundo branco: o "multiply" faz o branco sumir no fundo da página.
   Para acrescentar uma marca: coloque o arquivo nessa pasta e adicione uma linha na lista abaixo.
   - show: altura da logo na tela, em pixels. */
const BRANDS = [
  { name: "Armaf", file: "armaf.webp", width: 300, height: 300, show: 64 },
  { name: "Lattafa", file: "lattafa.webp", width: 234, height: 300, show: 66 },
  { name: "Maison Alhambra", file: "maison-alhambra.webp", width: 276, height: 300, show: 66 },
  { name: "Stella Dustin", file: "stella-dustin.webp", width: 700, height: 219, show: 40 },
  { name: "Victoria's Secret", file: "victorias-secret.webp", width: 385, height: 300, show: 62 },
];

export default function BrandLogos() {
  return (
    <section aria-label="Marcas" className="container-x pt-12 lg:pt-16">
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 [--logo:0.82] sm:flex-nowrap sm:gap-x-14 sm:[--logo:0.92] lg:gap-x-20 lg:[--logo:1]">
        {BRANDS.map((brand) => (
          <li key={brand.file} className="shrink-0">
            <Link
              href={`/busca?q=${encodeURIComponent(brand.name)}`}
              aria-label={`Ver produtos da marca ${brand.name}`}
              className="block transition-opacity duration-300 hover:opacity-60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/brand/marcas/${brand.file}`}
                alt={brand.name}
                width={brand.width}
                height={brand.height}
                loading="lazy"
                decoding="async"
                style={{ height: `calc(${brand.show}px * var(--logo))` }}
                className="w-auto max-w-none mix-blend-multiply"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
