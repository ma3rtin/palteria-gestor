"use client";

import { useState } from "react";
import Link from "next/link";
import { formatearPeso } from "@/lib/utils";
import { Paginador } from "@/components/paginador";

interface ResumenRepartidor {
  repartidor: { id: number; nombre: string };
  cantPedidos: number;
  totalCajas: number;
  totalMonto: number;
  totalCobrado: number;
}

export function FiltroRepartidores({ resumen }: { resumen: ResumenRepartidor[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filtrados = busqueda
    ? resumen.filter((r) => r.repartidor.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : resumen;

  const handleBusquedaChange = (val: string) => {
    setBusqueda(val);
    setPage(0);
  };

  const totalPages = Math.ceil(filtrados.length / pageSize);
  const paginados = filtrados.slice(page * pageSize, (page + 1) * pageSize);
  const hasMore = (page + 1) * pageSize < filtrados.length;

  return (
    <>
      <div className="mb-4 relative w-64">
        <input
          type="search"
          placeholder="Buscar repartidor..."
          value={busqueda}
          onChange={(e) => handleBusquedaChange(e.target.value)}
          className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] text-white"
        />
      </div>

      <div className="grid grid-cols-1 gap-2">
        {paginados.length === 0 ? (
          <p className="text-[#6b7280] text-sm py-4">Sin resultados para &ldquo;{busqueda}&rdquo;</p>
        ) : (
          paginados.map(({ repartidor, cantPedidos, totalCajas, totalMonto, totalCobrado }) => (
            <Link
              key={repartidor.id}
              href={`/repartidores/${repartidor.id}`}
              className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] hover:border-[#a3e635] px-4 py-2.5 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#f9fafb] group-hover:text-[#a3e635] transition-colors">
                    {repartidor.nombre}
                  </span>
                  {cantPedidos > 0 ? (
                    <span className="text-[10px] text-[#6b7280] bg-[#22252e] px-1.5 py-0.5 rounded font-medium">
                      {cantPedidos} pedidos · {totalCajas} cajas
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#6b7280] bg-[#22252e]/50 px-1.5 py-0.5 rounded font-medium italic">
                      Sin actividad hoy
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-right">
                  {cantPedidos > 0 && (
                    <div className="text-xs font-mono">
                      <span className="text-[#4ade80] font-semibold">{formatearPeso(totalCobrado)} cobr.</span>
                      {totalMonto > totalCobrado && (
                        <span className="text-red-500 ml-2">({formatearPeso(totalMonto - totalCobrado)} pend.)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Paginador Client-side */}
      <Paginador
        pageActual={page}
        totalPaginas={totalPages}
        totalItems={filtrados.length}
        onAnterior={() => setPage((p) => p - 1)}
        onSiguiente={() => setPage((p) => p + 1)}
        hasMore={hasMore}
        className="mt-4"
      />
    </>
  );
}
