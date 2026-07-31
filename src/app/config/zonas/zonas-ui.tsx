"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BotonSubmit } from "@/components/boton-submit";
import { CreadorConfig } from "@/components/config-creator";
import { crearZona, renombrarZona } from "@/actions/zonas";

interface ZonaConClientes {
  id: number;
  nombre: string;
  _count: {
    clientes: number;
  };
}

interface Props {
  initialZonas: ZonaConClientes[];
}

export function ZonasConfigUI({ initialZonas }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("nombre"); // "nombre" o "clientes"

  // Acción de edición
  const handleEditar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await renombrarZona(fd);
        setEditandoId(null);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Error al renombrar zona");
      }
    });
  };

  // Filtrado en memoria
  let filtradas = busqueda.trim()
    ? initialZonas.filter((z) =>
        z.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : [...initialZonas];

  // Ordenamiento en memoria
  if (orden === "nombre") {
    filtradas.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } else if (orden === "clientes") {
    filtradas.sort((a, b) => b._count.clientes - a._count.clientes);
  }

  return (
    <div className="space-y-6">
      {/* CARD 1: Creador Inline Compacto */}
      <CreadorConfig
        action={crearZona}
        placeholder="Nombre de la zona"
        inputId="nueva-zona-input"
      />

      {/* CARD 2: Búsqueda y Listado Unificados */}
      <div className={`bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden transition-opacity ${isPending ? "opacity-60" : ""}`}>
        {/* Cabecera / Buscador + Orden */}
        <div className="px-5 py-4 border-b border-[#2a2d35] bg-[#161920]/40 flex gap-4">
          <input
            type="search"
            placeholder="Buscar zona por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] placeholder:text-gray-600"
          />
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] w-48"
          >
            <option value="nombre">Orden alfabético</option>
            <option value="clientes">Cantidad de clientes</option>
          </select>
        </div>

        {/* Tabla */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs bg-[#171920]">
              <th className="text-left px-4 py-3 font-medium">Nombre</th>
              <th className="text-right px-4 py-3 font-medium w-32">Clientes</th>
              <th className="px-4 py-3 w-40 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-[#6b7280]">
                  {busqueda ? `Sin resultados para "${busqueda}"` : "Sin zonas cargadas."}
                </td>
              </tr>
            ) : (
              filtradas.map((z) => {
                const editando = editandoId === z.id;
                return (
                  <tr
                    key={z.id}
                    className={`border-b border-[#22252e] last:border-0 hover:bg-[#22252e]/30 transition-colors ${
                      editando ? "bg-[#1f232d]/40" : ""
                    }`}
                  >
                    <td className="px-4 py-2">
                      {editando ? (
                        <form id={`edit-form-${z.id}`} onSubmit={handleEditar}>
                          <input type="hidden" name="id" value={z.id} />
                          <input
                            name="nombre"
                            required
                            defaultValue={z.nombre}
                            className="border border-[#2a2d35] rounded px-2.5 py-1 text-sm bg-[#13161e] text-white focus:outline-none focus:border-[#a3e635] w-64"
                          />
                        </form>
                      ) : (
                        <span className="font-medium text-[#f9fafb]">{z.nombre}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-[#6b7280] font-medium">{z._count.clientes}</td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {editando ? (
                          <>
                            <BotonSubmit
                              form={`edit-form-${z.id}`}
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
                          <button
                            onClick={() => setEditandoId(z.id)}
                            className="text-xs text-[#6b7280] hover:text-[#a3e635] font-medium"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
