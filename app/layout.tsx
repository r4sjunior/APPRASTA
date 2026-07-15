import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Merch Control",
  description: "Controle de estoque consignado de merch em lojas parceiras",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
