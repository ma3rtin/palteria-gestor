"use client";

import { useRouter } from "next/navigation";

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

  function actualizar(zona: string, rep: string) {
    const params = new URLSearchParams();
    if (zona) params.set("zona", zona);
    if (rep) params.set("repartidor", rep);
    router.push(`/cobranzas${params.size ? "?" + params.toString() : ""}`);
  }

  return (
    <div className="flex gap-3 mb-6">
      <select
        defaultValue={zonaActual ?? ""}
        onChange={(e) => actualizar(e.target.value, repartidorActual ?? "")}
        className="border border-[#dde6de] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#16a34a]"
      >
        <option value="">Todas las zonas</option>
        {zonas.map((z) => (
          <option key={z.id} value={z.id}>{z.nombre}</option>
        ))}
      </select>
      <select
        defaultValue={repartidorActual ?? ""}
        onChange={(e) => actualizar(zonaActual ?? "", e.target.value)}
        className="border border-[#dde6de] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#16a34a]"
      >
        <option value="">Todos los repartidores</option>
        {repartidores.map((r) => (
          <option key={r.id} value={r.id}>{r.nombre}</option>
        ))}
      </select>
      {(zonaActual || repartidorActual) && (
        <button
          onClick={() => actualizar("", "")}
          className="px-3 py-2 text-sm text-[#5a6b5c] hover:text-[#ea580c] border border-[#dde6de] rounded-lg"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
