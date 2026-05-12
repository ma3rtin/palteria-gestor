"use client";

import { useState } from "react";
import { BotonSubmit } from "@/components/boton-submit";
import { formatearPeso } from "@/lib/utils";

interface Producto {
  id: number;
  nombre: string;
  precioReferencia: number;
  activo: boolean;
}

interface Props {
  productos: Producto[];
  actualizarPrecio: (formData: FormData) => Promise<void>;
  toggleProducto: (formData: FormData) => Promise<void>;
}

export function FiltroProductos({ productos, actualizarPrecio, toggleProducto }: Props) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = busqueda
    ? productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : productos;

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635] w-64"
        />
      </div>

      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
              <th className="text-left px-4 py-3 font-medium">Producto</th>
              <th className="text-right px-4 py-3 font-medium">Precio ref. / caja</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-[#6b7280] text-sm">
                  Sin resultados para &ldquo;{busqueda}&rdquo;
                </td>
              </tr>
            ) : (
              filtrados.map((p) => (
                <tr key={p.id} className={`border-b border-[#22252e] last:border-0 ${!p.activo ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium text-[#f9fafb]">{p.nombre}</td>
                  <td className="px-4 py-3">
                    <form action={actualizarPrecio} className="flex items-center justify-end gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        name="precioReferencia"
                        type="number"
                        step={1000}
                        defaultValue={p.precioReferencia}
                        className="w-32 border border-[#2a2d35] rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#a3e635]"
                      />
                      <BotonSubmit className="text-xs text-[#a3e635] hover:underline">
                        Guardar
                      </BotonSubmit>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleProducto}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="activo" value={p.activo.toString()} />
                      <BotonSubmit className="text-xs text-[#6b7280] hover:text-[#9ca3af]">
                        {p.activo ? "Desactivar" : "Activar"}
                      </BotonSubmit>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
