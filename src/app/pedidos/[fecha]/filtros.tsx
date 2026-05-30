"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

interface Zona { id: number; nombre: string }
interface Repartidor { id: number; nombre: string }

interface Props {
  fecha: string;
  zonas: Zona[];
  repartidores: Repartidor[];
  zonaActual?: string;
  repartidorActual?: string;
  estadoActual?: string;
  busquedaActual?: string;
}

const ESTADOS = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "PARCIAL",   label: "Parcial" },
  { value: "PAGADO",    label: "Pagado" },
];

export function FiltrosPedidos({ fecha, zonas, repartidores, zonaActual, repartidorActual, estadoActual, busquedaActual }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState(busquedaActual ?? "");

  function actualizar(zona: string, rep: string, estado: string, q: string) {
    const sp = new URLSearchParams();
    if (zona)   sp.set("zona", zona);
    if (rep)    sp.set("repartidor", rep);
    if (estado) sp.set("estado", estado);
    if (q)      sp.set("q", q);
    
    startTransition(() => {
      router.push(`/pedidos/${fecha}${sp.size ? "?" + sp.toString() : ""}`);
    });
  }

  // Debounce para búsqueda natural - Aumentado a 500ms
  useEffect(() => {
    if (busqueda === (busquedaActual ?? "")) return;

    const timer = setTimeout(() => {
      actualizar(zonaActual ?? "", repartidorActual ?? "", estadoActual ?? "", busqueda);
    }, 500);

    return () => clearTimeout(timer);
  }, [busqueda]);

  // Sincronizar solo cuando no hay una carga pendiente para no pisar el input
  useEffect(() => {
    if (!isPending) {
      setBusqueda(busquedaActual ?? "");
    }
  }, [busquedaActual, isPending]);

  const hayFiltros = zonaActual || repartidorActual || estadoActual || busquedaActual;

  return (
    <div className={`flex gap-2 mb-4 flex-wrap transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
      <div className="relative">
        <input
          type="search"
          placeholder="Buscar cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] w-48 text-white"
        />
        {isPending && (
          <div className="absolute right-2 top-2.5">
            <div className="w-4 h-4 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <select
        value={zonaActual ?? ""}
        onChange={(e) => actualizar(e.target.value, repartidorActual ?? "", estadoActual ?? "", busqueda)}
        className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] text-white"
      >
        <option value="">Todas las zonas</option>
        {zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
      </select>

      <select
        value={repartidorActual ?? ""}
        onChange={(e) => actualizar(zonaActual ?? "", e.target.value, estadoActual ?? "", busqueda)}
        className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] text-white"
      >
        <option value="">Todos los repartidores</option>
        {repartidores.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
      </select>

      <select
        value={estadoActual ?? ""}
        onChange={(e) => actualizar(zonaActual ?? "", repartidorActual ?? "", e.target.value, busqueda)}
        className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] text-white"
      >
        <option value="">Todos los estados</option>
        {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
      </select>

      {hayFiltros && (
        <button
          onClick={() => { setBusqueda(""); actualizar("", "", "", ""); }}
          className="px-3 py-2 text-sm text-[#9ca3af] hover:text-[#a3e635] border border-[#2a2d35] rounded-lg transition-colors"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
