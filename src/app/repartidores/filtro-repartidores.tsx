"use client";

import { useState } from "react";
import Link from "next/link";
import { formatearPeso } from "@/lib/utils";

interface ResumenRepartidor {
  repartidor: { id: number; nombre: string };
  cantPedidos: number;
  totalCajas: number;
  totalMonto: number;
  totalCobrado: number;
}

export function FiltroRepartidores({ resumen }: { resumen: ResumenRepartidor[] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = busqueda
    ? resumen.filter((r) => r.repartidor.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : resumen;

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar repartidor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] w-64"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtrados.length === 0 ? (
          <p className="text-[#6b7280] text-sm py-4">Sin resultados para &ldquo;{busqueda}&rdquo;</p>
        ) : (
          filtrados.map(({ repartidor, cantPedidos, totalCajas, totalMonto, totalCobrado }) => (
            <Link
              key={repartidor.id}
              href={`/repartidores/${repartidor.id}`}
              className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] hover:border-[#a3e635] px-5 py-4 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#f9fafb] group-hover:text-[#a3e635]">
                  {repartidor.nombre}
                </span>
                {cantPedidos > 0 ? (
                  <span className="text-sm font-bold text-[#4ade80]">
                    {formatearPeso(totalCobrado)} cobrado
                  </span>
                ) : (
                  <span className="text-xs text-[#6b7280]">Sin actividad hoy</span>
                )}
              </div>
              {cantPedidos > 0 && (
                <div className="flex gap-4 mt-1 text-xs text-[#6b7280]">
                  <span>{cantPedidos} pedidos</span>
                  <span>{totalCajas} cajas</span>
                  <span>Facturado: {formatearPeso(totalMonto)}</span>
                  {totalMonto > totalCobrado && (
                    <span className="text-red-500">
                      Pendiente: {formatearPeso(totalMonto - totalCobrado)}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </>
  );
}
