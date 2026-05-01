"use client";

import { useRouter } from "next/navigation";

export function BuscadorClientes({ valorInicial }: { valorInicial: string }) {
  const router = useRouter();

  return (
    <input
      type="search"
      placeholder="Buscar por nombre o zona..."
      defaultValue={valorInicial}
      onChange={(e) => {
        const q = e.target.value;
        router.push(q ? `/clientes?q=${encodeURIComponent(q)}` : "/clientes");
      }}
      className="w-full border border-[#2a2d35] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
    />
  );
}
