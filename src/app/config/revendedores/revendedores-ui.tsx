"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BotonSubmit } from "@/components/boton-submit";
import { CreadorConfig } from "@/components/config-creator";
import { crearRevendedor, toggleRevendedor, renombrarRevendedor } from "@/actions/revendedores";

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos"); // "todos", "activos", "inactivos"

  // Acción de renombrado
  const handleEditar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await renombrarRevendedor(fd);
        setEditandoId(null);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Error al renombrar revendedor");
      }
    });
  };

  // Acción de toggle activo
  const handleToggle = (id: number, activoActual: boolean) => {
    const fd = new FormData();
    fd.append("id", id.toString());
    fd.append("activo", activoActual.toString());
    startTransition(async () => {
      try {
        await toggleRevendedor(fd);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Error al cambiar estado");
      }
    });
  };

  // Filtrado local en memoria
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
      <div className={`bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden transition-opacity ${isPending ? "opacity-60" : ""}`}>
        {/* Cabecera / Buscador + Filtro Estado */}
        <div className="px-5 py-4 border-b border-[#2a2d35] bg-[#161920]/40 flex gap-4">
          <input
            type="search"
            placeholder="Buscar revendedor por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] placeholder:text-gray-600"
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
              <th className="px-4 py-3 w-48 text-center">Acciones</th>
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
                {activos.map((r) => {
                  const editando = editandoId === r.id;
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-[#22252e] last:border-0 hover:bg-[#22252e]/30 transition-colors ${
                        editando ? "bg-[#1f232d]/40" : ""
                      }`}
                    >
                      <td className="px-4 py-2">
                        {editando ? (
                          <form id={`edit-form-${r.id}`} onSubmit={handleEditar}>
                            <input type="hidden" name="id" value={r.id} />
                            <input
                              name="nombre"
                              required
                              defaultValue={r.nombre}
                              className="border border-[#2a2d35] rounded px-2.5 py-1 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] w-64"
                            />
                          </form>
                        ) : (
                          <span className="font-medium text-[#f9fafb]">{r.nombre}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-[#9ca3af] font-medium">{r._count.clientes}</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-4">
                          {editando ? (
                            <>
                              <BotonSubmit
                                form={`edit-form-${r.id}`}
                                className="text-xs text-[#a3e635] hover:underline font-medium"
                              >
                                Guardar
                              </BotonSubmit>
                              <button
                                type="button"
                                onClick={() => setEditandoId(null)}
                                className="text-xs text-[#6b7280] hover:text-white font-medium"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditandoId(r.id)}
                                className="text-xs text-[#6b7280] hover:text-[#a3e635] font-medium"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleToggle(r.id, r.activo)}
                                className="text-xs text-[#6b7280] hover:text-red-500 font-medium"
                              >
                                Desactivar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

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
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggle(r.id, r.activo)}
                            className="text-xs text-[#4ade80] hover:underline font-medium"
                          >
                            Activar
                          </button>
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
