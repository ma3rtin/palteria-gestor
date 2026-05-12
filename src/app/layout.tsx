import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";
import { auth } from "@/auth";

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
      <body className="min-h-full flex">
        {session && <Nav usuario={session.user?.name ?? ""} />}
        <main className="flex-1 min-h-screen bg-[#0f1117] overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
