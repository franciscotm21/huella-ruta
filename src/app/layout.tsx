import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Huella de tu visita – Nevados de Chillán & PN Laguna del Laja",
  description: "Calcula tu impacto y recibe acciones locales para reducir y compensar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased bg-white">{children}<Analytics /></body>
    </html>
  );
}
