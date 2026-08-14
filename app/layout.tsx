import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Izzat Express | Sua loja de utilidades e gadgets",
  description: "Ofertas especiais, utilidades domésticas, gadgets e eletroportáteis com frete grátis.",
  icons: {
    icon: "/izzat-logo.png",
    shortcut: "/izzat-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://woozenvision.myshopify.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400..900&display=swap" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
