import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/jost";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Perfumes Imports · Perfumes árabes e importados",
    template: "%s · Perfumes Imports",
  },
  description:
    "Perfumes árabes, body splash, cremes, esfoliantes e cuidados para os cabelos. Pague com Pix ou cartão e receba por J3Flex em até 2 dias úteis.",
  openGraph: {
    title: "Perfumes Imports · Perfumes árabes e importados",
    description: "Perfumes árabes, body splash e cuidados importados com entrega rápida e atendimento no WhatsApp.",
    images: ["/banners/2.jpg"],
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6eee2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <noscript>
          <style>{`.reveal,.reveal .rv-text,.reveal .rv-zoom{opacity:1;transform:none}`}</style>
        </noscript>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
