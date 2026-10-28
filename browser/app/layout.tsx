import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "re-img",
  description: "Redimensionner et optimiser des images pour le Web.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
