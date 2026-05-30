"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

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
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(q ?? "");
  const [isManualUpdate, setIsManualUpdate] = useState(false);

  function actualizar(params: Record<string, string>) {
    const sp = new URLSearchParams();
    sp.set("page", "0");
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
    
    startTransition(() => {
      router.push(`/clientes${sp.size ? "?" + sp.toString() : ""}`);
      setIsManualUpdate(false);
    });
  }

  // Debounce search input
  useEffect(() => {
    if (searchValue === (q ?? "")) {
      setIsManualUpdate(false);
      return;
    }

    const timer = setTimeout(() => {
      actualizar({ 
        q: searchValue, 
        zona: zona ?? "", 
        repartidor: repartidor ?? "", 
        inactivos: inactivos ?? "" 
      });
    }, 500); 

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Sincronizar solo si NO es un cambio manual del usuario
  useEffect(() => {
    if (!isManualUpdate && !isPending) {
      setSearchValue(q ?? "");
    }
  }, [q, isPending, isManualUpdate]);

  const hayFiltros = q || zona || repartidor || inactivos;

  return (
    <div className={`flex gap-2 flex-wrap mb-4 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
      <div className="relative flex-1 min-w-48">
        <input
          type="search"
          placeholder="Buscar por nombre o zona..."
          value={searchValue}
          onChange={(e) => {
            setIsManualUpdate(true);
            setSearchValue(e.target.value);
          }}
          className="w-full border border-[#2a2d35] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26] text-white"
        />
        {isPending && (
          <div className="absolute right-3 top-2.5">
            <div className="w-4 h-4 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
...
      <select
        value={zona ?? ""}
        onChange={(e) =>
          actualizar({ q: searchValue, zona: e.target.value, repartidor: repartidor ?? "", inactivos: inactivos ?? "" })
        }
        className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] text-white"
      >
        <option value="">Todas las zonas</option>
        {zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
      </select>

      <select
        value={repartidor ?? ""}
        onChange={(e) =>
          actualizar({ q: searchValue, zona: zona ?? "", repartidor: e.target.value, inactivos: inactivos ?? "" })
        }
        className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] text-white"
      >
        <option value="">Todos los repartidores</option>
        {repartidores.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
      </select>

      <select
        value={inactivos ?? ""}
        onChange={(e) =>
          actualizar({ q: searchValue, zona: zona ?? "", repartidor: repartidor ?? "", inactivos: e.target.value })
        }
        className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] text-white"
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
