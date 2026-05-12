"use client";

import { useRouter } from "next/navigation";

interface Zona { id: number; nombre: string }
interface Repartidor { id: number; nombre: string }

interface Props {
  zonas: Zona[];
  repartidores: Repartidor[];
  q?: string;
  zona?: string;
  repartidor?: string;
  inactivos?: string;
}

export function FiltrosClientes({ zonas, repartidores, q, zona, repartidor, inactivos }: Props) {
  const router = useRouter();

  function actualizar(params: Record<string, string>) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
    router.push(`/clientes${sp.size ? "?" + sp.toString() : ""}`);
  }

  const hayFiltros = q || zona || repartidor || inactivos;

  return (
    <div className="flex gap-2 flex-wrap mb-4">
      <input
        type="search"
        placeholder="Buscar por nombre o zona..."
        defaultValue={q ?? ""}
        onChange={(e) =>
          actualizar({ q: e.target.value, zona: zona ?? "", repartidor: repartidor ?? "", inactivos: inactivos ?? "" })
        }
        className="flex-1 min-w-48 border border-[#2a2d35] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
      />

      <select
        value={zona ?? ""}
        onChange={(e) =>
          actualizar({ q: q ?? "", zona: e.target.value, repartidor: repartidor ?? "", inactivos: inactivos ?? "" })
        }
        className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635]"
      >
        <option value="">Todas las zonas</option>
        {zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
      </select>

      <select
        value={repartidor ?? ""}
        onChange={(e) =>
          actualizar({ q: q ?? "", zona: zona ?? "", repartidor: e.target.value, inactivos: inactivos ?? "" })
        }
        className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635]"
      >
        <option value="">Todos los repartidores</option>
        {repartidores.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
      </select>

      <select
        value={inactivos ?? ""}
        onChange={(e) =>
          actualizar({ q: q ?? "", zona: zona ?? "", repartidor: repartidor ?? "", inactivos: e.target.value })
        }
        className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635]"
      >
        <option value="">Solo activos</option>
        <option value="1">Incluir inactivos</option>
      </select>

      {hayFiltros && (
        <button
          onClick={() => router.push("/clientes")}
          className="px-3 py-2 text-sm text-[#9ca3af] hover:text-[#a3e635] border border-[#2a2d35] rounded-lg transition-colors"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
