"use client";

import { useState } from "react";
import { BotonSubmit } from "@/components/boton-submit";
import { CreadorConfig } from "@/components/config-creator";
import { crearRepartidor, toggleActivo, renombrarRepartidor } from "@/actions/repartidores";

interface RepartidorConPedidos {
  id: number;
  nombre: string;
  activo: boolean;
  _count: {
    pedidos: number;
  };
}

interface Props {
  initialRepartidores: RepartidorConPedidos[];
}

export function RepartidoresConfigUI({ initialRepartidores }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos"); // "todos", "activos", "inactivos"

  // Filter local array in memory
  const repartidoresFiltrados = busqueda.trim()
    ? initialRepartidores.filter((r) =>
        r.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : initialRepartidores;

  const activos = estadoFiltro === "inactivos"
    ? []
    : repartidoresFiltrados.filter((r) => r.activo);

  const inactivos = estadoFiltro === "activos"
    ? []
    : repartidoresFiltrados.filter((r) => !r.activo);

  return (
    <div className="space-y-6">
      {/* CARD 1: Creador Inline Compacto */}
      <CreadorConfig
        action={crearRepartidor}
        placeholder="Nombre del repartidor"
        inputId="nuevo-repartidor-input"
      />

      {/* CARD 2: Búsqueda y Listado Unificados */}
      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
        {/* Cabecera / Buscador + Filtro Estado */}
        <div className="px-5 py-4 border-b border-[#2a2d35] bg-[#161920]/40 flex gap-4">
          <input
            type="search"
            placeholder="Buscar repartidor por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635]"
          />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] w-48"
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>
        </div>

        {/* Tabla */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs bg-[#171920]">
              <th className="text-left px-4 py-3 font-medium">Nombre</th>
              <th className="text-right px-4 py-3 font-medium w-32">Pedidos</th>
              <th className="px-4 py-3 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {activos.length === 0 && inactivos.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-[#6b7280]">
                  {busqueda ? `Sin resultados para "${busqueda}"` : "No hay repartidores cargados."}
                </td>
              </tr>
            ) : (
              <>
                {/* Activos */}
                {activos.map((r) => (
                  <tr key={r.id} className="border-b border-[#22252e] last:border-0 hover:bg-[#22252e]/30 transition-colors">
                    <td className="px-4 py-2">
                      <form action={renombrarRepartidor} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <input
                          name="nombre"
                          defaultValue={r.nombre}
                          className="border border-[#2a2d35] rounded px-2 py-1 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] w-48"
                        />
                        <BotonSubmit className="text-xs text-[#a3e635] hover:underline whitespace-nowrap">
                          Renombrar
                        </BotonSubmit>
                      </form>
                    </td>
                    <td className="px-4 py-2 text-right text-[#6b7280] font-medium">{r._count.pedidos}</td>
                    <td className="px-4 py-2 text-right">
                      <form action={toggleActivo}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="activo" value="true" />
                        <BotonSubmit className="text-xs text-[#6b7280] hover:text-red-500 font-medium">
                          Desactivar
                        </BotonSubmit>
                      </form>
                    </td>
                  </tr>
                ))}

                {/* Inactivos */}
                {inactivos.length > 0 && (
                  <>
                    {estadoFiltro === "todos" && (
                      <tr className="bg-[#22252e]/50">
                        <td colSpan={3} className="px-4 py-2 text-xs text-[#6b7280] font-semibold tracking-wider uppercase">
                          Inactivos
                        </td>
                      </tr>
                    )}
                    {inactivos.map((r) => (
                      <tr key={r.id} className="border-b border-[#22252e] last:border-0 opacity-60 hover:bg-[#22252e]/30 transition-colors">
                        <td className="px-4 py-2 text-[#9ca3af] font-medium pl-6">{r.nombre}</td>
                        <td className="px-4 py-2 text-right text-[#6b7280]">{r._count.pedidos}</td>
                        <td className="px-4 py-2 text-right">
                          <form action={toggleActivo}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="activo" value="false" />
                            <BotonSubmit className="text-xs text-[#4ade80] hover:underline font-medium">
                              Activar
                            </BotonSubmit>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
