import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";
import { auth } from "@/auth";
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: "La Paltería · Gestor",
  description: "Sistema de gestión de pedidos y cobranzas",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="es" className="h-full">
      <body className="h-full flex overflow-hidden bg-[#0f1117]">
        {session && <Nav usuario={session.user?.name ?? ""} rol={session.user?.rol} />}
        <main className="flex-1 h-full overflow-y-auto bg-[#0f1117] overscroll-y-contain">
          {children}
        </main>
        <SpeedInsights />
      </body>
    </html>
  );
}
