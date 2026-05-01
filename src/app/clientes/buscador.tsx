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
      className="w-full border border-[#dde6de] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] bg-white"
    />
  );
}
