"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, ChevronDown } from "lucide-react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/reportes", label: "Reportes" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/clientes", label: "Clientes" },
  { href: "/cobranzas", label: "Cobranzas" },
  { href: "/pagos-semanales", label: "Pagos Semanales" },
  { href: "/repartidores", label: "Repartidores" },
  { href: "/productos", label: "Productos" },
  { href: "/revendedores", label: "Revendedores" },
];

const configLinks = [
  { href: "/config/zonas", label: "Zonas" },
  { href: "/config/repartidores", label: "Repartidores" },
  { href: "/config/revendedores", label: "Revendedores" },
  { href: "/perfil", label: "Perfil" },
];

interface Props {
  usuario: string;
}

export default function Nav({ usuario }: Props) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(() => {
    return pathname.startsWith("/config") || pathname === "/perfil";
  });

  return (
    <aside className="w-52 h-screen sticky top-0 flex flex-col shrink-0 bg-[#13161e]">
      <div className="px-5 py-4 border-b border-[#1f2330]">
        <div className="text-white font-bold text-sm tracking-wide">La Paltería</div>
        <div className="text-[#a3e635] text-[10px] tracking-widest uppercase mt-0.5">Gestor</div>
      </div>

      <nav className="flex-1 px-3 py-2.5 flex flex-col gap-0.5">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-[13px] transition-colors ${active
                  ? "bg-[#a3e635] text-[#0f1117] font-medium"
                  : "text-[#9ca3af] hover:bg-[#22252e] hover:text-white"
                }`}
            >
              {link.label}
            </Link>
          );
        })}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mt-2 mb-1 px-3 py-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-[#a3e635] w-full text-left font-semibold hover:bg-[#22252e] rounded transition-colors group"
        >
          <span>Configuración</span>
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        <div
          className={`flex flex-col gap-0.5 overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          {configLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                  active
                    ? "bg-[#a3e635] text-[#0f1117] font-medium"
                    : "text-[#9ca3af] hover:bg-[#22252e] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Usuario + cerrar sesión */}
      <div className="px-4 py-3 border-t border-[#1f2330]">
        {usuario && (
          <p className="text-xs text-[#6b7280] truncate mb-2">{usuario}</p>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-xs text-[#6b7280] hover:text-[#f9fafb] transition-colors w-full"
        >
          <LogOut size={13} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
