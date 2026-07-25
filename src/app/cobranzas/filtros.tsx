"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

interface Zona { id: number; nombre: string }
interface Repartidor { id: number; nombre: string }

interface Props {
  zonas: Zona[];
  repartidores: Repartidor[];
  qActual?: string;
  zonaActual?: string;
  repartidorActual?: string;
}

export function FiltrosCobranza({
  zonas,
  repartidores,
  qActual,
  zonaActual,
  repartidorActual,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(qActual ?? "");
  const [isManualUpdate, setIsManualUpdate] = useState(false);

  function actualizar(params: Record<string, string>) {
    const sp = new URLSearchParams();
    sp.set("page", "0");
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });

    startTransition(() => {
      router.push(`/cobranzas${sp.size ? "?" + sp.toString() : ""}`);
      setIsManualUpdate(false);
    });
  }

  // Debounce search input
  useEffect(() => {
    if (searchValue === (qActual ?? "")) {
      setIsManualUpdate(false);
      return;
    }

    const timer = setTimeout(() => {
      actualizar({
        q: searchValue,
        zona: zonaActual ?? "",
        repartidor: repartidorActual ?? "",
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Sincronizar searchValue si cambia externamente (no manual)
  useEffect(() => {
    if (!isManualUpdate && !isPending) {
      setSearchValue(qActual ?? "");
    }
  }, [qActual, isPending, isManualUpdate]);

  const hayFiltros = qActual || zonaActual || repartidorActual;

  return (
    <div className={`flex gap-2 flex-wrap mb-6 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
      {/* Input de Búsqueda */}
      <div className="relative flex-1 min-w-48">
        <input
          type="search"
          placeholder="Buscar por cliente..."
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

      {/* Select Zonas */}
      <select
        value={zonaActual ?? ""}
        onChange={(e) =>
          actualizar({ q: searchValue, zona: e.target.value, repartidor: repartidorActual ?? "" })
        }
        className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] text-white"
      >
        <option value="">Todas las zonas</option>
        {zonas.map((z) => (
          <option key={z.id} value={z.id}>
            {z.nombre}
          </option>
        ))}
      </select>

      {/* Select Repartidores */}
      <select
        value={repartidorActual ?? ""}
        onChange={(e) =>
          actualizar({ q: searchValue, zona: zonaActual ?? "", repartidor: e.target.value })
        }
        className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] text-white"
      >
        <option value="">Todos los repartidores</option>
        {repartidores.map((r) => (
          <option key={r.id} value={r.id}>
            {r.nombre}
          </option>
        ))}
      </select>

      {/* Botón Limpiar */}
      {hayFiltros && (
        <button
          onClick={() => router.push("/cobranzas")}
          className="px-3 py-2 text-sm text-[#9ca3af] hover:text-[#a3e635] border border-[#2a2d35] rounded-lg transition-colors cursor-pointer"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
