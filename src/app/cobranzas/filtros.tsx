"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface Zona { id: number; nombre: string }
interface Repartidor { id: number; nombre: string }

interface Props {
  zonas: Zona[];
  repartidores: Repartidor[];
  zonaActual?: string;
  repartidorActual?: string;
}

export function FiltrosCobranza({ zonas, repartidores, zonaActual, repartidorActual }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function actualizar(zona: string, rep: string) {
    const params = new URLSearchParams();
    if (zona) params.set("zona", zona);
    if (rep) params.set("repartidor", rep);
    
    startTransition(() => {
      router.push(`/cobranzas${params.size ? "?" + params.toString() : ""}`);
    });
  }

  return (
    <div className={`flex gap-3 mb-6 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
      <select
        defaultValue={zonaActual ?? ""}
        onChange={(e) => actualizar(e.target.value, repartidorActual ?? "")}
        className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] text-white"
      >
        <option value="">Todas las zonas</option>
        {zonas.map((z) => (
          <option key={z.id} value={z.id}>{z.nombre}</option>
        ))}
      </select>
      <select
        defaultValue={repartidorActual ?? ""}
        onChange={(e) => actualizar(zonaActual ?? "", e.target.value)}
        className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] text-white"
      >
        <option value="">Todos los repartidores</option>
        {repartidores.map((r) => (
          <option key={r.id} value={r.id}>{r.nombre}</option>
        ))}
      </select>
      {(zonaActual || repartidorActual) && (
        <button
          onClick={() => actualizar("", "")}
          className="px-3 py-2 text-sm text-[#9ca3af] hover:text-[#a3e635] border border-[#2a2d35] rounded-lg transition-colors"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
