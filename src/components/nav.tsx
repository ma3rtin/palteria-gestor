"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/clientes", label: "Clientes" },
  { href: "/cobranzas", label: "Cobranzas" },
  { href: "/pagos-semanales", label: "Pagos Semanales" },
  { href: "/repartidores", label: "Repartidores" },
  { href: "/productos", label: "Productos" },
];

const configLinks = [
  { href: "/config/zonas", label: "Zonas" },
  { href: "/config/repartidores", label: "Repartidores" },
  { href: "/perfil", label: "Perfil" },
];

interface Props {
  usuario: string;
}

export default function Nav({ usuario }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-52 h-screen sticky top-0 flex flex-col shrink-0 bg-[#13161e]">
      <div className="px-5 py-7 border-b border-[#1f2330]">
        <div className="text-white font-bold text-sm tracking-wide">La Paltería</div>
        <div className="text-[#a3e635] text-[10px] tracking-widest uppercase mt-0.5">Gestor</div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-[#a3e635] text-[#0f1117] font-medium"
                  : "text-[#9ca3af] hover:bg-[#22252e] hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}

        <div className="mt-4 mb-1 px-3">
          <span className="text-[10px] uppercase tracking-widest text-[#a3e635]">Configuración</span>
        </div>
        {configLinks.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-[#a3e635] text-[#0f1117] font-medium"
                  : "text-[#9ca3af] hover:bg-[#22252e] hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Usuario + cerrar sesión */}
      <div className="px-4 py-4 border-t border-[#1f2330]">
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
