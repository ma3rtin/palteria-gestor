"use client";

import { useState, useEffect } from "react";
import { BotonSubmit } from "@/components/boton-submit";

interface Producto {
  id: number;
  nombre: string;
  precioReferencia: number;
  kgPorCaja: number | null;
  stockCajas: number;
  activo: boolean;
  costo: number;
}

interface Props {
  productos: Producto[];
  crearProducto: (formData: FormData) => Promise<void>;
  actualizarPrecio: (formData: FormData) => Promise<void>;
  actualizarCosto: (formData: FormData) => Promise<void>;
  actualizarKg: (formData: FormData) => Promise<void>;
  actualizarStock: (formData: FormData) => Promise<void>;
  toggleProducto: (formData: FormData) => Promise<void>;
}

function FilaProducto({
  p,
  actualizarPrecio,
  actualizarCosto,
  actualizarKg,
  actualizarStock,
  toggleProducto,
}: {
  p: Producto;
  actualizarPrecio: Props["actualizarPrecio"];
  actualizarCosto: Props["actualizarCosto"];
  actualizarKg: Props["actualizarKg"];
  actualizarStock: Props["actualizarStock"];
  toggleProducto: Props["toggleProducto"];
}) {
  const [precio, setPrecio] = useState<number | "">(p.precioReferencia);
  const [costo, setCosto] = useState<number | "">(p.costo);
  const [kg, setKg] = useState<number | "">(p.kgPorCaja ?? "");
  const [stock, setStock] = useState<number | "">(p.stockCajas);

  useEffect(() => { setPrecio(p.precioReferencia); }, [p.precioReferencia]);
  useEffect(() => { setCosto(p.costo); }, [p.costo]);
  useEffect(() => { setKg(p.kgPorCaja ?? ""); }, [p.kgPorCaja]);
  useEffect(() => { setStock(p.stockCajas); }, [p.stockCajas]);

  const precioDirty = precio !== p.precioReferencia;
  const costoDirty = costo !== p.costo;
  const kgDirty = kg !== (p.kgPorCaja ?? "");
  const stockDirty = stock !== p.stockCajas;

  return (
    <tr className={`border-b border-[#22252e] last:border-0 ${!p.activo ? "opacity-50" : ""}`}>
      <td className="px-4 py-3 font-medium text-[#f9fafb]">{p.nombre}</td>

      <td className="px-4 py-3">
        <form action={actualizarKg} className="flex items-center justify-end gap-2">
          <input type="hidden" name="id" value={p.id} />
          <select
            name="kgPorCaja"
            value={kg}
            onChange={(e) => setKg(e.target.value === "" ? "" : parseFloat(e.target.value))}
            className="w-20 border border-[#2a2d35] rounded px-2 py-1 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635]"
          >
            <option value="">—</option>
            <option value="10">10 kg</option>
            <option value="11">11 kg</option>
          </select>
          {kgDirty && (
            <BotonSubmit className="text-xs text-[#a3e635] hover:underline whitespace-nowrap">
              Guardar
            </BotonSubmit>
          )}
        </form>
      </td>

      <td className="px-4 py-3">
        <form action={actualizarStock} className="flex items-center justify-end gap-2">
          <input type="hidden" name="id" value={p.id} />
          <input
            name="stockCajas"
            type="number"
            step={0.5}
            min={0}
            required
            placeholder="0"
            value={stock}
            onChange={(e) => {
              const val = e.target.value;
              setStock(val === "" ? "" : parseFloat(val));
            }}
            className={`w-24 border rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#a3e635] ${
              p.stockCajas <= 0 ? "border-red-800 text-red-400" : "border-[#2a2d35]"
            }`}
          />
          {stockDirty && (
            <BotonSubmit className="text-xs text-[#a3e635] hover:underline whitespace-nowrap">
              Guardar
            </BotonSubmit>
          )}
        </form>
      </td>

      <td className="px-4 py-3">
        <form action={actualizarCosto} className="flex items-center justify-end gap-2">
          <input type="hidden" name="id" value={p.id} />
          <input
            name="costo"
            type="number"
            step={1000}
            required
            placeholder="0"
            value={costo}
            onChange={(e) => {
              const val = e.target.value;
              setCosto(val === "" ? "" : parseFloat(val));
            }}
            className="w-28 border border-[#2a2d35] rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#a3e635]"
          />
          {costoDirty && (
            <BotonSubmit className="text-xs text-[#a3e635] hover:underline whitespace-nowrap">
              Guardar
            </BotonSubmit>
          )}
        </form>
      </td>

      <td className="px-4 py-3">
        <form action={actualizarPrecio} className="flex items-center justify-end gap-2">
          <input type="hidden" name="id" value={p.id} />
          <input
            name="precioReferencia"
            type="number"
            step={1000}
            required
            placeholder="0"
            value={precio}
            onChange={(e) => {
              const val = e.target.value;
              setPrecio(val === "" ? "" : parseFloat(val));
            }}
            className="w-28 border border-[#2a2d35] rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#a3e635]"
          />
          {precioDirty && (
            <BotonSubmit className="text-xs text-[#a3e635] hover:underline whitespace-nowrap">
              Guardar
            </BotonSubmit>
          )}
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
  );
}

export function ProductosUI({
  productos,
  crearProducto,
  actualizarPrecio,
  actualizarCosto,
  actualizarKg,
  actualizarStock,
  toggleProducto,
}: Props) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = busqueda
    ? productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : productos;

  return (
    <div>
      {/* Fila superior: form + buscador */}
      <div className="flex gap-4 items-end mb-6">
        <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-4 flex gap-3 flex-wrap items-end flex-1">
          <div className="flex flex-col gap-1 flex-1 min-w-32">
            <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Nombre *</label>
            <input
              form="form-crear"
              name="nombre"
              required
              placeholder="CAT, WHITE, PERU 60..."
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
            />
          </div>
          <div className="flex flex-col gap-1 w-24">
            <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Kg/caja</label>
            <select
              form="form-crear"
              name="kgPorCaja"
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635]"
            >
              <option value="">—</option>
              <option value="10">10 kg</option>
              <option value="11">11 kg</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-28">
            <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Stock inicial</label>
            <input
              form="form-crear"
              name="stockCajas"
              type="number"
              step={0.5}
              min={0}
              placeholder="0"
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
            />
          </div>
          <div className="flex flex-col gap-1 w-28">
            <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Costo/caja</label>
            <input
              form="form-crear"
              name="costo"
              type="number"
              required
              step={1000}
              placeholder="0"
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
            />
          </div>
          <div className="flex flex-col gap-1 w-28">
            <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Precio/caja *</label>
            <input
              form="form-crear"
              name="precioReferencia"
              type="number"
              required
              step={1000}
              placeholder="0"
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
            />
          </div>
          <form id="form-crear" action={crearProducto}>
            <BotonSubmit className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Agregar
            </BotonSubmit>
          </form>
        </div>

        <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-4 self-stretch flex items-center w-56 relative">
          <input
            type="search"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#13161e] focus:outline-none focus:border-[#a3e635] text-white"
          />
        </div>
      </div>

      {/* Tabla full-width */}
      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
              <th className="text-left px-4 py-3 font-medium">Producto</th>
              <th className="text-right px-4 py-3 font-medium">Kg/caja</th>
              <th className="text-right px-4 py-3 font-medium">Stock (cajas)</th>
              <th className="text-right px-4 py-3 font-medium">Costo ref.</th>
              <th className="text-right px-4 py-3 font-medium">Precio ref.</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[#6b7280] text-sm">
                  {busqueda ? `Sin resultados para "${busqueda}"` : "Sin productos cargados."}
                </td>
              </tr>
            ) : (
              filtrados.map((p) => (
                <FilaProducto
                  key={p.id}
                  p={p}
                  actualizarPrecio={actualizarPrecio}
                  actualizarCosto={actualizarCosto}
                  actualizarKg={actualizarKg}
                  actualizarStock={actualizarStock}
                  toggleProducto={toggleProducto}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
