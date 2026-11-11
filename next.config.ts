import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos de produtos importadas do GitHub são redimensionadas e servidas pelo próprio site.
    remotePatterns: [{ protocol: "https", hostname: "raw.githubusercontent.com" }],
    // Qualidade usada ao redimensionar (90). A 75 continua aceita para páginas já abertas com os links antigos.
    qualities: [75, 90],
  },
  async headers() {
    return [
      {
        // Fotos do catálogo: o navegador guarda por 4 horas em vez de conferir a cada visita.
        source: "/produtos/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=14400, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
