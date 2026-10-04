"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { IconoCaja } from "@/components/icono-caja";

export interface ResumenRepartidorItem {
  id: number | null;
  nombre: string;
  cajas: number;
  pedidos: number;
}

interface Props {
  fecha: string;
  repartidores: ResumenRepartidorItem[];
  repartidorActual?: string;
}

export function ChipsRepartidores({ fecha, repartidores, repartidorActual }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (repartidores.length === 0) return null;

  function toggleFiltro(idRep: number | null) {
    const sp = new URLSearchParams(searchParams.toString());
    const valStr = idRep !== null ? String(idRep) : "sin_repartidor";

    // Si ya está activo el filtro de este repartidor, lo quitamos
    if (repartidorActual === valStr) {
      sp.delete("repartidor");
    } else {
      sp.set("repartidor", valStr);
    }

    router.push(`/pedidos/${fecha}${sp.size ? "?" + sp.toString() : ""}`);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4 p-2.5 bg-[#16181f] border border-[#2a2d35] rounded-lg text-xs">
      <div className="flex items-center gap-1.5 text-[#6b7280] font-medium shrink-0 mr-1 uppercase text-[10px] tracking-wider">
        <IconoCaja size={13} className="text-[#6b7280]" />
        <span>Cajas por repartidor:</span>
      </div>

      {repartidores.map((r) => {
        const esSinAsignar = r.id === null;
        const valStr = esSinAsignar ? "sin_repartidor" : String(r.id);
        const estaActivo = repartidorActual === valStr;

        return (
          <button
            key={r.id ?? "sin-asignar"}
            type="button"
            onClick={() => toggleFiltro(r.id)}
            title={
              estaActivo
                ? esSinAsignar
                  ? "Quitar filtro de sin chofer"
                  : `Quitar filtro de ${r.nombre}`
                : esSinAsignar
                ? "Filtrar pedidos sin chofer asignado"
                : `Filtrar entregas de ${r.nombre}`
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all select-none cursor-pointer ${
              estaActivo
                ? esSinAsignar
                  ? "bg-red-900/40 text-red-300 border border-red-500/80 font-medium shadow-xs"
                  : "bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/50 font-medium shadow-xs"
                : esSinAsignar
                ? "bg-red-950/40 text-red-300 border border-red-800/60 hover:border-red-500/60"
                : "bg-[#1c1f26] text-[#d1d5db] border border-[#2a2d35] hover:border-[#a3e635]/60 hover:text-white"
            }`}
          >
            {esSinAsignar && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
            <span>{r.nombre}:</span>
            <span className="font-semibold text-[#f9fafb] inline-flex items-center gap-1">
              <IconoCaja size={11} className={estaActivo ? (esSinAsignar ? "text-red-400" : "text-[#a3e635]") : "text-[#9ca3af]"} />
              {r.cajas}
            </span>
            <span className="text-[11px] opacity-70">({r.pedidos} ped)</span>

            {estaActivo && (
              <X size={12} className="ml-0.5 hover:text-white shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
