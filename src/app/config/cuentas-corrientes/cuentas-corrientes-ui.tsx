"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BotonSubmit } from "@/components/boton-submit";
import {
  crearCuentaCorriente,
  actualizarCuentaCorriente,
  toggleActivoCuentaCorriente,
} from "@/actions/cuentas-corrientes";

interface CuentaConClientes {
  id: number;
  nombre: string;
  diaCobranza: string | null;
  observaciones: string | null;
  activo: boolean;
  _count: {
    clientes: number;
  };
}

interface Props {
  initialCuentas: CuentaConClientes[];
}

export function CuentasCorrientesConfigUI({ initialCuentas }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos"); // "todos", "activos", "inactivos"
  const [orden, setOrden] = useState("nombre"); // "nombre", "clientes"

  const formCrearRef = useRef<HTMLFormElement>(null);

  // Acción de creación
  const handleCrear = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await crearCuentaCorriente(fd);
        formCrearRef.current?.reset();
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Error al crear cuenta corriente");
      }
    });
  };

  // Acción de edición
  const handleEditar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await actualizarCuentaCorriente(fd);
        setEditandoId(null);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Error al actualizar cuenta corriente");
      }
    });
  };

  // Acción de toggle activo
  const handleToggle = async (id: number, activoActual: boolean) => {
    const fd = new FormData();
    fd.append("id", id.toString());
    fd.append("activo", activoActual.toString());
    startTransition(async () => {
      try {
        await toggleActivoCuentaCorriente(fd);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Error al cambiar estado");
      }
    });
  };

  // Filtrado local en memoria
  const filtradas = busqueda.trim()
    ? initialCuentas.filter((c) =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.diaCobranza && c.diaCobranza.toLowerCase().includes(busqueda.toLowerCase())) ||
        (c.observaciones && c.observaciones.toLowerCase().includes(busqueda.toLowerCase()))
      )
    : initialCuentas;

  const activas = estadoFiltro === "inactivos"
    ? []
    : filtradas.filter((c) => c.activo);

  const inactivas = estadoFiltro === "activos"
    ? []
    : filtradas.filter((c) => !c.activo);

  // Ordenamiento local en memoria
  const ordenar = (lista: CuentaConClientes[]) => {
    return [...lista].sort((a, b) => {
      if (orden === "nombre") {
        return a.nombre.localeCompare(b.nombre);
      } else if (orden === "clientes") {
        return b._count.clientes - a._count.clientes;
      }
      return 0;
    });
  };

  const activasOrdenadas = ordenar(activas);
  const inactivasOrdenadas = ordenar(inactivas);

  const estaCargando = isPending;

  return (
    <div className="space-y-6">
      {/* CARD 1: Creador Inline de Cuentas Corrientes */}
      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-5">
        <h3 className="text-sm font-semibold text-[#f9fafb] mb-4">Nueva Cuenta Corriente</h3>
        <form
          ref={formCrearRef}
          onSubmit={handleCrear}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <div>
            <label htmlFor="crear-nombre" className="block text-xs font-medium text-[#9ca3af] mb-1.5">
              Nombre de la Cuenta *
            </label>
            <input
              id="crear-nombre"
              name="nombre"
              required
              placeholder="Ej: PANERA ROSA"
              className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] transition-colors placeholder:text-gray-600"
            />
          </div>
          <div>
            <label htmlFor="crear-dia" className="block text-xs font-medium text-[#9ca3af] mb-1.5">
              Día de Cobro (Opcional)
            </label>
            <input
              id="crear-dia"
              name="diaCobranza"
              placeholder="Ej: LUNES, SABADO"
              className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] transition-colors placeholder:text-gray-600"
            />
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="crear-obs" className="block text-xs font-medium text-[#9ca3af] mb-1.5">
                Observaciones (Opcional)
              </label>
              <input
                id="crear-obs"
                name="observaciones"
                placeholder="Notas o comentarios..."
                className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] transition-colors placeholder:text-gray-600"
              />
            </div>
            <BotonSubmit className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-5 py-2 rounded-lg text-sm font-semibold transition-all h-9 shrink-0 flex items-center justify-center">
              Agregar
            </BotonSubmit>
          </div>
        </form>
      </div>

      {/* CARD 2: Búsqueda y Listado */}
      <div className={`bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden transition-opacity ${estaCargando ? "opacity-60" : ""}`}>
        {/* Filtros */}
        <div className="px-5 py-4 border-b border-[#2a2d35] bg-[#161920]/40 flex flex-col sm:flex-row gap-4">
          <input
            type="search"
            placeholder="Buscar por nombre, día o comentarios..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] placeholder:text-gray-600"
          />
          <div className="flex gap-2">
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] w-40 sm:w-44"
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Solo activas</option>
              <option value="inactivos">Solo inactivas</option>
            </select>
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] w-40 sm:w-44"
            >
              <option value="nombre">Orden alfabético</option>
              <option value="clientes">Cantidad de locales</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs bg-[#171920]">
                <th className="text-left px-4 py-3 font-medium min-w-[200px]">Nombre</th>
                <th className="text-left px-4 py-3 font-medium min-w-[150px]">Día Cobranza</th>
                <th className="text-left px-4 py-3 font-medium min-w-[200px]">Observaciones</th>
                <th className="text-right px-4 py-3 font-medium w-28">Locales</th>
                <th className="px-4 py-3 w-40 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activasOrdenadas.length === 0 && inactivasOrdenadas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#6b7280]">
                    {busqueda ? `Sin resultados para "${busqueda}"` : "No hay cuentas corrientes cargadas."}
                  </td>
                </tr>
              ) : (
                <>
                  {/* Cuentas Activas */}
                  {activasOrdenadas.map((cc) => {
                    const editando = editandoId === cc.id;
                    return (
                      <tr
                        key={cc.id}
                        className={`border-b border-[#22252e] last:border-0 hover:bg-[#22252e]/30 transition-colors ${
                          editando ? "bg-[#1f232d]/40" : ""
                        }`}
                      >
                        {editando ? (
                          <>
                            <td className="px-4 py-2">
                              {/* Formulario de actualización inline */}
                              <form id={`edit-form-${cc.id}`} onSubmit={handleEditar}>
                                <input type="hidden" name="id" value={cc.id} />
                              </form>
                              <input
                                form={`edit-form-${cc.id}`}
                                name="nombre"
                                required
                                defaultValue={cc.nombre}
                                className="w-full border border-[#2a2d35] rounded px-2.5 py-1 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635]"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                form={`edit-form-${cc.id}`}
                                name="diaCobranza"
                                defaultValue={cc.diaCobranza ?? ""}
                                placeholder="Ej: LUNES"
                                className="w-full border border-[#2a2d35] rounded px-2.5 py-1 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] placeholder:text-gray-700"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                form={`edit-form-${cc.id}`}
                                name="observaciones"
                                defaultValue={cc.observaciones ?? ""}
                                placeholder="..."
                                className="w-full border border-[#2a2d35] rounded px-2.5 py-1 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] placeholder:text-gray-700"
                              />
                            </td>
                            <td className="px-4 py-2 text-right text-[#6b7280] font-medium">
                              {cc._count.clientes}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <BotonSubmit
                                  form={`edit-form-${cc.id}`}
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
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-medium text-[#f9fafb]">
                              <Link
                                href={`/pagos-semanales/${cc.id}`}
                                className="hover:text-[#a3e635] hover:underline transition-colors"
                              >
                                {cc.nombre}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-[#9ca3af]">{cc.diaCobranza ?? "—"}</td>
                            <td className="px-4 py-3 text-[#6b7280] italic truncate max-w-[240px]">
                              {cc.observaciones ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-right text-[#6b7280] font-medium">
                              {cc._count.clientes}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-4">
                                <button
                                  onClick={() => setEditandoId(cc.id)}
                                  className="text-xs text-[#6b7280] hover:text-[#a3e635] font-medium"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleToggle(cc.id, cc.activo)}
                                  className="text-xs text-[#6b7280] hover:text-red-500 font-medium"
                                >
                                  Desactivar
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}

                  {/* Cuentas Inactivas */}
                  {inactivasOrdenadas.length > 0 && (
                    <>
                      {estadoFiltro === "todos" && (
                        <tr className="bg-[#22252e]/50">
                          <td colSpan={5} className="px-4 py-2 text-xs text-[#6b7280] font-semibold tracking-wider uppercase">
                            Inactivas
                          </td>
                        </tr>
                      )}
                      {inactivasOrdenadas.map((cc) => (
                        <tr
                          key={cc.id}
                          className="border-b border-[#22252e] last:border-0 opacity-50 hover:bg-[#22252e]/30 transition-colors"
                        >
                          <td className="px-4 py-3 pl-6 font-medium text-[#9ca3af]">{cc.nombre}</td>
                          <td className="px-4 py-3 text-[#6b7280]">{cc.diaCobranza ?? "—"}</td>
                          <td className="px-4 py-3 text-[#6b7280] italic truncate max-w-[240px]">
                            {cc.observaciones ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-[#6b7280]">{cc._count.clientes}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggle(cc.id, cc.activo)}
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
    </div>
  );
}
