"use client";

import { useState } from "react";
import { BotonSubmit } from "@/components/boton-submit";
import { CreadorConfig } from "@/components/config-creator";
import { crearRevendedor, toggleRevendedor } from "@/actions/revendedores";

interface RevendedorConClientes {
  id: number;
  nombre: string;
  activo: boolean;
  _count: {
    clientes: number;
  };
}

interface Props {
  initialRevendedores: RevendedorConClientes[];
}

export function RevendedoresConfigUI({ initialRevendedores }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos"); // "todos", "activos", "inactivos"

  // Filter local array in memory
  const filtrados = busqueda.trim()
    ? initialRevendedores.filter((r) =>
        r.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : initialRevendedores;

  const activos = estadoFiltro === "inactivos"
    ? []
    : filtrados.filter((r) => r.activo);

  const inactivos = estadoFiltro === "activos"
    ? []
    : filtrados.filter((r) => !r.activo);

  return (
    <div className="space-y-6">
      {/* CARD 1: Creador Inline Compacto */}
      <CreadorConfig
        action={crearRevendedor}
        placeholder="Nombre del revendedor"
        inputId="nuevo-revendedor-input"
      />

      {/* CARD 2: Búsqueda y Listado Unificados */}
      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
        {/* Cabecera / Buscador + Filtro Estado */}
        <div className="px-5 py-4 border-b border-[#2a2d35] bg-[#161920]/40 flex gap-4">
          <input
            type="search"
            placeholder="Buscar revendedor por nombre..."
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
              <th className="text-right px-4 py-3 font-medium w-32">Clientes</th>
              <th className="px-4 py-3 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {activos.length === 0 && inactivos.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-[#6b7280]">
                  {busqueda ? `Sin resultados para "${busqueda}"` : "Sin revendedores cargados."}
                </td>
              </tr>
            ) : (
              <>
                {/* Activos */}
                {activos.map((r) => (
                  <tr key={r.id} className="border-b border-[#22252e] last:border-0 hover:bg-[#22252e]/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#f9fafb]">{r.nombre}</td>
                    <td className="px-4 py-3 text-right text-[#9ca3af] font-medium">{r._count.clientes}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={toggleRevendedor}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="activo" value={r.activo.toString()} />
                        <BotonSubmit className="text-xs text-[#6b7280] hover:text-[#9ca3af]">
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
                        <td className="px-4 py-3 font-medium text-[#9ca3af] pl-6">{r.nombre}</td>
                        <td className="px-4 py-3 text-right text-[#6b7280]">{r._count.clientes}</td>
                        <td className="px-4 py-3 text-right">
                          <form action={toggleRevendedor}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="activo" value={r.activo.toString()} />
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
